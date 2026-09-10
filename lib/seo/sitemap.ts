import { ContentStatus, MarketStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  absoluteUrl,
  escapeXml,
  resolveMarketScopedCanonicalPath,
  SITEMAP_URL_LIMIT,
} from "@/lib/seo";
import { logEvent } from "@/lib/observability/logging";

export type SitemapEntry = {
  url: string;
  lastModified: Date | string;
};

export async function countPublishedContentSitemapPages() {
  try {
    const count = await prisma.contentItem.count({
      where: {
        status: ContentStatus.PUBLISHED,
        market: {
          status: MarketStatus.ACTIVE,
        },
        OR: [
          {
            seoMetadata: {
              is: {
                robotsIndex: "INDEX",
              },
            },
          },
          {
            seoMetadata: {
              is: null,
            },
          },
        ],
      },
    });

    return Math.max(1, Math.ceil(count / SITEMAP_URL_LIMIT));
  } catch (error) {
    logEvent("error", "sitemap_page_count_failed", { error });
    return 1;
  }
}

export async function getPublishedContentSitemapEntries(pageIndex: number) {
  if (!Number.isInteger(pageIndex) || pageIndex < 0) {
    return [];
  }

  try {
    const contentItems = await prisma.contentItem.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        market: {
          status: MarketStatus.ACTIVE,
        },
        OR: [
          {
            seoMetadata: {
              is: {
                robotsIndex: "INDEX",
              },
            },
          },
          {
            seoMetadata: {
              is: null,
            },
          },
        ],
      },
      include: {
        market: true,
        seoMetadata: true,
      },
      orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
      skip: pageIndex * SITEMAP_URL_LIMIT,
      take: SITEMAP_URL_LIMIT,
    });

    return contentItems.map((item): SitemapEntry => {
      const canonicalPath = resolveMarketScopedCanonicalPath({
        canonicalPath: item.seoMetadata?.canonicalPath,
        fallbackCanonicalPath: item.canonicalPath,
        marketCode: item.market.code,
      });

      return {
        url: absoluteUrl(canonicalPath),
        lastModified: item.updatedAt,
      };
    });
  } catch (error) {
    logEvent("error", "sitemap_entries_failed", { error, pageIndex });
    return [];
  }
}

export function renderSitemapIndex(pageCount: number) {
  const sitemapNodes = Array.from({ length: pageCount }, (_, index) => {
    const loc = absoluteUrl(`/sitemaps/content-${index}.xml`);

    return [
      "  <sitemap>",
      `    <loc>${escapeXml(loc)}</loc>`,
      "  </sitemap>",
    ].join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemapNodes,
    "</sitemapindex>",
  ].join("\n");
}

export function renderUrlSet(entries: SitemapEntry[]) {
  const urlNodes = entries.map((entry) => {
    const lastModified =
      entry.lastModified instanceof Date
        ? entry.lastModified.toISOString()
        : entry.lastModified;

    return [
      "  <url>",
      `    <loc>${escapeXml(entry.url)}</loc>`,
      `    <lastmod>${lastModified}</lastmod>`,
      "  </url>",
    ].join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlNodes,
    "</urlset>",
  ].join("\n");
}
