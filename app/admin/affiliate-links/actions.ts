"use server";

import { AffiliateLinkStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  affiliateLinkStatusLabels,
  normalizeCampaignToken,
} from "@/lib/affiliate";
import { revalidateAffiliateResolverCache } from "@/lib/cache/public";
import { prisma } from "@/lib/db";

const allowedStatuses = new Set<AffiliateLinkStatus>(
  Object.values(AffiliateLinkStatus),
);

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function asAffiliateStatus(
  value: FormDataEntryValue | null,
): AffiliateLinkStatus {
  return allowedStatuses.has(value as AffiliateLinkStatus)
    ? (value as AffiliateLinkStatus)
    : AffiliateLinkStatus.DRAFT;
}

function redirectWithError(path: string, errors: string[]): never {
  redirect(`${path}?error=${encodeURIComponent(errors.join(" "))}`);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function buildAffiliateLinkInput(formData: FormData) {
  const brokerId = field(formData, "brokerId");
  const marketId = field(formData, "marketId");
  const languageCode = field(formData, "languageCode").toLowerCase();
  const campaign = normalizeCampaignToken(field(formData, "campaign"));
  const destinationUrl = field(formData, "destinationUrl");
  const status = asAffiliateStatus(formData.get("status"));
  const priority = Number.parseInt(field(formData, "priority"), 10);
  const errors: string[] = [];

  if (!brokerId) errors.push("Broker is required.");
  if (!marketId) errors.push("Market is required.");
  if (!languageCode) errors.push("Language is required.");
  if (!campaign) errors.push("Campaign is required.");
  if (!isHttpUrl(destinationUrl)) {
    errors.push("Destination URL must be a valid HTTP URL.");
  }
  if (!affiliateLinkStatusLabels[status]) {
    errors.push("Affiliate link status is invalid.");
  }
  if (!Number.isInteger(priority) || priority < 1) {
    errors.push("Priority must be a positive number.");
  }

  return {
    data: {
      brokerId,
      marketId,
      languageCode,
      campaign,
      destinationUrl,
      status,
      priority: Number.isInteger(priority) && priority > 0 ? priority : 100,
      sponsored: true,
      nofollow: true,
    },
    errors,
  };
}

export async function createAffiliateLinkAction(formData: FormData) {
  const input = buildAffiliateLinkInput(formData);

  if (input.errors.length > 0) {
    redirectWithError("/admin/affiliate-links/new", input.errors);
  }

  try {
    const link = await prisma.affiliateLink.create({ data: input.data });
    revalidatePath("/admin/affiliate-links");
    revalidateAffiliateResolverCache();
    redirect(`/admin/affiliate-links/${link.id}/edit?saved=1`);
  } catch {
    redirectWithError("/admin/affiliate-links/new", [
      "Affiliate link could not be saved. Check broker, market, campaign, and priority.",
    ]);
  }
}

export async function updateAffiliateLinkAction(formData: FormData) {
  const id = field(formData, "id");
  const editPath = `/admin/affiliate-links/${id}/edit`;

  if (!id) {
    redirectWithError("/admin/affiliate-links", [
      "Affiliate link ID is missing.",
    ]);
  }

  const input = buildAffiliateLinkInput(formData);

  if (input.errors.length > 0) {
    redirectWithError(editPath, input.errors);
  }

  try {
    await prisma.affiliateLink.update({
      where: { id },
      data: input.data,
    });
    revalidatePath("/admin/affiliate-links");
    revalidatePath(editPath);
    revalidateAffiliateResolverCache();
    redirect(`${editPath}?saved=1`);
  } catch {
    redirectWithError(editPath, [
      "Affiliate link could not be updated. Check broker, market, campaign, and priority.",
    ]);
  }
}
