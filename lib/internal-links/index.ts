import {
  AnchorTextStatus,
  ContentStatus,
  InternalLinkRuleMode,
  InternalLinkRuleStatus,
  InternalLinkSuggestionStatus,
  type ContentItem,
  type ContentType,
  type Prisma,
} from "@prisma/client";
import { getMarkdownBody } from "@/lib/content";
import { prisma } from "@/lib/db";

export const internalLinkSuggestionStatusLabels: Record<
  InternalLinkSuggestionStatus,
  string
> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export const internalLinkRuleModeLabels: Record<InternalLinkRuleMode, string> = {
  SUGGEST_ONLY: "Suggest only",
  AUTO_APPROVE: "Auto approve",
};

export const MIN_INTERNAL_LINK_SUGGESTIONS = 3;
export const MAX_INTERNAL_LINK_SUGGESTIONS = 8;
export const DEFAULT_MAX_INTERNAL_LINKS_PER_PAGE = 6;
export const DEFAULT_MIN_WORDS_BETWEEN_INTERNAL_LINKS = 120;

type SourceContent = ContentItem & {
  market: { id: string; code: string; languageCode: string };
  primaryTopic:
    | {
        id: string;
        topicClusterId: string | null;
      }
    | null;
};

type TargetContent = Pick<
  ContentItem,
  "id" | "title" | "contentType" | "canonicalPath" | "marketId" | "primaryTopicId"
> & {
  market: { id: string; code: string; languageCode: string };
  primaryTopic:
    | {
        id: string;
        topicClusterId: string | null;
      }
    | null;
};

type ActiveRule = {
  id: string;
  name: string;
  topicClusterId: string | null;
  targetContentItemId: string | null;
  sourceContentType: ContentType | null;
  targetContentType: ContentType | null;
  mode: InternalLinkRuleMode;
  priority: number;
  maxLinksPerContent: number;
  minWordsBetweenLinks: number;
};

type ActiveAnchor = {
  id: string;
  text: string;
  topicClusterId: string | null;
  targetContentItemId: string | null;
  contentTypes: Prisma.JsonValue;
  priority: number;
};

