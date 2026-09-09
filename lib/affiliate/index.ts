import { AffiliateLinkStatus, type AffiliateLinkStatus as AffiliateStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeSlug } from "@/lib/content";

export type AffiliateToken = {
  broker: string;
  market: string;
  campaign: string;
  language?: string;
};

export function formatAffiliateToken(token: AffiliateToken): string {
  return `${token.market}:${token.broker}:${token.campaign}`;
}

export function normalizeCampaignToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const brokerStatusLabels = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
} as const;

export const affiliateLinkStatusLabels: Record<AffiliateStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  ARCHIVED: "Archived",
};

export type AffiliateResolution = {
  affiliateLinkId: string;
  brokerName: string;
  campaign: string;
  destinationUrl: string;
  rel: "sponsored nofollow";
};

export async function resolveAffiliateUrl(
  token: AffiliateToken,
): Promise<AffiliateResolution | null> {
  const brokerSlug = normalizeSlug(token.broker);
  const marketCode = normalizeSlug(token.market);
  const campaign = normalizeCampaignToken(token.campaign);
  const languageCode = (token.language ?? "").trim().toLowerCase();
  const now = new Date();

  if (!brokerSlug || !marketCode || !campaign) {
    return null;
  }

  const link = await prisma.affiliateLink.findFirst({
    where: {
      campaign,
      status: AffiliateLinkStatus.ACTIVE,
      broker: {
        slug: brokerSlug,
        status: "ACTIVE",
      },
      market: {
        code: marketCode,
        status: "ACTIVE",
      },
      ...(languageCode ? { languageCode } : {}),
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
    include: {
      broker: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!link) {
    return null;
  }

  return {
    affiliateLinkId: link.id,
    brokerName: link.broker.name,
    campaign: link.campaign,
    destinationUrl: link.destinationUrl,
    rel: "sponsored nofollow",
  };
}
