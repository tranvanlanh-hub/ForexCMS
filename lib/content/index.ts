import type { ContentStatus, ContentType, Prisma } from "@prisma/client";
import { toStructuredContentBody } from "@/lib/content/blocks";

export const contentTypeLabels: Record<ContentType, string> = {
  ARTICLE: "Article",
  GUIDE: "Guide",
  BROKER_REVIEW: "Broker review",
  BROKER_COMPARISON: "Broker comparison",
  BEST_BROKER_LIST: "Best broker list",
  COUNTRY_HUB: "Country hub",
  TOPIC_HUB: "Topic hub",
  GLOSSARY_TERM: "Glossary term",
  LANDING_PAGE: "Landing page",
};

export const contentTypePathSegments: Record<ContentType, string> = {
  ARTICLE: "articles",
  GUIDE: "guides",
  BROKER_REVIEW: "broker-reviews",
  BROKER_COMPARISON: "compare",
  BEST_BROKER_LIST: "best-brokers",
  COUNTRY_HUB: "country",
  TOPIC_HUB: "topics",
  GLOSSARY_TERM: "glossary",
  LANDING_PAGE: "landing",
};

export function getContentTypeFromPathSegment(segment: string) {
  const normalizedSegment = normalizeSlug(segment);

  return Object.entries(contentTypePathSegments).find(
    ([, pathSegment]) => pathSegment === normalizedSegment,
  )?.[0] as ContentType | undefined;
}

export const contentStatusLabels: Record<
  ContentStatus,
  string
> = {
  DRAFT: "Draft",
  REVIEW: "Review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildContentCanonicalPath(args: {
  marketCode: string;
  contentType: ContentType;
  slug: string;
}) {
  const market = normalizeSlug(args.marketCode);
  const slug = normalizeSlug(args.slug);
  const typeSegment = contentTypePathSegments[args.contentType];

  if (!market || !typeSegment || !slug) {
    return "";
  }

  return `/${market}/${typeSegment}/${slug}/`;
}

export function toMarkdownBody(
  markdown: string,
  template?: Parameters<typeof toStructuredContentBody>[0]["template"],
): Prisma.InputJsonObject {
  return toStructuredContentBody({ markdown, template }) as unknown as Prisma.InputJsonObject;
}

export function getMarkdownBody(body: Prisma.JsonValue | null | undefined) {
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "markdown" in body &&
    typeof body.markdown === "string"
  ) {
    return body.markdown;
  }

  return "";
}

export type ContentPublishValidationInput = {
  title: string;
  slug: string;
  marketId: string;
  templateId: string;
  contentType: ContentType | "";
  status: ContentStatus;
  markdown: string;
  seoTitle: string;
  metaDescription: string;
};

export function validateContentForSave(input: ContentPublishValidationInput) {
  const errors: string[] = [];

  if (!input.title.trim()) errors.push("Title is required.");
  if (!input.markdown.trim()) errors.push("Body content is required.");

  return errors;
}

export function buildDefaultMetaDescription(markdown: string, maxLength = 160) {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~|\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= maxLength) return plainText;
  const shortened = plainText.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 80 ? lastSpace : maxLength).trim()}…`;
}
