import {
  AffiliateLinkStatus,
  BrokerStatus,
  ContentType,
  MarketStatus,
  type Broker,
  type Market,
} from "@prisma/client";
import { normalizeCampaignToken } from "@/lib/affiliate";
import { extractAffiliateTokensFromText } from "@/lib/affiliate";
import {
  buildContentCanonicalPath,
  contentTypeLabels,
  normalizeSlug,
} from "@/lib/content";
import { validateRequiredTemplateBlocks } from "@/lib/content/blocks";
import { prisma } from "@/lib/db";

export type AiImportToken = {
  broker: string;
  campaign: string;
  market?: string;
  language?: string;
};

export type AiImportDraft = {
  title: string;
  slug: string;
  market: string;
  language: string;
  contentType: ContentType | "";
  template: string;
  body: string;
  seoTitle: string;
  metaDescription: string;
  affiliateTokens: AiImportToken[];
  brokerMentions: string[];
  translationGroupKey: string;
};

export type AiImportValidationResult = {
  errors: string[];
  warnings: string[];
  draft: AiImportDraft | null;
  preview: {
    canonicalPath: string;
    contentTypeLabel: string;
    marketLabel: string;
    templateLabel: string;
    brokerLabels: string[];
    affiliateTokenLabels: string[];
    status: "Draft only";
  } | null;
};

type AiImportJsonValue =
  | string
  | number
  | boolean
  | null
  | AiImportJsonValue[]
  | { [key: string]: AiImportJsonValue };

type ParsedInput = {
  fields: Record<string, AiImportJsonValue>;
  body: string;
};

const fieldAliases: Record<keyof Omit<AiImportDraft, "affiliateTokens" | "brokerMentions">, string[]> = {
  title: ["title"],
  slug: ["slug"],
  market: ["market", "marketCode"],
  language: ["language", "languageCode", "locale"],
  contentType: ["contentType", "content_type", "type"],
  template: ["template", "templateKey", "template_key"],
  body: ["body", "content", "markdown"],
  seoTitle: ["seoTitle", "seo_title", "seo.title"],
  metaDescription: [
    "metaDescription",
    "meta_description",
    "description",
    "seo.description",
  ],
  translationGroupKey: [
    "translationGroupKey",
    "translation_group_key",
    "translationGroup",
  ],
};

function asRecord(value: unknown): Record<string, AiImportJsonValue> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, AiImportJsonValue>)
    : {};
}

function readPath(fields: Record<string, AiImportJsonValue>, path: string) {
  if (!path.includes(".")) return fields[path];

  return path.split(".").reduce<AiImportJsonValue | undefined>((current, part) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }

    return current[part];
  }, fields);
}

function readString(fields: Record<string, AiImportJsonValue>, aliases: string[]) {
  for (const alias of aliases) {
    const value = readPath(fields, alias);

    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
  }

  return "";
}

function splitList(value: string) {
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function parseFrontmatterValue(value: string): AiImportJsonValue {
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (/^\[.*\]$/.test(trimmed)) return splitList(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseMarkdownFrontmatter(input: string): ParsedInput {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    return { fields: {}, body: normalized };
  }

  const fields: Record<string, AiImportJsonValue> = {};

  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    fields[line.slice(0, separator).trim()] = parseFrontmatterValue(
      line.slice(separator + 1),
    );
  }

  return { fields, body: match[2].trim() };
}

function parseImportInput(input: string): ParsedInput {
  const trimmed = input.trim();

  if (!trimmed) return { fields: {}, body: "" };

  try {
    const parsed = JSON.parse(trimmed);
    const fields = asRecord(parsed);
    const body = readString(fields, fieldAliases.body);

    return { fields, body };
  } catch {
    return parseMarkdownFrontmatter(trimmed);
  }
}

function normalizeContentType(value: string): ContentType | "" {
  const normalized = value.trim().toUpperCase().replace(/[-\s]+/g, "_");

  return Object.values(ContentType).includes(normalized as ContentType)
    ? (normalized as ContentType)
    : "";
}

function readStringList(
  fields: Record<string, AiImportJsonValue>,
  aliases: string[],
) {
  for (const alias of aliases) {
    const value = readPath(fields, alias);

    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }

    if (typeof value === "string") return splitList(value);
  }

  return [];
}

