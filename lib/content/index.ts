import type { ContentStatus, ContentType, Prisma } from "@prisma/client";

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
  Extract<ContentStatus, "DRAFT" | "PUBLISHED" | "ARCHIVED">,
  string
> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
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

export function toMarkdownBody(markdown: string): Prisma.InputJsonObject {
  return {
    format: "markdown",
    markdown: markdown.trim(),
  };
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
  const isPublishing = input.status === "PUBLISHED";

  if (!input.title.trim() && isPublishing) errors.push("Title is required.");
  if (!normalizeSlug(input.slug) && isPublishing) errors.push("Slug is required.");
  if (!input.marketId && isPublishing) errors.push("Market is required.");
  if (!input.contentType && isPublishing) errors.push("Content type is required.");
  if (!input.templateId && isPublishing) errors.push("Template is required.");
  if (!input.markdown.trim() && isPublishing) errors.push("Body is required.");
  if (!input.seoTitle.trim() && isPublishing) errors.push("SEO title is required.");
  if (!input.metaDescription.trim() && isPublishing) {
    errors.push("Meta description is required.");
  }

  if (/https?:\/\//i.test(input.markdown)) {
    errors.push(
      "Raw links are not allowed in content body yet. Use broker/campaign tokens when affiliate resolution is added.",
    );
  }

  return errors;
}