export type RenderableInternalLink = {
  anchorText: string;
  targetPath: string;
  targetTitle: string;
  score: number;
  maxLinksPerContent: number;
  minWordsBetweenLinks: number;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasAnchorText(markdown: string, anchorText: string) {
  if (!anchorText.trim()) {
    return false;
  }

  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(anchorText)}([^\\p{L}\\p{N}]|$)`, "iu").test(
    markdown,
  );
}

function asContentTypeArray(value: Prisma.JsonValue) {
  return Array.isArray(value)
    ? value.filter((item): item is ContentType =>
        typeof item === "string" &&
        [
          "ARTICLE",
          "GUIDE",
          "BROKER_REVIEW",
          "BROKER_COMPARISON",
          "BEST_BROKER_LIST",
          "COUNTRY_HUB",
          "TOPIC_HUB",
          "GLOSSARY_TERM",
          "LANDING_PAGE",
        ].includes(item),
      )
    : [];
}

function targetMatchesRule(target: TargetContent, rule: ActiveRule | null) {
  if (!rule) {
    return true;
  }

  if (rule.targetContentItemId && rule.targetContentItemId !== target.id) {
    return false;
  }

  if (rule.targetContentType && rule.targetContentType !== target.contentType) {
    return false;
  }

  if (
    rule.topicClusterId &&
    rule.topicClusterId !== target.primaryTopic?.topicClusterId
  ) {
    return false;
  }

  return true;
}

function anchorMatchesTarget(anchor: ActiveAnchor, target: TargetContent) {
  const contentTypes = asContentTypeArray(anchor.contentTypes);

  if (anchor.targetContentItemId && anchor.targetContentItemId !== target.id) {
    return false;
  }

  if (
    anchor.topicClusterId &&
    anchor.topicClusterId !== target.primaryTopic?.topicClusterId
  ) {
    return false;
  }

  if (contentTypes.length > 0 && !contentTypes.includes(target.contentType)) {
    return false;
  }

  return true;
}

function scoreCandidate(input: {
  source: SourceContent;
  target: TargetContent;
  rule: ActiveRule | null;
  anchor: ActiveAnchor | null;
  priorityContentItemId?: string | null;
}) {
  let score = 10;

  if (
    input.source.primaryTopic?.topicClusterId &&
    input.source.primaryTopic.topicClusterId ===
      input.target.primaryTopic?.topicClusterId
  ) {
    score += 40;
  }

  if (input.rule?.topicClusterId) {
    score += 20;
  }

  if (input.rule?.targetContentItemId === input.target.id) {
    score += 30;
  }

  if (input.priorityContentItemId === input.target.id) {
    score += 25;
  }

  score += Math.max(0, 100 - (input.rule?.priority ?? 100));
  score += Math.max(0, 100 - (input.anchor?.priority ?? 100));

  return score;
}

export async function generateInternalLinkSuggestionsForContent(
  contentItemId: string,
) {
  const source = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: {
      market: { select: { id: true, code: true, languageCode: true } },
      primaryTopic: { select: { id: true, topicClusterId: true } },
    },
  });

  if (!source) {
    throw new Error("Source content was not found.");
  }

  const markdown = getMarkdownBody(source.body);

  if (!markdown.trim()) {
    return { created: 0, skipped: "Source content has no markdown body." };
  }

  const [rules, anchors, targets, clusters] = await Promise.all([
    prisma.internalLinkRule.findMany({
      where: {
        marketId: source.marketId,
        languageCode: source.market.languageCode,
        status: InternalLinkRuleStatus.ACTIVE,
        OR: [
          { sourceContentType: null },
          { sourceContentType: source.contentType },
        ],
      },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.anchorText.findMany({
      where: {
        marketId: source.marketId,
        languageCode: source.market.languageCode,
        status: AnchorTextStatus.ACTIVE,
      },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.contentItem.findMany({
      where: {
        id: { not: source.id },
        marketId: source.marketId,
        status: ContentStatus.PUBLISHED,
      },
      include: {
        market: { select: { id: true, code: true, languageCode: true } },
        primaryTopic: { select: { id: true, topicClusterId: true } },
      },
      take: 200,
    }),
    prisma.topicCluster.findMany({
      where: {
        marketId: source.marketId,
        languageCode: source.market.languageCode,
      },
      select: { id: true, priorityContentItemId: true },
    }),
  ]);

  const clusterPriorityTargets = new Map(
    clusters.map((cluster) => [cluster.id, cluster.priorityContentItemId]),
  );
  const effectiveRules: (ActiveRule | null)[] = rules.length > 0 ? rules : [null];
  const candidates: {
    target: TargetContent;
    anchor: ActiveAnchor | null;
    rule: ActiveRule | null;
    score: number;
    reason: string;
  }[] = [];

  for (const rule of effectiveRules) {
    for (const target of targets) {
      if (target.market.languageCode !== source.market.languageCode) {
        continue;
      }

      if (!targetMatchesRule(target, rule)) {
        continue;
      }

      const targetAnchors = anchors.filter((anchor) =>
        anchorMatchesTarget(anchor, target),
      );
      const usableAnchors =
        targetAnchors.length > 0
          ? targetAnchors
          : [
              {
                id: "",
                text: target.title,
                topicClusterId: target.primaryTopic?.topicClusterId ?? null,
                targetContentItemId: target.id,
                contentTypes: [],
                priority: 120,
              },
            ];

      for (const anchor of usableAnchors) {
        if (!hasAnchorText(markdown, anchor.text)) {
          continue;
        }

        const priorityContentItemId = target.primaryTopic?.topicClusterId
          ? clusterPriorityTargets.get(target.primaryTopic.topicClusterId)
          : null;
        const score = scoreCandidate({
          source,
          target,
          rule,
          anchor: anchor.id ? anchor : null,
          priorityContentItemId,
        });

        candidates.push({
          target,
          anchor: anchor.id ? anchor : null,
          rule,
          score,
          reason: rule
            ? `Matched rule "${rule.name}" in the same market and language.`
            : "Matched same-market published content and available anchor text.",
        });
      }
    }
  }

  const selected = candidates
    .sort((a, b) => b.score - a.score)
    .filter((candidate, index, all) => {
      const firstTarget = all.findIndex(
        (item) => item.target.id === candidate.target.id,
      );

      return firstTarget === index;
    })
    .slice(0, MAX_INTERNAL_LINK_SUGGESTIONS);

  let created = 0;

  for (const candidate of selected) {
    const status =
      candidate.rule?.mode === InternalLinkRuleMode.AUTO_APPROVE
        ? InternalLinkSuggestionStatus.ACCEPTED
        : InternalLinkSuggestionStatus.PENDING;

    await prisma.internalLinkSuggestion.upsert({
      where: {
        sourceContentItemId_targetContentItemId_anchorText: {
          sourceContentItemId: source.id,
          targetContentItemId: candidate.target.id,
          anchorText: candidate.anchor?.text ?? candidate.target.title,
        },
      },
      update: {
        anchorTextId: candidate.anchor?.id || null,
        ruleId: candidate.rule?.id ?? null,
        marketId: source.marketId,
        languageCode: source.market.languageCode,
        reason: candidate.reason,
        score: candidate.score,
      },
      create: {
        marketId: source.marketId,
        sourceContentItemId: source.id,
        targetContentItemId: candidate.target.id,
        anchorTextId: candidate.anchor?.id || null,
        ruleId: candidate.rule?.id ?? null,
        anchorText: candidate.anchor?.text ?? candidate.target.title,
        languageCode: source.market.languageCode,
        status,
        reason: candidate.reason,
        score: candidate.score,
      },
    });
    created += 1;
  }

  return {
    created,
    skipped:
      selected.length < MIN_INTERNAL_LINK_SUGGESTIONS
        ? "Fewer than three safe matches were found."
        : null,
  };
}

export async function getRenderableInternalLinksForContent(contentItemId: string) {
  const suggestions = await prisma.internalLinkSuggestion.findMany({
    where: {
      sourceContentItemId: contentItemId,
      OR: [
        { status: InternalLinkSuggestionStatus.ACCEPTED },
        {
          rule: {
            status: InternalLinkRuleStatus.ACTIVE,
            mode: InternalLinkRuleMode.AUTO_APPROVE,
          },
        },
      ],
    },
    include: {
      market: { select: { id: true, languageCode: true } },
      rule: true,
      sourceContentItem: {
        include: { market: { select: { id: true, languageCode: true } } },
      },
      targetContentItem: {
        include: { market: { select: { id: true, languageCode: true } } },
      },
    },
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    take: MAX_INTERNAL_LINK_SUGGESTIONS,
  });

  return suggestions
    .filter(
      (suggestion) =>
        suggestion.sourceContentItem.marketId === suggestion.targetContentItem.marketId &&
        suggestion.sourceContentItem.market.languageCode ===
          suggestion.targetContentItem.market.languageCode,
    )
    .map<RenderableInternalLink>((suggestion) => ({
      anchorText: suggestion.anchorText,
      targetPath: suggestion.targetContentItem.canonicalPath,
      targetTitle: suggestion.targetContentItem.title,
      score: suggestion.score,
      maxLinksPerContent:
        suggestion.rule?.maxLinksPerContent ?? DEFAULT_MAX_INTERNAL_LINKS_PER_PAGE,
      minWordsBetweenLinks:
        suggestion.rule?.minWordsBetweenLinks ??
        DEFAULT_MIN_WORDS_BETWEEN_INTERNAL_LINKS,
    }));
}
