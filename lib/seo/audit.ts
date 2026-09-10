import { ContentStatus, MarketStatus, type ContentType } from "@prisma/client";
import { buildContentCanonicalPath, getMarkdownBody } from "@/lib/content";
import { getContentBlocks, getFaqItemsFromBlocks } from "@/lib/content/blocks";
import { prisma } from "@/lib/db";
import { resolveMarketScopedCanonicalPath } from "@/lib/seo";

export type SeoAuditIssueType =
  | "missing_title_meta"
  | "multiple_h1"
  | "missing_faq"
  | "missing_schema"
  | "canonical_mismatch"
  | "hreflang_gap"
  | "orphan_content"
  | "sitemap_exclusion";

export type SeoAuditIssue = {
  type: SeoAuditIssueType;
  severity: "error" | "warning";
  contentId: string;
  title: string;
  canonicalPath: string;
  market: string;
  message: string;
};

export type SeoAuditReport = {
  generatedAt: Date;
  scannedContentCount: number;
  sitemapEligibleCount: number;
  issueCounts: Record<SeoAuditIssueType, number>;
  issues: SeoAuditIssue[];
};

const issueTypes: SeoAuditIssueType[] = [
  "missing_title_meta",
  "multiple_h1",
  "missing_faq",
  "missing_schema",
  "canonical_mismatch",
  "hreflang_gap",
  "orphan_content",
  "sitemap_exclusion",
];

function countMarkdownH1(markdown: string) {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => /^#\s+/.test(line.trim())).length;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function expectedSchemaTypes(contentType: ContentType) {
  if (contentType === "BROKER_REVIEW") return ["Article", "Review"];
  if (contentType === "BROKER_COMPARISON" || contentType === "BEST_BROKER_LIST") {
    return ["ItemList"];
  }

  return ["Article"];
}

export async function getSeoAuditReport(): Promise<SeoAuditReport> {
  const contentItems = await prisma.contentItem.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      market: { status: MarketStatus.ACTIVE },
    },
    include: {
      internalLinkTargetSuggestions: {
        where: { status: "ACCEPTED" },
        select: { id: true },
      },
      market: true,
      seoMetadata: true,
      template: true,
      translationGroup: {
        include: {
          contentItems: {
            where: {
              status: ContentStatus.PUBLISHED,
              market: { status: MarketStatus.ACTIVE },
            },
            include: {
              market: true,
              seoMetadata: true,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 1000,
  });
  const sitemapEligibleCount = contentItems.filter(
    (item) => item.seoMetadata?.robotsIndex !== "NOINDEX",
  ).length;
  const issues: SeoAuditIssue[] = [];

  function addIssue(
    item: (typeof contentItems)[number],
    type: SeoAuditIssueType,
    severity: SeoAuditIssue["severity"],
    message: string,
  ) {
    issues.push({
      type,
      severity,
      contentId: item.id,
      title: item.title,
      canonicalPath: item.canonicalPath,
      market: item.market.code,
      message,
    });
  }

  for (const item of contentItems) {
    const markdown = getMarkdownBody(item.body);
    const blocks = getContentBlocks(item.body, item.template);
    const canonicalPath = resolveMarketScopedCanonicalPath({
      canonicalPath: item.seoMetadata?.canonicalPath,
      fallbackCanonicalPath: item.canonicalPath,
      marketCode: item.market.code,
    });
    const expectedCanonicalPath = buildContentCanonicalPath({
      marketCode: item.market.code,
      contentType: item.contentType,
      slug: item.slug,
    });

    if (!item.seoMetadata?.title.trim() || !item.seoMetadata.description.trim()) {
      addIssue(
        item,
        "missing_title_meta",
        "error",
        "Published content needs an SEO title and meta description.",
      );
    }

    if (countMarkdownH1(markdown) > 1) {
      addIssue(
        item,
        "multiple_h1",
        "warning",
        "Stored markdown contains more than one H1. The renderer downgrades body H1, but content should be cleaned.",
      );
    }

    if (getFaqItemsFromBlocks(blocks).length === 0) {
      addIssue(
        item,
        "missing_faq",
        "warning",
        "No FAQ block or FAQ section was found for AEO readiness.",
      );
    }

    const schemaTypes = asStringArray(item.template.schemaTypes);
    const missingSchemaTypes = expectedSchemaTypes(item.contentType).filter(
      (schemaType) => !schemaTypes.includes(schemaType),
    );

    if (missingSchemaTypes.length > 0) {
      addIssue(
        item,
        "missing_schema",
        "warning",
        `Template schema readiness is missing: ${missingSchemaTypes.join(", ")}.`,
      );
    }

    if (
      canonicalPath !== item.canonicalPath ||
      item.canonicalPath !== expectedCanonicalPath ||
      item.seoMetadata?.canonicalPath !== expectedCanonicalPath
    ) {
      addIssue(
        item,
        "canonical_mismatch",
        "error",
        `Canonical should be ${expectedCanonicalPath}.`,
      );
    }

    const translationSiblings = item.translationGroup?.contentItems ?? [];
    const siblingLocales = new Set(
      translationSiblings.map((sibling) => sibling.market.locale),
    );

    if (translationSiblings.length > 1 && siblingLocales.size < translationSiblings.length) {
      addIssue(
        item,
        "hreflang_gap",
        "warning",
        "Translation group has duplicate or incomplete locale coverage.",
      );
    }

    for (const sibling of translationSiblings) {
      const siblingCanonical = resolveMarketScopedCanonicalPath({
        canonicalPath: sibling.seoMetadata?.canonicalPath,
        fallbackCanonicalPath: sibling.canonicalPath,
        marketCode: sibling.market.code,
      });

      if (!siblingCanonical.startsWith(`/${sibling.market.code}/`)) {
        addIssue(
          item,
          "hreflang_gap",
          "error",
          `Translation sibling ${sibling.title} has a canonical outside its market.`,
        );
      }
    }

    if (item.internalLinkTargetSuggestions.length === 0) {
      addIssue(
        item,
        "orphan_content",
        "warning",
        "Published content has no accepted incoming internal links.",
      );
    }

    if (item.seoMetadata?.robotsIndex === "NOINDEX") {
      addIssue(
        item,
        "sitemap_exclusion",
        "warning",
        "Published content is noindex, so it will be excluded from the content sitemap.",
      );
    }
  }

  const issueCounts = issueTypes.reduce<Record<SeoAuditIssueType, number>>(
    (counts, type) => {
      counts[type] = issues.filter((issue) => issue.type === type).length;
      return counts;
    },
    {
      canonical_mismatch: 0,
      hreflang_gap: 0,
      missing_faq: 0,
      missing_schema: 0,
      missing_title_meta: 0,
      multiple_h1: 0,
      orphan_content: 0,
      sitemap_exclusion: 0,
    },
  );

  return {
    generatedAt: new Date(),
    scannedContentCount: contentItems.length,
    sitemapEligibleCount,
    issueCounts,
    issues,
  };
}
