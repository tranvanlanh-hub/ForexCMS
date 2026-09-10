import { revalidateTag, unstable_cache } from "next/cache";
import type { AffiliateToken } from "@/lib/affiliate";
import { resolveAffiliateUrl } from "@/lib/affiliate";
import {
  countPublishedContentSitemapPages,
  getPublishedContentSitemapEntries,
} from "@/lib/seo/sitemap";
import { getPublishedContentByRoute } from "@/lib/routing/content";

export const PUBLIC_CONTENT_CACHE_TAG = "public-content";
export const SITEMAP_CACHE_TAG = "sitemap";
export const AFFILIATE_RESOLVER_CACHE_TAG = "affiliate-resolver";

const PUBLIC_CONTENT_REVALIDATE_SECONDS = 300;
const SITEMAP_REVALIDATE_SECONDS = 1800;
const AFFILIATE_RESOLVER_REVALIDATE_SECONDS = 300;

const getPublishedContentByRouteFromCache = unstable_cache(
  async (args: { market: string; contentType: string; slug: string }) =>
    getPublishedContentByRoute(args),
  ["published-content-by-route"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: [PUBLIC_CONTENT_CACHE_TAG],
  },
);

const countPublishedContentSitemapPagesFromCache = unstable_cache(
  async () => countPublishedContentSitemapPages(),
  ["published-content-sitemap-page-count"],
  {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    tags: [PUBLIC_CONTENT_CACHE_TAG, SITEMAP_CACHE_TAG],
  },
);

const getPublishedContentSitemapEntriesFromCache = unstable_cache(
  async (pageIndex: number) => getPublishedContentSitemapEntries(pageIndex),
  ["published-content-sitemap-entries"],
  {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    tags: [PUBLIC_CONTENT_CACHE_TAG, SITEMAP_CACHE_TAG],
  },
);

const resolveAffiliateUrlFromCache = unstable_cache(
  async (token: AffiliateToken) => resolveAffiliateUrl(token),
  ["affiliate-resolver"],
  {
    revalidate: AFFILIATE_RESOLVER_REVALIDATE_SECONDS,
    tags: [AFFILIATE_RESOLVER_CACHE_TAG],
  },
);

// Local editors should see database changes immediately. Bypassing the
// persistent data cache in development also prevents a temporary connection
// failure from leaving localhost stuck on an old 404 response.
export function getCachedPublishedContentByRoute(args: {
  market: string;
  contentType: string;
  slug: string;
}) {
  return process.env.NODE_ENV === "development"
    ? getPublishedContentByRoute(args)
    : getPublishedContentByRouteFromCache(args);
}

export function countCachedPublishedContentSitemapPages() {
  return process.env.NODE_ENV === "development"
    ? countPublishedContentSitemapPages()
    : countPublishedContentSitemapPagesFromCache();
}

export function getCachedPublishedContentSitemapEntries(pageIndex: number) {
  return process.env.NODE_ENV === "development"
    ? getPublishedContentSitemapEntries(pageIndex)
    : getPublishedContentSitemapEntriesFromCache(pageIndex);
}

export function resolveCachedAffiliateUrl(token: AffiliateToken) {
  return process.env.NODE_ENV === "development"
    ? resolveAffiliateUrl(token)
    : resolveAffiliateUrlFromCache(token);
}

export function revalidatePublicContentCache() {
  revalidateTag(PUBLIC_CONTENT_CACHE_TAG, "max");
  revalidateTag(SITEMAP_CACHE_TAG, "max");
}

export function revalidateAffiliateResolverCache() {
  revalidateTag(AFFILIATE_RESOLVER_CACHE_TAG, "max");
}

export function revalidatePublicOperationalCache() {
  revalidatePublicContentCache();
  revalidateAffiliateResolverCache();
}
