import { notFound } from "next/navigation";
import {
  getPublishedContentSitemapEntries,
  renderUrlSet,
} from "@/lib/seo/sitemap";

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

  const entries = await getPublishedContentSitemapEntries(Number(match[1]));

  return new Response(renderUrlSet(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