function parseTokenString(value: string): AiImportToken | null {
  const parts = value.split(":").map((part) => part.trim()).filter(Boolean);

  if (parts.length === 3) {
    return { market: parts[0], broker: parts[1], campaign: parts[2] };
  }

  if (parts.length === 4) {
    return {
      market: parts[0],
      broker: parts[1],
      campaign: parts[2],
      language: parts[3],
    };
  }

  return null;
}

function readAffiliateTokens(fields: Record<string, AiImportJsonValue>) {
  const raw =
    readPath(fields, "affiliateTokens") ??
    readPath(fields, "affiliate_tokens") ??
    readPath(fields, "affiliateToken") ??
    readPath(fields, "affiliate_token");

  if (!raw) return [];

  const values = Array.isArray(raw) ? raw : [raw];

  return values
    .map((value) => {
      if (typeof value === "string") return parseTokenString(value);
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;

      const token = value as Record<string, AiImportJsonValue>;
      const broker = readString(token, ["broker", "brokerSlug", "broker_slug"]);
      const campaign = readString(token, ["campaign", "campaignToken"]);
      const market = readString(token, ["market", "marketCode"]);
      const language = readString(token, ["language", "languageCode"]);

      return broker && campaign ? { broker, campaign, market, language } : null;
    })
    .filter((token): token is AiImportToken => Boolean(token));
}

export function normalizeAiImportDraft(input: string): AiImportDraft {
  const parsed = parseImportInput(input);
  const fields = parsed.fields;
  const body = readString(fields, fieldAliases.body) || parsed.body;
  const affiliateTokens = [
    ...readAffiliateTokens(fields),
    ...extractAffiliateTokensFromText(body),
  ];

  return {
    title: readString(fields, fieldAliases.title),
    slug: normalizeSlug(readString(fields, fieldAliases.slug)),
    market: normalizeSlug(readString(fields, fieldAliases.market)),
    language: readString(fields, fieldAliases.language).toLowerCase(),
    contentType: normalizeContentType(readString(fields, fieldAliases.contentType)),
    template: readString(fields, fieldAliases.template).trim(),
    body: body.trim(),
    seoTitle: readString(fields, fieldAliases.seoTitle),
    metaDescription: readString(fields, fieldAliases.metaDescription),
    affiliateTokens,
    brokerMentions: readStringList(fields, [
      "brokerMentions",
      "broker_mentions",
      "brokers",
      "broker",
    ]).map(normalizeSlug),
    translationGroupKey: normalizeSlug(
      readString(fields, fieldAliases.translationGroupKey),
    ),
  };
}

async function getTemplate(value: string) {
  const key = normalizeSlug(value);

  if (!key) return null;

  return prisma.template.findFirst({
    where: {
      isActive: true,
      OR: [
        { key },
        { name: { equals: value, mode: "insensitive" } },
      ],
    },
  });
}

async function getBroker(slug: string) {
  return prisma.broker.findFirst({
    where: {
      slug: normalizeSlug(slug),
      status: { in: [BrokerStatus.ACTIVE, BrokerStatus.DRAFT] },
    },
  });
}

async function validateAffiliateToken(args: {
  token: AiImportToken;
  market: Market;
}) {
  const brokerSlug = normalizeSlug(args.token.broker);
  const campaign = normalizeCampaignToken(args.token.campaign);
  const marketCode = normalizeSlug(args.token.market || args.market.code);
  const languageCode = (args.token.language || args.market.languageCode)
    .trim()
    .toLowerCase();

  if (!brokerSlug || !campaign) return null;

  return prisma.affiliateLink.findFirst({
    where: {
      campaign,
      languageCode,
      status: AffiliateLinkStatus.ACTIVE,
      broker: {
        slug: brokerSlug,
        status: BrokerStatus.ACTIVE,
      },
      market: {
        code: marketCode,
        status: MarketStatus.ACTIVE,
      },
    },
    include: {
      broker: true,
      market: true,
    },
  });
}

