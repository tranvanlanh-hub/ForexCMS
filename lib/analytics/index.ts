import { AffiliateLinkStatus, ContentStatus } from "@prisma/client";
import { resolveAffiliateUrl } from "@/lib/affiliate";
import { getContentBlocks } from "@/lib/content/blocks";
import { prisma } from "@/lib/db";

export async function getAnalyticsDashboardData() {
  const [
    totalAffiliateClicks,
    brokerClickGroups,
    campaignClickGroups,
    contentClickGroups,
    marketClickGroups,
    recentClickEvents,
    contentItems,
    affiliateLinks,
    publishedContentWithBrokers,
    orphanContent,
  ] = await Promise.all([
    prisma.affiliateClickEvent.count(),
    prisma.affiliateClickEvent.groupBy({
      by: ["brokerId"],
      where: { brokerId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { brokerId: "desc" } },
      take: 10,
    }),
    prisma.affiliateClickEvent.groupBy({
      by: ["campaign"],
      _count: { _all: true },
      orderBy: { _count: { campaign: "desc" } },
      take: 10,
    }),
    prisma.affiliateClickEvent.groupBy({
      by: ["contentItemId"],
      where: { contentItemId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { contentItemId: "desc" } },
      take: 10,
    }),
    prisma.affiliateClickEvent.groupBy({
      by: ["market"],
      _count: { _all: true },
      orderBy: { _count: { market: "desc" } },
      take: 10,
    }),
    prisma.affiliateClickEvent.findMany({
      orderBy: { clickedAt: "desc" },
      select: { clickedAt: true },
      take: 1000,
    }),
    prisma.contentItem.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        market: true,
        seoMetadata: true,
        template: true,
      },
      take: 250,
    }),
    prisma.affiliateLink.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: {
        broker: true,
        market: true,
      },
      take: 250,
    }),
    prisma.contentItem.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        brokers: { some: {} },
      },
      include: {
        brokers: true,
        market: true,
        template: true,
      },
      take: 100,
    }),
    prisma.contentItem.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        internalLinkTargetSuggestions: {
          none: { status: "ACCEPTED" },
        },
      },
      include: { market: true },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
  ]);

  const [brokersById, contentById] = await Promise.all([
    prisma.broker.findMany({
      where: {
        id: {
          in: brokerClickGroups
            .map((group) => group.brokerId)
            .filter((id): id is string => Boolean(id)),
        },
      },
      select: { id: true, name: true, slug: true },
    }),
    prisma.contentItem.findMany({
      where: {
        id: {
          in: contentClickGroups
            .map((group) => group.contentItemId)
            .filter((id): id is string => Boolean(id)),
        },
      },
      include: { market: true },
    }),
  ]);

  const brokerLookup = new Map(brokersById.map((broker) => [broker.id, broker]));
  const contentLookup = new Map(contentById.map((content) => [content.id, content]));

  const topBrokers = brokerClickGroups.map((group) => ({
    broker: group.brokerId ? brokerLookup.get(group.brokerId) : null,
    clicks: group._count._all,
  }));
  const topContent = contentClickGroups.map((group) => ({
    content: group.contentItemId ? contentLookup.get(group.contentItemId) : null,
    clicks: group._count._all,
  }));
  const topCampaigns = campaignClickGroups.map((group) => ({
    campaign: group.campaign,
    clicks: group._count._all,
  }));
  const topMarkets = marketClickGroups.map((group) => ({
    market: group.market,
    clicks: group._count._all,
  }));
  const clicksByDate = Object.entries(
    recentClickEvents.reduce<Record<string, number>>((counts, event) => {
      const date = event.clickedAt.toISOString().slice(0, 10);
      counts[date] = (counts[date] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  const contentMissingSeo = contentItems
    .filter(
      (item) =>
        !item.seoMetadata?.title.trim() ||
        !item.seoMetadata.description.trim() ||
        !item.seoMetadata.canonicalPath.trim(),
    )
    .slice(0, 25);

  const inactiveOrEmptyAffiliateLinks = affiliateLinks
    .filter(
      (link) =>
        link.status !== AffiliateLinkStatus.ACTIVE || !link.destinationUrl.trim(),
    )
    .slice(0, 25);

  const missingAffiliateCtas: Array<{
    campaign: string;
    contentId: string;
    market: string;
    title: string;
  }> = [];

  for (const item of publishedContentWithBrokers) {
    const ctaBlocks = getContentBlocks(item.body, item.template).filter(
      (block) => block.type === "cta_slot",
    );

    for (const block of ctaBlocks) {
      const broker = item.brokers[0];

      if (!broker) {
        continue;
      }

      const resolved = await resolveAffiliateUrl({
        broker: broker.slug,
        campaign: block.campaign,
        language: item.market.languageCode,
        market: item.market.code,
      });

      if (!resolved) {
        missingAffiliateCtas.push({
          campaign: block.campaign,
          contentId: item.id,
          market: item.market.code,
          title: item.title,
        });
      }
    }
  }

  return {
    affiliateLinks,
    contentMissingSeo,
    inactiveOrEmptyAffiliateLinks,
    missingAffiliateCtas: missingAffiliateCtas.slice(0, 25),
    orphanContent,
    topBrokers,
    topCampaigns,
    topContent,
    topMarkets,
    clicksByDate,
    totalAffiliateClicks,
  };
}
