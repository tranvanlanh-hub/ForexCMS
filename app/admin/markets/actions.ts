"use server";

import { MarketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getSupportedMarketDefinition,
  marketStatusLabels,
} from "@/lib/market";
import { prisma } from "@/lib/db";
import { requireAdminMutation } from "@/lib/admin/session";

const allowedStatuses = new Set<MarketStatus>(Object.values(MarketStatus));

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function asMarketStatus(value: FormDataEntryValue | null): MarketStatus {
  return allowedStatuses.has(value as MarketStatus)
    ? (value as MarketStatus)
    : MarketStatus.ACTIVE;
}

function normalizeLocale(value: string) {
  return value.trim().replace("_", "-");
}

function redirectWithError(path: string, errors: string[]): never {
  redirect(`${path}?error=${encodeURIComponent(errors.join(" "))}`);
}

function buildMarketInput(formData: FormData) {
  const code = field(formData, "code").toLowerCase();
  const definition = getSupportedMarketDefinition(code);
  const name = field(formData, "name") || definition?.name || "";
  const languageCode =
    field(formData, "languageCode").toLowerCase() ||
    definition?.languageCode ||
    "";
  const locale = normalizeLocale(field(formData, "locale") || definition?.locale || "");
  const countryCode =
    field(formData, "countryCode").toUpperCase() ||
    definition?.countryCode ||
    null;
  const status = asMarketStatus(formData.get("status"));
  const errors: string[] = [];

  if (!definition) {
    errors.push("Market code must be one of global, us, uk, au, vn, or th.");
  }
  if (!name) errors.push("Market name is required.");
  if (!languageCode) errors.push("Language code is required.");
  if (!locale) errors.push("Locale is required.");
  if (code !== "global" && !countryCode) {
    errors.push("Country code is required for country markets.");
  }
  if (!marketStatusLabels[status]) errors.push("Market status is invalid.");

  return {
    data: {
      code,
      name,
      languageCode,
      locale,
      countryCode: code === "global" ? null : countryCode,
      isGlobal: code === "global",
      status,
    },
    errors,
  };
}

export async function createMarketAction(formData: FormData) {
  await requireAdminMutation(formData);
  const input = buildMarketInput(formData);

  if (input.errors.length > 0) {
    redirectWithError("/admin/markets/new", input.errors);
  }

  try {
    const market = await prisma.market.create({ data: input.data });
    revalidatePath("/admin/markets");
    redirect(`/admin/markets/${market.id}/edit?saved=1`);
  } catch {
    redirectWithError("/admin/markets/new", [
      "Market could not be saved. Check for duplicate code.",
    ]);
  }
}

export async function updateMarketAction(formData: FormData) {
  await requireAdminMutation(formData);
  const id = field(formData, "id");
  const editPath = `/admin/markets/${id}/edit`;

  if (!id) {
    redirectWithError("/admin/markets", ["Market ID is missing."]);
  }

  const input = buildMarketInput(formData);

  if (input.errors.length > 0) {
    redirectWithError(editPath, input.errors);
  }

  const existing = await prisma.market.findUnique({
    where: { id },
    select: { code: true, _count: { select: { contentItems: true } } },
  });
  if (existing && existing.code !== input.data.code && existing._count.contentItems > 0) {
    redirectWithError(editPath, [
      "Market code cannot change while the market owns content URLs.",
    ]);
  }

  try {
    await prisma.market.update({
      where: { id },
      data: input.data,
    });
    revalidatePath("/admin/markets");
    revalidatePath(editPath);
    redirect(`${editPath}?saved=1`);
  } catch {
    redirectWithError(editPath, [
      "Market could not be updated. Check for duplicate code.",
    ]);
  }
}
