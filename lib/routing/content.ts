import { ContentStatus, MarketStatus } from "@prisma/client";
import { getContentTypeFromPathSegment, normalizeSlug } from "@/lib/content";
import { prisma } from "@/lib/db";
import { logEvent } from "@/lib/observability/logging";

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
          status: MarketStatus.ACTIVE,
        },
      },
      include: {
        featuredMedia: true,
        socialMedia: true,
        brokers: {
          include: {
            factItems: {
              include: {
                market: true,
              },
              orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
        market: true,
        seoMetadata: true,
        template: true,
        translationGroup: {
          include: {
            contentItems: {
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
            },
          },
        },
      },
    });
  } catch (error) {
    logEvent("error", "public_content_lookup_failed", {
      contentType: args.contentType,
      error,
      market: args.market,
      slug: args.slug,
    });

    // A temporary database outage is not a missing article. Let the request
    // fail so Next.js does not cache a false 404 for the public content key.
    throw error;
  }
}
