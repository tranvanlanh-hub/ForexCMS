import type { Metadata } from "next";
import type { Broker, ContentType, RobotsIndex } from "@prisma/client";
import { buildDefaultMetaDescription, contentTypeLabels } from "@/lib/content";

export type SeoDefaults = {
  siteName: string;
  appUrl: string;
};

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type PublicContentSeoInput = {
  title: string;
  summary: string | null;
  bodyMarkdown: string;
  contentType: ContentType;
  canonicalPath: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  robotsIndex?: RobotsIndex | null;
  robotsFollow?: boolean | null;
  market: {
    code: string;
    name: string;
    languageCode: string;
    locale: string;
  };
  authorName?: string | null;
  reviewerName?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  keySections?: string[];
  alternateContent?: LanguageAlternateContent[];
  imageUrl?: string;
};

export type LanguageAlternateContent = {
  canonicalPath: string;
  market: {
    code: string;
    languageCode: string;
    locale: string;
    isGlobal?: boolean;
  };
};

export const SITEMAP_URL_LIMIT = 4000;

export function getSeoDefaults(): SeoDefaults {
  return {
    siteName: "MarketGB",
    appUrl: normalizeAppUrl(process.env.APP_URL ?? "http://localhost:3000"),
  };
}

export function normalizeAppUrl(appUrl: string) {
  return appUrl.replace(/\/+$/, "");
}

export function absoluteUrl(path: string) {
  const { appUrl } = getSeoDefaults();
  return new URL(path, appUrl).toString();
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function stringifyJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function toIsoDateString(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
}

export function buildRobotsMetadata(input: {
  robotsIndex?: RobotsIndex | null;
  robotsFollow?: boolean | null;
}) {
  return {
    index: input.robotsIndex !== "NOINDEX",
    follow: input.robotsFollow ?? true,
  };
}

export function resolveMarketScopedCanonicalPath(input: {
  canonicalPath?: string | null;
  fallbackCanonicalPath: string;
  marketCode: string;
}) {
  const expectedPrefix = `/${input.marketCode}/`;
  const canonicalPath = input.canonicalPath ?? "";

  if (
    canonicalPath.startsWith(expectedPrefix) &&
    canonicalPath.endsWith("/") &&
    canonicalPath !== expectedPrefix
  ) {
    return canonicalPath;
  }

  return input.fallbackCanonicalPath;
}

export function buildLanguageAlternates(input: {
  canonicalPath: string;
  market: {
    code: string;
    languageCode: string;
    locale: string;
    isGlobal?: boolean;
  };
}) {
  return buildLanguageAlternatesFromContent({
    current: {
      canonicalPath: input.canonicalPath,
      market: input.market,
    },
  });
}

export function buildLanguageAlternatesFromContent(input: {
  current: LanguageAlternateContent;
  alternates?: LanguageAlternateContent[];
}) {
  const languages: Record<string, string> = {};
  const alternateItems =
    input.alternates && input.alternates.length > 0
      ? input.alternates
      : [input.current];

  for (const item of alternateItems) {
    const canonicalPath = resolveMarketScopedCanonicalPath({
      canonicalPath: item.canonicalPath,
      fallbackCanonicalPath: input.current.canonicalPath,
      marketCode: item.market.code,
    });
    const isScopedToItemMarket = canonicalPath.startsWith(
      `/${item.market.code}/`,
    );

    if (!isScopedToItemMarket) {
      continue;
    }

    const locale = item.market.locale || item.market.languageCode;
    languages[locale] = absoluteUrl(canonicalPath);

    if (item.market.isGlobal) {
      languages["x-default"] = absoluteUrl(canonicalPath);
    }
  }

  if (Object.keys(languages).length === 0) {
    const locale =
      input.current.market.locale || input.current.market.languageCode;
    languages[locale] = absoluteUrl(input.current.canonicalPath);
  }

  return languages;
}

export function buildPublicContentMetadata(
  input: PublicContentSeoInput,
): Metadata {
  const description =
    input.seoDescription?.trim() ||
    input.summary?.trim() ||
    buildDefaultMetaDescription(input.bodyMarkdown) ||
    "Forex market guide and broker education.";

  return {
    title: input.seoTitle?.trim() || input.title,
    description,
    alternates: {
      canonical: absoluteUrl(input.canonicalPath),
      languages: buildLanguageAlternatesFromContent({
        current: {
          canonicalPath: input.canonicalPath,
          market: input.market,
        },
        alternates: input.alternateContent,
      }),
    },
    robots: buildRobotsMetadata(input),
    openGraph: input.imageUrl ? { images: [{ url: input.imageUrl }] } : undefined,
    twitter: input.imageUrl ? { card: "summary_large_image", images: [input.imageUrl] } : undefined,
  };
}

export function buildPublicContentBreadcrumbs(input: {
  title: string;
  canonicalPath: string;
  contentType: ContentType;
  market: {
    code: string;
    name: string;
  };
  contentTypePathSegment: string;
}): BreadcrumbItem[] {
  return [
    { name: "Home", path: "/" },
    { name: input.market.name, path: `/${input.market.code}/` },
    {
      name: contentTypeLabels[input.contentType],
      path: `/${input.market.code}/${input.contentTypePathSegment}/`,
    },
    { name: input.title, path: input.canonicalPath },
  ];
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildArticleJsonLd(input: PublicContentSeoInput) {
  const description =
    input.seoDescription?.trim() ||
    input.summary?.trim() ||
    buildDefaultMetaDescription(input.bodyMarkdown) ||
    "Forex market guide and broker education.";
  const { siteName } = getSeoDefaults();

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.seoTitle?.trim() || input.title,
    description,
    inLanguage: input.market.locale || input.market.languageCode,
    mainEntityOfPage: absoluteUrl(input.canonicalPath),
    datePublished: toIsoDateString(input.publishedAt),
    dateModified: toIsoDateString(input.updatedAt),
    author: input.authorName
      ? {
          "@type": "Person",
          name: input.authorName,
        }
      : {
          "@type": "Organization",
          name: siteName,
        },
    reviewedBy: input.reviewerName
      ? {
          "@type": "Person",
          name: input.reviewerName,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
    image: input.imageUrl ? [input.imageUrl] : undefined,
    articleSection:
      input.keySections && input.keySections.length > 0
        ? input.keySections
        : undefined,
  };
}

export function buildReviewJsonLd(input: {
  title: string;
  summary: string | null;
  canonicalPath: string;
  seoDescription?: string | null;
  market: {
    languageCode: string;
    locale: string;
  };
  broker?: Pick<Broker, "name" | "slug" | "description" | "websiteUrl"> | null;
  reviewRating?: {
    value: string;
    assessedCriteria?: number;
    totalCriteria?: number;
  } | null;
  authorName?: string | null;
  reviewerName?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
}) {
  if (!input.broker) {
    return null;
  }

  const description =
    input.seoDescription?.trim() ||
    input.summary?.trim() ||
    input.broker.description?.trim() ||
    `${input.broker.name} broker review.`;
  const { siteName } = getSeoDefaults();
  const assessmentNote = input.reviewRating?.assessedCriteria
    ? ` MarketGB assessed ${input.reviewRating.assessedCriteria} of ${input.reviewRating.totalCriteria ?? 5} criteria.`
    : "";

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    name: input.title,
    reviewBody: `${description}${assessmentNote}`,
    inLanguage: input.market.locale || input.market.languageCode,
    url: absoluteUrl(input.canonicalPath),
    datePublished: toIsoDateString(input.publishedAt),
    dateModified: toIsoDateString(input.updatedAt),
    author: input.authorName
      ? {
          "@type": "Person",
          name: input.authorName,
        }
      : {
          "@type": "Organization",
          name: siteName,
        },
    reviewedBy: input.reviewerName
      ? {
          "@type": "Person",
          name: input.reviewerName,
        }
      : undefined,
    itemReviewed: {
      "@type": "Organization",
      name: input.broker.name,
      url: input.broker.websiteUrl || undefined,
      description: input.broker.description || undefined,
    },
    reviewRating: input.reviewRating
      ? {
          "@type": "Rating",
          ratingValue: input.reviewRating.value,
          bestRating: "5",
          worstRating: "0",
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };
}

export function buildItemListJsonLd(input: {
  canonicalPath: string;
  name: string;
  items: Array<{
    name: string;
    path?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: absoluteUrl(input.canonicalPath),
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.path ? absoluteUrl(item.path) : undefined,
    })),
  };
}

