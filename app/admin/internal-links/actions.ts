"use server";

import {
  ContentType,
  InternalLinkRuleMode,
  InternalLinkRuleStatus,
  InternalLinkSuggestionStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateInternalLinkSuggestionsForContent } from "@/lib/internal-links";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function redirectWithError(errors: string[]): never {
  const message = encodeURIComponent(errors.join(" "));
  redirect(`/admin/internal-links?error=${message}`);
}

function optionalField(formData: FormData, name: string) {
  const value = field(formData, name);
  return value || null;
}

function numberField(formData: FormData, name: string, fallback: number) {
  const value = Number(field(formData, name));
  return Number.isFinite(value) ? value : fallback;
}

export async function createInternalLinkRuleAction(formData: FormData) {
  const name = field(formData, "name");
  const marketId = field(formData, "marketId");
  const languageCode = field(formData, "languageCode").toLowerCase();
  const topicClusterId = optionalField(formData, "topicClusterId");
  const targetContentItemId = optionalField(formData, "targetContentItemId");
  const sourceContentType = optionalField(formData, "sourceContentType") as
    | ContentType
    | null;
  const targetContentType = optionalField(formData, "targetContentType") as
    | ContentType
    | null;
  const mode = field(formData, "mode") as InternalLinkRuleMode;
  const status = field(formData, "status") as InternalLinkRuleStatus;
  const maxLinksPerContent = numberField(formData, "maxLinksPerContent", 6);
  const minWordsBetweenLinks = numberField(formData, "minWordsBetweenLinks", 120);
  const priority = numberField(formData, "priority", 100);
  const errors: string[] = [];

  if (!name) errors.push("Rule name is required.");
  if (!marketId) errors.push("Market is required.");
  if (!languageCode) errors.push("Language is required.");
  if (!Object.values(InternalLinkRuleMode).includes(mode)) {
    errors.push("Rule mode is invalid.");
  }
  if (!Object.values(InternalLinkRuleStatus).includes(status)) {
    errors.push("Rule status is invalid.");
  }
  if (
    sourceContentType &&
    !Object.values(ContentType).includes(sourceContentType)
  ) {
    errors.push("Source content type is invalid.");
  }
  if (
    targetContentType &&
    !Object.values(ContentType).includes(targetContentType)
  ) {
    errors.push("Target content type is invalid.");
  }
  if (maxLinksPerContent < 1 || maxLinksPerContent > 8) {
    errors.push("Max links per content must be between 1 and 8.");
  }
  if (minWordsBetweenLinks < 80) {
    errors.push("Minimum spacing must be at least 80 words.");
  }

  if (errors.length > 0) {
    redirectWithError(errors);
  }

  const market = await prisma.market.findUnique({ where: { id: marketId } });

  if (!market || market.languageCode.toLowerCase() !== languageCode) {
    redirectWithError(["Rule language must match the selected market language."]);
  }

  if (topicClusterId) {
    const cluster = await prisma.topicCluster.findFirst({
      where: { id: topicClusterId, marketId, languageCode },
      select: { id: true },
    });

    if (!cluster) {
      redirectWithError([
        "Topic cluster must belong to the selected market and language.",
      ]);
    }
  }

  if (targetContentItemId) {
    const target = await prisma.contentItem.findFirst({
      where: {
        id: targetContentItemId,
        marketId,
        market: { languageCode },
      },
      select: { id: true },
    });

    if (!target) {
      redirectWithError([
        "Priority target must belong to the selected market and language.",
      ]);
    }
  }

  await prisma.internalLinkRule.create({
    data: {
      name,
      marketId,
      languageCode,
      topicClusterId,
      targetContentItemId,
      sourceContentType,
      targetContentType,
      mode,
      status,
      maxLinksPerContent,
      minWordsBetweenLinks,
      priority,
    },
  });

  revalidatePath("/admin/internal-links");
  redirect("/admin/internal-links?saved=Internal link rule created.");
}

export async function generateInternalLinkSuggestionsAction(formData: FormData) {
  const contentItemId = field(formData, "contentItemId");

  if (!contentItemId) {
    redirectWithError(["Choose a source article before generating suggestions."]);
  }

  try {
    const result = await generateInternalLinkSuggestionsForContent(contentItemId);
    const message = encodeURIComponent(
      result.created > 0
        ? `Generated ${result.created} internal link suggestion(s).`
        : result.skipped ?? "No safe internal link suggestions were found.",
    );

    revalidatePath("/admin/internal-links");
    redirect(`/admin/internal-links?saved=${message}`);
  } catch {
    redirectWithError([
      "Suggestions could not be generated. Check migration state and content data.",
    ]);
  }
}

export async function updateInternalLinkSuggestionStatusAction(
  formData: FormData,
) {
  const suggestionId = field(formData, "suggestionId");
  const status = field(formData, "status") as InternalLinkSuggestionStatus;

  if (!suggestionId) {
    redirectWithError(["Suggestion ID is missing."]);
  }

  if (
    status !== InternalLinkSuggestionStatus.ACCEPTED &&
    status !== InternalLinkSuggestionStatus.REJECTED
  ) {
    redirectWithError(["Unsupported suggestion status."]);
  }

  try {
    await prisma.internalLinkSuggestion.update({
      where: { id: suggestionId },
      data: { status },
    });

    revalidatePath("/admin/internal-links");
    redirect("/admin/internal-links?saved=Suggestion updated.");
  } catch {
    redirectWithError(["Suggestion could not be updated."]);
  }
}
