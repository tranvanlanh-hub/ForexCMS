import { notFound } from "next/navigation";
import { getCachedPublishedContentSitemapEntries } from "@/lib/cache/public";
import { renderUrlSet } from "@/lib/seo/sitemap";

export const dynamic = "force-dynamic";

type SitemapRouteProps = {
  params: Promise<{
    sitemap: string;
  }>;
};

export async function GET(_request: Request, { params }: SitemapRouteProps) {
  const { sitemap } = await params;
  const match = sitemap.match(/^content-(\d+)\.xml$/);

  if (!match) {
    notFound();
  }

  const entries = await getCachedPublishedContentSitemapEntries(Number(match[1]));

  return new Response(renderUrlSet(entries), {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
