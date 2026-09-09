import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateCta } from "@/components/public/affiliate-cta";
import {
  contentTypeLabels,
  contentTypePathSegments,
  getMarkdownBody,
} from "@/lib/content";
import { MarkdownContent } from "@/lib/content/markdown";
import { getPublishedContentByRoute } from "@/lib/routing/content";
import {
  absoluteUrl,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildPublicContentBreadcrumbs,
  buildPublicContentMetadata,
  extractFaqFromMarkdown,
  resolveMarketScopedCanonicalPath,
  stringifyJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type PublicContentPageProps = {
  params: Promise<{
    market: string;
    contentType: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicContentPageProps): Promise<Metadata> {
  const routeParams = await params;
  const content = await getPublishedContentByRoute(routeParams);

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
  });
}

export default async function PublicContentPage({
  params,
}: PublicContentPageProps) {
  const routeParams = await params;
  const content = await getPublishedContentByRoute(routeParams);

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
    buildBreadcrumbJsonLd(breadcrumbItems),
    buildFaqPageJsonLd(extractFaqFromMarkdown(markdown)),
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
          <div className="mt-8 border-t border-[var(--border)] pt-3">
            <MarkdownContent markdown={markdown} />
          </div>
          {content.brokers.length > 0 ? (
            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <AffiliateCta
                broker={content.brokers[0].slug}
                campaign="review_top_cta"
                language={content.market.languageCode}
                market={content.market.code}
              />
            </div>
          ) : null}
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
