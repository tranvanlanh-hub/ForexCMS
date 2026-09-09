import { ContentStatus } from "@prisma/client";
import { getContentTypeFromPathSegment, normalizeSlug } from "@/lib/content";
import { prisma } from "@/lib/db";

export async function getPublishedContentByRoute(args: {
  market: string;
  contentType: string;
  slug: string;
}) {
  const marketCode = normalizeSlug(args.market);
  const contentType = getContentTypeFromPathSegment(args.contentType);
  const slug = normalizeSlug(args.slug);

  if (!marketCode || !contentType || !slug) {
    return null;
  }

  try {
    return await prisma.contentItem.findFirst({
      where: {
        slug,
        contentType,
        status: ContentStatus.PUBLISHED,
        market: {
          code: marketCode,
        },
      },
      include: {
        brokers: true,
        market: true,
        seoMetadata: true,
        template: true,
      },
    });
  } catch {
    return null;
  }
}
