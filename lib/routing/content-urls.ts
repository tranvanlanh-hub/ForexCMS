import { ContentStatus, MarketStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export function normalizeContentPath(value: string) {
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.includes("?") || path.includes("#")) return "";
  if (/%2f|%5c|\.{2}/i.test(path)) return "";
  const normalized = path.endsWith("/") ? path : `${path}/`;
  return /^\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(normalized)
    ? normalized
    : "";
}

export async function claimContentUrl(
  tx: Prisma.TransactionClient,
  input: {
    contentItemId: string;
    marketId: string;
    path: string;
    published: boolean;
  },
) {
  const existing = await tx.contentUrl.findUnique({ where: { path: input.path } });
  if (existing && existing.contentItemId !== input.contentItemId) {
    throw new Error("CONTENT_URL_TAKEN");
  }

  await tx.contentUrl.upsert({
    where: { path: input.path },
    create: {
      path: input.path,
      contentItemId: input.contentItemId,
      marketId: input.marketId,
      publishedOnce: input.published,
    },
    update: {
      marketId: input.marketId,
      publishedOnce: input.published ? true : undefined,
    },
  });
}

export async function releaseUnpublishedContentUrl(
  tx: Prisma.TransactionClient,
  input: { contentItemId: string; path: string },
) {
  await tx.contentUrl.deleteMany({
    where: {
      contentItemId: input.contentItemId,
      path: input.path,
      publishedOnce: false,
      source: "CONTENT",
    },
  });
}

export async function getPublishedRedirectByPath(path: string) {
  const normalizedPath = normalizeContentPath(path);
  if (!normalizedPath) return null;

  const alias = await prisma.contentUrl.findUnique({
    where: { path: normalizedPath },
    include: {
      contentItem: {
        include: { market: true },
      },
    },
  });

  if (
    !alias ||
    alias.path === alias.contentItem.canonicalPath ||
    !alias.redirectEnabled ||
    (!alias.publishedOnce && alias.source !== "MANUAL") ||
    alias.contentItem.status !== ContentStatus.PUBLISHED ||
    alias.contentItem.market.status !== MarketStatus.ACTIVE
  ) return null;

  return alias.contentItem.canonicalPath;
}
