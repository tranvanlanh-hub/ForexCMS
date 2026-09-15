import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BrokerReviewPage } from "@/components/public/broker-review-page";
import { SiteFooter, SiteHeader } from "@/components/public/site-chrome";
import { TemplateBlockRenderer } from "@/components/public/template-block-renderer";
import { getBrokerReviewScoreSummary } from "@/lib/brokers/review";
import { getCachedPublishedContentByRoute } from "@/lib/cache/public";
import {
  contentTypeLabels,
  contentTypePathSegments,
  getMarkdownBody,
} from "@/lib/content";
import { getContentBlocks, getFaqItemsFromBlocks, getKeySectionsFromBlocks } from "@/lib/content/blocks";
import { getRenderableInternalLinksForContent } from "@/lib/internal-links";
import { getPublishedContentByRoute } from "@/lib/routing/content";
import { getPublishedRedirectByPath } from "@/lib/routing/content-urls";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildPublicContentBreadcrumbs,
  buildPublicContentMetadata,
  buildReviewJsonLd,
  resolveMarketScopedCanonicalPath,
  stringifyJsonLd,
} from "@/lib/seo";
import { buildMediaPublicUrl } from "@/lib/storage";

type PublicContentPageProps = {
  params: Promise<{
    market: string;
    contentType: string;
    slug: string;
  }>;
};

type PublicContent = NonNullable<Awaited<ReturnType<typeof getPublishedContentByRoute>>>;

function getSafeAlternateContent(content: PublicContent) {
  const groupItems = content.translationGroup?.contentItems ?? [];
  if (groupItems.length === 0) return undefined;

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

export async function generateMetadata({ params }: PublicContentPageProps): Promise<Metadata> {
  const routeParams = await params;
  const content = await getCachedPublishedContentByRoute(routeParams);

  if (!content) {
    return {
      title: "Content not found",
      robots: { follow: false, index: false },
    };
  }

  const canonicalPath = resolveMarketScopedCanonicalPath({
    canonicalPath: content.seoMetadata?.canonicalPath,
    fallbackCanonicalPath: content.canonicalPath,
    marketCode: content.market.code,
  });
  const image = content.socialMedia ?? content.featuredMedia;

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
    imageUrl: image ? buildMediaPublicUrl(image.storageKey) : undefined,
  });
}

