import { countCachedPublishedContentSitemapPages } from "@/lib/cache/public";
import { renderSitemapIndex } from "@/lib/seo/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const pageCount = await countCachedPublishedContentSitemapPages();

  return new Response(renderSitemapIndex(pageCount), {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