export async function validateAiImportInput(
  rawInput: string,
): Promise<AiImportValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const draft = normalizeAiImportDraft(rawInput);

  if (!rawInput.trim()) errors.push("Import input is required.");
  if (!draft.title) errors.push("Title is required.");
  if (!draft.slug) errors.push("Slug is required.");
  if (!draft.market) errors.push("Market is required.");
  if (!draft.language) errors.push("Language is required.");
  if (!draft.contentType) errors.push("Content type is required.");
  if (!draft.template) errors.push("Template is required.");
  if (!draft.body) errors.push("Body/content is required.");
  if (!draft.seoTitle) errors.push("SEO title is required.");
  if (!draft.metaDescription) errors.push("Meta description is required.");

  if (/https?:\/\//i.test(draft.body)) {
    errors.push(
      "Body contains a hard-coded URL. Use centralized broker/campaign tokens instead.",
    );
  }

  if (errors.length > 0) {
    return { errors, warnings, draft, preview: null };
  }

  const [market, template] = await Promise.all([
    prisma.market.findFirst({
      where: { code: draft.market, status: MarketStatus.ACTIVE },
    }),
    getTemplate(draft.template),
  ]);

  if (!market) errors.push("Market was not found or is inactive.");
  if (!template) errors.push("Template was not found or is inactive.");

  if (market && draft.language !== market.languageCode.toLowerCase()) {
    errors.push(
      `Language must match market ${market.code}: ${market.languageCode}.`,
    );
  }

  if (market && draft.contentType) {
    const canonicalPath = buildContentCanonicalPath({
      marketCode: market.code,
      contentType: draft.contentType,
      slug: draft.slug,
    });
    const duplicate = await prisma.contentItem.findFirst({
      where: {
        OR: [
          {
            marketId: market.id,
            contentType: draft.contentType,
            slug: draft.slug,
          },
          { canonicalPath },
        ],
      },
      select: { id: true },
    });

    if (duplicate) {
      errors.push("Slug or canonical path already exists for this market.");
    }
  }

  const brokerSlugs = new Set(draft.brokerMentions);
  const tokenLabels: string[] = [];
  const brokerLabels: string[] = [];
  const resolvedBrokers = new Map<string, Broker>();

  if (market) {
    for (const token of draft.affiliateTokens) {
      const resolved = await validateAffiliateToken({ token, market });

      if (!resolved) {
        errors.push(
          `Affiliate token is invalid: ${token.broker}:${token.campaign}.`,
        );
        continue;
      }

      brokerSlugs.add(resolved.broker.slug);
      resolvedBrokers.set(resolved.broker.slug, resolved.broker);
      tokenLabels.push(
        `${resolved.market.code}:${resolved.broker.slug}:${resolved.campaign}`,
      );
    }
  }

  for (const brokerSlug of brokerSlugs) {
    if (!brokerSlug) continue;
    const broker = resolvedBrokers.get(brokerSlug) ?? (await getBroker(brokerSlug));

    if (!broker) {
      errors.push(`Broker mention was not found: ${brokerSlug}.`);
      continue;
    }

    resolvedBrokers.set(broker.slug, broker);
    brokerLabels.push(`${broker.name} (${broker.slug})`);
  }

  if (template) {
    warnings.push(
      ...validateRequiredTemplateBlocks({
        markdown: draft.body,
        requiredBlocks: template.requiredBlocks,
        template,
      }),
    );
  }

  if (draft.affiliateTokens.length === 0 && brokerSlugs.size > 0) {
    warnings.push(
      "Broker mentions were found without affiliate tokens. CTA blocks may not resolve until campaign links exist.",
    );
  }

  const canonicalPath =
    market && draft.contentType
      ? buildContentCanonicalPath({
          marketCode: market.code,
          contentType: draft.contentType,
          slug: draft.slug,
        })
      : "";

  return {
    errors,
    warnings,
    draft,
    preview:
      errors.length === 0 && market && template && draft.contentType
        ? {
            canonicalPath,
            contentTypeLabel: contentTypeLabels[draft.contentType],
            marketLabel: `${market.code} - ${market.name} (${market.locale})`,
            templateLabel: `${template.name} (${template.key})`,
            brokerLabels: [...new Set(brokerLabels)],
            affiliateTokenLabels: [...new Set(tokenLabels)],
            status: "Draft only",
          }
        : null,
  };
}

export async function resolveAiImportReferences(draft: AiImportDraft) {
  const [market, template] = await Promise.all([
    prisma.market.findFirst({
      where: { code: draft.market, status: MarketStatus.ACTIVE },
    }),
    getTemplate(draft.template),
  ]);

  if (!market || !template || !draft.contentType) return null;

  const brokerSlugs = new Set(draft.brokerMentions);

  for (const token of draft.affiliateTokens) {
    const resolved = await validateAffiliateToken({ token, market });
    if (resolved) brokerSlugs.add(resolved.broker.slug);
  }

  const brokers = brokerSlugs.size
    ? await prisma.broker.findMany({
        where: { slug: { in: [...brokerSlugs] } },
        select: { id: true },
      })
    : [];

  return { market, template, brokers };
}
