import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/public/site-chrome";
import { notFound } from "next/navigation";
import { TemplateBlockRenderer } from "@/components/public/template-block-renderer";
import { getCachedPublishedContentByRoute } from "@/lib/cache/public";
import { getContentBlocks, getFaqItemsFromBlocks, getKeySectionsFromBlocks, } from "@/lib/content/blocks";
import { contentTypeLabels, contentTypePathSegments, getMarkdownBody, } from "@/lib/content";
import { getSourcedBrokerFactHighlights } from "@/lib/broker-facts";
import { getRenderableInternalLinksForContent } from "@/lib/internal-links";
import { getPublishedContentByRoute } from "@/lib/routing/content";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqPageJsonLd, buildPublicContentBreadcrumbs, buildPublicContentMetadata, buildReviewJsonLd, resolveMarketScopedCanonicalPath, stringifyJsonLd, } from "@/lib/seo";
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
export async function generateMetadata({ params, }: PublicContentPageProps): Promise<Metadata> {
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
export default async function PublicContentPage({ params, }: PublicContentPageProps) {
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
    const typeLabel = contentTypeLabels[content.contentType];
    const blocks = getContentBlocks(content.body, content.template);
    const internalLinks = await getRenderableInternalLinksForContent(content.id);
    const faqItems = getFaqItemsFromBlocks(blocks);
    const keySections = getKeySectionsFromBlocks(blocks);
    const reviewRatingFact = content.contentType === "BROKER_REVIEW" && content.brokers[0]?.factItems
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
    const toc = blocks.flatMap(block => block.type === "table_of_contents" ? block.items : []);
    const readingMinutes = Math.max(1, Math.ceil(markdown.split(/\s+/).length / 220));
    return <div className="public-site article-site"><SiteHeader /><main className="site-container article-main" id="main-content">
    <nav aria-label="Breadcrumb" className="article-breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{content.market.name}</span><span aria-hidden="true">/</span><span>{typeLabel}</span></nav>
    <header className="article-heading"><p className="eyebrow">{typeLabel} <span> / </span> {content.market.locale}</p><h1>{content.title}</h1>{content.summary && <p className="article-deck">{content.summary}</p>}<div className="article-byline">{content.authorName && <span className="author-avatar" aria-hidden="true">{content.authorName.slice(0, 1)}</span>}<div>{content.authorName && <strong>{content.authorName}</strong>}<span>Updated {new Date(content.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {readingMinutes} min read</span></div>{content.reviewerName && <p>Reviewed by <strong>{content.reviewerName}</strong></p>}</div></header>
    <div className="article-layout"><article className="article-body"><TemplateBlockRenderer blocks={blocks} brokers={content.brokers} contentId={content.id} contentType={content.contentType} internalLinks={internalLinks} market={content.market}/></article><aside className="reading-sidebar"><div className="reading-sidebar-inner">{toc.length > 0 && <nav aria-label="On this page"><p className="eyebrow">ON THIS PAGE</p><ol>{toc.map((item, index) => <li key={item.id}><a href={"#" + item.id}><span>{String(index + 1).padStart(2, "0")}</span>{item.title}</a></li>)}</ol></nav>}<div className="reading-next"><p className="eyebrow">KEEP LEARNING</p><h2>Research before<br />you choose.</h2><p>Know the questions to ask when reviewing a broker.</p><Link className="text-link" href="/global/guides/how-to-verify-a-forex-broker/">The broker checklist →</Link></div><p className="reading-disclosure">Educational content. Forex trading carries risk. Some links may earn us an affiliate commission.</p></div></aside></div>
    {jsonLdSchemas.map((schema, index) => <script dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }} key={index} type="application/ld+json"/>)}
  </main><SiteFooter /></div>;
}
