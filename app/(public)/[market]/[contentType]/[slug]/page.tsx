import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TemplateBlockRenderer } from "@/components/public/template-block-renderer";
import { getCachedPublishedContentByRoute } from "@/lib/cache/public";
import {
  getContentBlocks,
  getFaqItemsFromBlocks,
  getKeySectionsFromBlocks,
} from "@/lib/content/blocks";
import {
  contentTypeLabels,
  contentTypePathSegments,
  getMarkdownBody,
} from "@/lib/content";
import { getSourcedBrokerFactHighlights } from "@/lib/broker-facts";
import { getRenderableInternalLinksForContent } from "@/lib/internal-links";
import { getPublishedContentByRoute } from "@/lib/routing/content";
import {
  absoluteUrl,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildPublicContentBreadcrumbs,
  buildPublicContentMetadata,
  buildReviewJsonLd,
  resolveMarketScopedCanonicalPath,
  stringifyJsonLd,
} from "@/lib/seo";

type PublicContentPageProps = {
  params: Promise<{
    market: string;
    contentType: string;
    slug: string;
  }>;
};

type PublicContent = NonNullable<
  Awaited<ReturnType<typeof getPublishedContentByRoute>>
>;

function getSafeAlternateContent(content: PublicContent) {
  const groupItems = content.translationGroup?.contentItems ?? [];

  if (groupItems.length === 0) {
    return undefined;
  }

  return groupItems
    .map((item) => ({
      canonicalPath: resolveMarketScopedCanonicalPath({
        canonicalPath: item.seoMetadata?.canonicalPath,
        fallbackCanonicalPath: item.canonicalPath,
        marketCode: item.market.code,
      }),
      market: item.market,
    }))
    .filter((item) => item.canonicalPath.startsWith(`/${item.market.code}/`));
}

export async function generateMetadata({
  params,
}: PublicContentPageProps): Promise<Metadata> {
  const routeParams = await params;
  const content = await getCachedPublishedContentByRoute(routeParams);

  if (!content) {
    return {
      title: "Content not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalPath = resolveMarketScopedCanonicalPath({
    canonicalPath: content.seoMetadata?.canonicalPath,
    fallbackCanonicalPath: content.canonicalPath,
    marketCode: content.market.code,
  });

  return buildPublicContentMetadata({
    title: content.title,
    summary: content.summary,
    bodyMarkdown: getMarkdownBody(content.body),
    contentType: content.contentType,
    canonicalPath,
    seoTitle: content.seoMetadata?.title,
    seoDescription: content.seoMetadata?.description,
    robotsIndex: content.seoMetadata?.robotsIndex,
    robotsFollow: content.seoMetadata?.robotsFollow,
    market: content.market,
    authorName: content.authorName,
    reviewerName: content.reviewerName,
    publishedAt: content.publishedAt,
    updatedAt: content.updatedAt,
    alternateContent: getSafeAlternateContent(content),
  });
}

export default async function PublicContentPage({
  params,
}: PublicContentPageProps) {
  const routeParams = await params;
  const content = await getCachedPublishedContentByRoute(routeParams);

  if (!content) {
    notFound();
  }

  const markdown = getMarkdownBody(content.body);
  const canonicalPath = resolveMarketScopedCanonicalPath({
    canonicalPath: content.seoMetadata?.canonicalPath,
    fallbackCanonicalPath: content.canonicalPath,
    marketCode: content.market.code,
  });
  const canonicalUrl = absoluteUrl(canonicalPath);
  const typeLabel = contentTypeLabels[content.contentType];
  const blocks = getContentBlocks(content.body, content.template);
  const internalLinks = await getRenderableInternalLinksForContent(content.id);
  const faqItems = getFaqItemsFromBlocks(blocks);
  const keySections = getKeySectionsFromBlocks(blocks);
  const reviewRatingFact =
    content.contentType === "BROKER_REVIEW" && content.brokers[0]?.factItems
      ? getSourcedBrokerFactHighlights(content.brokers[0].factItems).rating
      : null;
  const seoInput = {
    title: content.title,
    summary: content.summary,
    bodyMarkdown: markdown,
    contentType: content.contentType,
    canonicalPath,
    seoTitle: content.seoMetadata?.title,
    seoDescription: content.seoMetadata?.description,
    robotsIndex: content.seoMetadata?.robotsIndex,
    robotsFollow: content.seoMetadata?.robotsFollow,
    market: content.market,
    authorName: content.authorName,
    reviewerName: content.reviewerName,
    publishedAt: content.publishedAt,
    updatedAt: content.updatedAt,
    keySections,
    alternateContent: getSafeAlternateContent(content),
  };
  const breadcrumbItems = buildPublicContentBreadcrumbs({
    title: content.title,
    canonicalPath,
    contentType: content.contentType,
    market: content.market,
    contentTypePathSegment: contentTypePathSegments[content.contentType],
  });
  const jsonLdSchemas = [
    buildArticleJsonLd(seoInput),
    content.contentType === "BROKER_REVIEW"
      ? buildReviewJsonLd({
          title: content.title,
          summary: content.summary,
          canonicalPath,
          seoDescription: content.seoMetadata?.description,
          market: content.market,
          broker: content.brokers[0],
          reviewRating: reviewRatingFact
            ? {
                value: reviewRatingFact.value,
                bestRating: reviewRatingFact.unit ?? undefined,
              }
            : null,
          authorName: content.authorName,
          reviewerName: content.reviewerName,
          publishedAt: content.publishedAt,
          updatedAt: content.updatedAt,
        })
      : null,
    buildBreadcrumbJsonLd(breadcrumbItems),
    buildFaqPageJsonLd(faqItems),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <Link className="text-sm font-semibold text-[#123c3a]" href="/">
            Forex Affiliate CMS
          </Link>
          <nav
            aria-label="Public navigation"
            className="flex items-center gap-4 text-sm font-medium text-[#5f6268]"
          >
            <Link className="hover:text-[#123c3a]" href="/admin/content">
              Content admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 text-sm font-medium text-[#5f6268]"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link className="hover:text-[#123c3a]" href="/">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                className="hover:text-[#123c3a]"
                href={`/${content.market.code}/`}
              >
                {content.market.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                className="hover:text-[#123c3a]"
                href={`/${content.market.code}/${routeParams.contentType}/`}
              >
                {typeLabel}
              </Link>
            </li>
          </ol>
        </nav>

        <article className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
            {content.market.code} / {typeLabel}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl">
            {content.title}
          </h1>
          {content.summary ? (
            <p className="mt-5 text-lg leading-8 text-[#5f6268]">
              {content.summary}
            </p>
          ) : null}
          <TemplateBlockRenderer
            blocks={blocks}
            brokers={content.brokers}
            contentId={content.id}
            contentType={content.contentType}
            internalLinks={internalLinks}
            market={content.market}
          />
        </article>

        {jsonLdSchemas.map((schema, index) => (
          <script
            dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }}
            key={index}
            type="application/ld+json"
          />
        ))}
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-6 text-sm text-[#5f6268] lg:px-8">
          <p>Forex Affiliate CMS public content renderer.</p>
          <p>Canonical: {canonicalUrl}</p>
        </div>
      </footer>
    </div>
  );
}
