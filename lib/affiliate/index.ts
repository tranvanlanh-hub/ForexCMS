import { AffiliateLinkStatus, type AffiliateLinkStatus as AffiliateStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeSlug } from "@/lib/content";
import { logEvent } from "@/lib/observability/logging";

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
  brokerId: string;
  brokerName: string;
  campaign: string;
  destinationUrl: string;
  market: string;
  rel: "sponsored nofollow";
};

export function buildAffiliateClickHref(input: {
  affiliateLinkId: string;
  contentId?: string;
}) {
  const params = new URLSearchParams();

  if (input.contentId) {
    params.set("contentId", input.contentId);
  }

  const query = params.toString();

  return `/affiliate/click/${input.affiliateLinkId}${query ? `?${query}` : ""}`;
}

export function sanitizeAffiliateReferrer(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return trimmed.split(/[?#]/)[0].slice(0, 500);
  }
}

export function extractAffiliateTokensFromText(body: string): AffiliateToken[] {
  const tokens: AffiliateToken[] = [];
  const bracketTokenPattern =
    /\[affiliate:([a-z0-9-]+):([a-z0-9-]+):([a-z0-9_-]+)(?::([a-z-]+))?\]/gi;
  const handlebarTokenPattern = /\{\{\s*affiliate\s+([^}]+)\}\}/gi;
  let match: RegExpExecArray | null;

  while ((match = bracketTokenPattern.exec(body)) !== null) {
    tokens.push({
      market: match[1],
      broker: match[2],
      campaign: match[3],
      language: match[4],
    });
  }

  while ((match = handlebarTokenPattern.exec(body)) !== null) {
    const attrs = Object.fromEntries(
      [...match[1].matchAll(/([a-zA-Z]+)=["']([^"']+)["']/g)].map((attr) => [
        attr[1],
        attr[2],
      ]),
    );

    if (attrs.broker && attrs.campaign) {
      tokens.push({
        broker: attrs.broker,
        campaign: attrs.campaign,
        market: attrs.market ?? "",
        language: attrs.language,
      });
    }
  }

  return tokens;
}

export async function recordAffiliateClickEvent(input: {
  affiliateLinkId: string;
  contentItemId?: string | null;
  referrer?: string | null;
}) {
  const now = new Date();
  const link = await prisma.affiliateLink.findFirst({
    where: {
      id: input.affiliateLinkId,
      status: AffiliateLinkStatus.ACTIVE,
      broker: { status: "ACTIVE" },
      market: { status: "ACTIVE" },
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    include: {
      broker: { select: { id: true } },
      market: { select: { code: true } },
    },
  });

  if (!link) {
    return null;
  }

  let contentItemId: string | null = null;

  if (input.contentItemId) {
    const content = await prisma.contentItem.findFirst({
      where: {
        id: input.contentItemId,
        market: { code: link.market.code },
      },
      select: { id: true },
    });
    contentItemId = content?.id ?? null;
  }

  try {
    await prisma.affiliateClickEvent.create({
      data: {
        affiliateLinkId: link.id,
        brokerId: link.brokerId,
        contentItemId,
        market: link.market.code,
        campaign: link.campaign,
        referrer: sanitizeAffiliateReferrer(input.referrer),
      },
    });
  } catch (error) {
    logEvent("warn", "affiliate_click_tracking_failed", {
      affiliateLinkId: link.id,
      error,
    });
    // Tracking must never block the affiliate redirect.
  }

  return {
    destinationUrl: link.destinationUrl,
  };
}

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
    brokerId: link.brokerId,
    brokerName: link.broker.name,
    campaign: link.campaign,
    destinationUrl: link.destinationUrl,
    market: marketCode,
    rel: "sponsored nofollow",
  };
}
