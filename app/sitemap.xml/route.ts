import {
  countPublishedContentSitemapPages,
  renderSitemapIndex,
} from "@/lib/seo/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const pageCount = await countPublishedContentSitemapPages();

  return new Response(renderSitemapIndex(pageCount), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