function GenericPublicContent({
  blocks,
  content,
  featuredImageUrl,
  internalLinks,
  markdown,
  toc,
  typeLabel,
}: {
  blocks: ReturnType<typeof getContentBlocks>;
  content: PublicContent;
  featuredImageUrl: string;
  internalLinks: Awaited<ReturnType<typeof getRenderableInternalLinksForContent>>;
  markdown: string;
  toc: Array<{ id: string; title: string }>;
  typeLabel: string;
}) {
  const readingMinutes = Math.max(1, Math.ceil(markdown.split(/\s+/).length / 220));

  return (
    <main className="site-container article-main" id="main-content">
      <nav aria-label="Breadcrumb" className="article-breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span><span>{content.market.name}</span><span aria-hidden="true">/</span><span>{typeLabel}</span>
      </nav>
      <header className="article-heading">
        <p className="eyebrow">{typeLabel} <span> / </span> {content.market.locale}</p>
        <h1>{content.title}</h1>
        {content.summary ? <p className="article-deck">{content.summary}</p> : null}
        {featuredImageUrl ? <Image alt={content.featuredMedia?.altText || content.title} className="mt-6 max-h-[520px] w-full rounded-lg object-cover" height={520} src={featuredImageUrl} unoptimized width={1040} /> : null}
        <div className="article-byline">
          {content.authorName ? <span className="author-avatar" aria-hidden="true">{content.authorName.slice(0, 1)}</span> : null}
          <div>{content.authorName ? <strong>{content.authorName}</strong> : null}<span>Updated {new Date(content.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {readingMinutes} min read</span></div>
          {content.reviewerName ? <p>Reviewed by <strong>{content.reviewerName}</strong></p> : null}
        </div>
      </header>
      <div className="article-layout">
        <article className="article-body"><TemplateBlockRenderer blocks={blocks} brokers={content.brokers} contentId={content.id} contentType={content.contentType} internalLinks={internalLinks} market={content.market} /></article>
        <aside className="reading-sidebar"><div className="reading-sidebar-inner">
          {toc.length ? <nav aria-label="On this page"><p className="eyebrow">ON THIS PAGE</p><ol>{toc.map((item, index) => <li key={item.id}><a href={`#${item.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{item.title}</a></li>)}</ol></nav> : null}
          <div className="reading-next"><p className="eyebrow">KEEP LEARNING</p><h2>Research before<br />you choose.</h2><p>Know the questions to ask when reviewing a broker.</p><Link className="text-link" href="/global/guides/how-to-verify-a-forex-broker/">The broker checklist →</Link></div>
          <p className="reading-disclosure">Educational content. Forex trading carries risk. Some links may earn us an affiliate commission.</p>
        </div></aside>
      </div>
    </main>
  );
}

export default async function PublicContentPage({ params }: PublicContentPageProps) {
  const routeParams = await params;
  const content = await getCachedPublishedContentByRoute(routeParams);

  if (!content) {
    const target = await getPublishedRedirectByPath(`/${routeParams.market}/${routeParams.contentType}/${routeParams.slug}/`);
    if (target) permanentRedirect(target);
    notFound();
  }

  const markdown = getMarkdownBody(content.body);
  const canonicalPath = resolveMarketScopedCanonicalPath({
    canonicalPath: content.seoMetadata?.canonicalPath,
    fallbackCanonicalPath: content.canonicalPath,
    marketCode: content.market.code,
  });
  const blocks = getContentBlocks(content.body, content.template);
  const internalLinks = await getRenderableInternalLinksForContent(content.id);
  const faqItems = getFaqItemsFromBlocks(blocks);
  const keySections = getKeySectionsFromBlocks(blocks);
  const featuredImageUrl = content.featuredMedia ? buildMediaPublicUrl(content.featuredMedia.storageKey) : "";
  const typeLabel = contentTypeLabels[content.contentType];
  const primaryBroker = content.brokers[0];
  const assessment = primaryBroker?.reviewAssessments[0] ?? null;
  const scoreSummary = getBrokerReviewScoreSummary(assessment);
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
    imageUrl: featuredImageUrl || undefined,
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
          broker: primaryBroker,
          reviewRating: scoreSummary.average === null
            ? null
            : {
                assessedCriteria: scoreSummary.assessedCount,
                totalCriteria: scoreSummary.totalCriteria,
                value: String(scoreSummary.average),
              },
          authorName: content.authorName,
          reviewerName: content.reviewerName,
          publishedAt: content.publishedAt,
          updatedAt: content.updatedAt,
        })
      : null,
    buildBreadcrumbJsonLd(breadcrumbItems),
    buildFaqPageJsonLd(faqItems),
  ].filter(Boolean);
  const toc = blocks.flatMap((block) => block.type === "table_of_contents" ? block.items : []);

  return (
    <div className="public-site article-site">
      <SiteHeader />
      {content.contentType === "BROKER_REVIEW" ? (
        <main className="site-container broker-review-main" id="main-content">
          <nav aria-label="Breadcrumb" className="article-breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{content.market.name}</span><span aria-hidden="true">/</span><span>{typeLabel}</span></nav>
          <BrokerReviewPage broker={primaryBroker} content={content} faqItems={faqItems} internalLinks={internalLinks} market={content.market} markdown={markdown} />
        </main>
      ) : (
        <GenericPublicContent blocks={blocks} content={content} featuredImageUrl={featuredImageUrl} internalLinks={internalLinks} markdown={markdown} toc={toc} typeLabel={typeLabel} />
      )}
      {jsonLdSchemas.map((schema, index) => <script dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }} key={index} type="application/ld+json" />)}
      <SiteFooter />
    </div>
  );
}
