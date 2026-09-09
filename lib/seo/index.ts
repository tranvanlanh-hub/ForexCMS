import type { Metadata } from "next";
import type { ContentType, RobotsIndex } from "@prisma/client";
import { contentTypeLabels } from "@/lib/content";

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
  publishedAt?: Date | null;
  updatedAt?: Date | null;
};

export const SITEMAP_URL_LIMIT = 4000;

export function getSeoDefaults(): SeoDefaults {
  return {
    siteName: "Forex Affiliate CMS",
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
  const locale = input.market.locale || input.market.languageCode;
  const languages: Record<string, string> = {
    [locale]: absoluteUrl(input.canonicalPath),
  };

  if (input.market.isGlobal) {
    languages["x-default"] = absoluteUrl(input.canonicalPath);
  }

  return languages;
}

export function buildPublicContentMetadata(
  input: PublicContentSeoInput,
): Metadata {
  const description =
    input.seoDescription ??
    input.summary ??
    "Forex market guide and broker education.";

  return {
    title: input.seoTitle ?? input.title,
    description,
    alternates: {
      canonical: absoluteUrl(input.canonicalPath),
      languages: buildLanguageAlternates({
        canonicalPath: input.canonicalPath,
        market: input.market,
      }),
    },
    robots: buildRobotsMetadata(input),
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
    input.seoDescription ??
    input.summary ??
    "Forex market guide and broker education.";
  const { siteName } = getSeoDefaults();

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.seoTitle ?? input.title,
    description,
    inLanguage: input.market.locale || input.market.languageCode,
    mainEntityOfPage: absoluteUrl(input.canonicalPath),
    datePublished: input.publishedAt?.toISOString(),
    dateModified: input.updatedAt?.toISOString(),
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
