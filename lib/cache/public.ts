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

export const getCachedPublishedContentByRoute = unstable_cache(
  async (args: { market: string; contentType: string; slug: string }) =>
    getPublishedContentByRoute(args),
  ["published-content-by-route"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: [PUBLIC_CONTENT_CACHE_TAG],
  },
);

export const countCachedPublishedContentSitemapPages = unstable_cache(
  async () => countPublishedContentSitemapPages(),
  ["published-content-sitemap-page-count"],
  {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    tags: [PUBLIC_CONTENT_CACHE_TAG, SITEMAP_CACHE_TAG],
  },
);

export const getCachedPublishedContentSitemapEntries = unstable_cache(
  async (pageIndex: number) => getPublishedContentSitemapEntries(pageIndex),
  ["published-content-sitemap-entries"],
  {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    tags: [PUBLIC_CONTENT_CACHE_TAG, SITEMAP_CACHE_TAG],
  },
);

export const resolveCachedAffiliateUrl = unstable_cache(
  async (token: AffiliateToken) => resolveAffiliateUrl(token),
  ["affiliate-resolver"],
  {
    revalidate: AFFILIATE_RESOLVER_REVALIDATE_SECONDS,
    tags: [AFFILIATE_RESOLVER_CACHE_TAG],
  },
);

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