export function extractFaqFromMarkdown(markdown: string): FaqItem[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const faqItems: FaqItem[] = [];
  let inFaqSection = false;
  let currentQuestion = "";
  let answerLines: string[] = [];

  function flushQuestion() {
    const answer = answerLines.join(" ").replace(/\s+/g, " ").trim();

    if (currentQuestion && answer) {
      faqItems.push({ question: currentQuestion, answer });
    }

    currentQuestion = "";
    answerLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const headingMatch = line.match(/^(#{2,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      const normalizedHeading = headingText.toLowerCase();
      const isFaqHeading =
        level === 2 &&
        (normalizedHeading === "faq" ||
          normalizedHeading === "faqs" ||
          normalizedHeading === "frequently asked questions");

      if (isFaqHeading) {
        flushQuestion();
        inFaqSection = true;
        continue;
      }

      if (inFaqSection && level === 2) {
        flushQuestion();
        inFaqSection = false;
        continue;
      }

      if (inFaqSection) {
        flushQuestion();
        currentQuestion = headingText.replace(/\?*$/, "?");
        continue;
      }
    }

    if (inFaqSection && currentQuestion && line) {
      answerLines.push(line.replace(/^[-*]\s+/, ""));
    }
  }

  flushQuestion();

  return faqItems;
}

export function buildFaqPageJsonLd(items: FaqItem[]) {
  if (items.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
