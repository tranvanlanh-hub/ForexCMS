import { TemplateKind, type Prisma } from "@prisma/client";

export const templateKindLabels: Record<TemplateKind, string> = {
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

export const templateBlockOptions = [
  { value: "intro", label: "Introduction" },
  { value: "summary", label: "Summary / key takeaways" },
  { value: "table_of_contents", label: "Table of contents" },
  { value: "body", label: "Main body" },
  { value: "faq", label: "FAQ" },
  { value: "pros_cons", label: "Pros and cons" },
  { value: "cta_slot", label: "Affiliate CTA slot" },
] as const;

export const templateSchemaOptions = [
  "Article",
  "BreadcrumbList",
  "FAQPage",
  "Review",
  "ItemList",
  "HowTo",
  "Organization",
  "Person",
] as const;

export const templateCtaSlotOptions = ["top", "middle", "bottom"] as const;

export const templateBlockValues = new Set<string>(
  templateBlockOptions.map((option) => option.value),
);
export const templateSchemaValues = new Set<string>(templateSchemaOptions);
export const templateCtaSlotValues = new Set<string>(templateCtaSlotOptions);

export function asTemplateStringArray(value: Prisma.JsonValue | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function normalizeInternalLinkSlots(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,]+/)
        .map((slot) =>
          slot
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_-]/g, ""),
        )
        .filter(Boolean),
    ),
  ].slice(0, 20);
}
