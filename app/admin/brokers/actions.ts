"use server";

import { BrokerStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { brokerStatusLabels } from "@/lib/affiliate";
import { parseBrokerFactLines } from "@/lib/broker-facts";
import {
  brokerRatingFields,
  type BrokerRatingFieldName,
} from "@/lib/brokers/review-fields";
import { revalidatePublicOperationalCache } from "@/lib/cache/public";
import { normalizeSlug } from "@/lib/content";
import { prisma } from "@/lib/db";
import { requireAdminMutation } from "@/lib/admin/session";

const allowedStatuses = new Set<BrokerStatus>(Object.values(BrokerStatus));

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function asBrokerStatus(value: FormDataEntryValue | null): BrokerStatus {
  return allowedStatuses.has(value as BrokerStatus)
    ? (value as BrokerStatus)
    : BrokerStatus.DRAFT;
}

function isUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parsePriority(value: string, errors: string[]) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9999) {
    errors.push("Priority must be an integer from 1 to 9999.");
    return 100;
  }

  return parsed;
}

function parseFoundedYear(value: string, errors: string[]) {
  if (!value) return null;
  const parsed = Number(value);
  const currentYear = new Date().getUTCFullYear();

  if (!Number.isInteger(parsed) || parsed < 1800 || parsed > currentYear) {
    errors.push(`Founded year must be between 1800 and ${currentYear}.`);
    return null;
  }

  return parsed;
}

function parseRating(value: string, label: string, errors: string[]) {
  if (!value) return null;

  if (!/^\d(?:\.\d)?$/.test(value)) {
    errors.push(`${label} must use at most one decimal place.`);
    return null;
  }

  const parsed = Number(value);
  if (parsed < 0 || parsed > 5) {
    errors.push(`${label} must be between 0 and 5.`);
    return null;
  }

  return parsed;
}

function parseReviewDate(value: string, errors: string[]) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push("Rating review date must be a valid date.");
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    errors.push("Rating review date must be a valid date.");
    return null;
  }

  return parsed;
}

function redirectWithError(path: string, errors: string[]): never {
  redirect(`${path}?error=${encodeURIComponent(errors.join(" "))}`);
}

async function buildBrokerInput(formData: FormData) {
  const name = field(formData, "name");
  const slug = normalizeSlug(field(formData, "slug"));
  const status = asBrokerStatus(formData.get("status"));
  const legalName = field(formData, "legalName");
  const websiteUrl = field(formData, "websiteUrl");
  const supportEmail = field(formData, "supportEmail");
  const supportPhone = field(formData, "supportPhone");
  const contactPageUrl = field(formData, "contactPageUrl");
  const headquartersCountry = field(formData, "headquartersCountry");
  const headquartersAddress = field(formData, "headquartersAddress");
  const logoUrl = field(formData, "logoUrl");
  const logoMediaId = field(formData, "logoMediaId") || null;
  const description = field(formData, "description");
  const ratingSummary = field(formData, "ratingSummary");
  const factsInput = parseBrokerFactLines(field(formData, "facts"));
  const errors: string[] = [];
  const priority = parsePriority(field(formData, "priority") || "100", errors);
  const foundedYear = parseFoundedYear(field(formData, "foundedYear"), errors);
  const ratingReviewedAt = parseReviewDate(
    field(formData, "ratingReviewedAt"),
    errors,
  );
  const ratings = Object.fromEntries(
    brokerRatingFields.map(({ name: ratingName, label }) => [
      ratingName,
      parseRating(field(formData, ratingName), label, errors),
    ]),
  ) as Record<BrokerRatingFieldName, number | null>;

  if (!name) errors.push("Broker name is required.");
  if (!slug) errors.push("Broker slug is required.");
  if (!brokerStatusLabels[status]) errors.push("Broker status is invalid.");
  if (!isUrl(websiteUrl)) errors.push("Website URL must be a valid HTTP URL.");
  if (!isUrl(contactPageUrl)) {
    errors.push("Contact page URL must be a valid HTTP URL.");
  }
  if (!isUrl(logoUrl)) errors.push("Logo/media URL must be a valid HTTP URL.");
  if (
    supportEmail &&
    (supportEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail))
  ) {
    errors.push("Support email must be a valid email address.");
  }
  if (
    supportPhone &&
    (supportPhone.length > 50 || !/^[0-9+().\s/-]{3,50}$/.test(supportPhone))
  ) {
    errors.push("Support phone contains unsupported characters.");
  }
  errors.push(...factsInput.errors);
  if (description.length > 280) {
    errors.push("Short description must be 280 characters or less.");
  }
  if (headquartersAddress.length > 500) {
    errors.push("Headquarters address must be 500 characters or less.");
  }
  if (ratingSummary.length > 1000) {
    errors.push("Rating summary must be 1000 characters or less.");
  }
  if (logoMediaId) {
    const media = await prisma.mediaAsset.findFirst({ where: { id: logoMediaId, status: "READY" }, select: { id: true } });
    if (!media) errors.push("Selected media library logo is not ready.");
  }

  return {
    data: {
      name,
      slug,
      status,
      priority,
      legalName: legalName || null,
      websiteUrl: websiteUrl || null,
      supportEmail: supportEmail || null,
      supportPhone: supportPhone || null,
      contactPageUrl: contactPageUrl || null,
      foundedYear,
      headquartersCountry: headquartersCountry || null,
      headquartersAddress: headquartersAddress || null,
      logoUrl: logoUrl || null,
      logoMediaId,
      description: description || null,
      ...ratings,
      ratingSummary: ratingSummary || null,
      ratingReviewedAt,
    },
    facts: factsInput.facts,
    errors,
  };
}

async function resolveFactMarkets(
  facts: ReturnType<typeof parseBrokerFactLines>["facts"],
) {
  const marketCodes = [
    ...new Set(
      facts
        .map((fact) => fact.marketCode)
        .filter((code): code is string => Boolean(code)),
    ),
  ];

  if (marketCodes.length === 0) {
    return { marketIdsByCode: new Map<string, string>(), errors: [] };
  }

  const markets = await prisma.market.findMany({
    where: {
      code: {
        in: marketCodes as string[],
      },
    },
    select: {
      code: true,
      id: true,
    },
  });
  const marketIdsByCode = new Map(markets.map((market) => [market.code, market.id]));
  const errors = marketCodes
    .filter((code): code is string => Boolean(code) && !marketIdsByCode.has(code))
    .map((code) => `Fact references unknown market: ${code}.`);

  return { marketIdsByCode, errors };
}

function buildFactCreateInput(args: {
  brokerId: string;
  facts: ReturnType<typeof parseBrokerFactLines>["facts"];
  marketIdsByCode: Map<string, string>;
}) {
  return args.facts.map((fact) => ({
    brokerId: args.brokerId,
      marketId: fact.marketCode
        ? (args.marketIdsByCode.get(fact.marketCode) ?? null)
        : null,
    category: fact.category,
    label: fact.label,
    value: fact.value,
    unit: fact.unit,
    appliesTo: fact.appliesTo,
    sourceName: fact.sourceName,
    sourceUrl: fact.sourceUrl,
    citationText: fact.citationText,
    sourceRetrievedAt: fact.sourceRetrievedAt,
    displayOrder: fact.displayOrder,
    isPrimary: fact.isPrimary,
  }));
}

export async function createBrokerAction(formData: FormData) {
  await requireAdminMutation(formData);
  const input = await buildBrokerInput(formData);

  if (input.errors.length > 0) {
    redirectWithError("/admin/brokers/new", input.errors);
  }

  const { marketIdsByCode, errors } = await resolveFactMarkets(input.facts);

  if (errors.length > 0) {
    redirectWithError("/admin/brokers/new", errors);
  }

  let brokerId = "";

  try {
    const broker = await prisma.$transaction(async (tx) => {
      const createdBroker = await tx.broker.create({ data: input.data });
      const factRows = buildFactCreateInput({
        brokerId: createdBroker.id,
        facts: input.facts,
        marketIdsByCode,
      });

      if (factRows.length > 0) {
        await tx.brokerFact.createMany({ data: factRows });
      }

      return createdBroker;
    });
    brokerId = broker.id;
    revalidatePath("/admin/brokers");
    revalidatePublicOperationalCache();
  } catch {
    redirectWithError("/admin/brokers/new", [
      "Broker could not be saved. Check for duplicate slug.",
    ]);
  }

  redirect(`/admin/brokers/${brokerId}/edit?saved=1`);
}

export async function updateBrokerAction(formData: FormData) {
  await requireAdminMutation(formData);
  const id = field(formData, "id");
  const editPath = `/admin/brokers/${id}/edit`;

  if (!id) {
    redirectWithError("/admin/brokers", ["Broker ID is missing."]);
  }

  const input = await buildBrokerInput(formData);

  if (input.errors.length > 0) {
    redirectWithError(editPath, input.errors);
  }

  const { marketIdsByCode, errors } = await resolveFactMarkets(input.facts);

  if (errors.length > 0) {
    redirectWithError(editPath, errors);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.broker.update({
        where: { id },
        data: input.data,
      });
      await tx.brokerFact.deleteMany({ where: { brokerId: id } });
      const factRows = buildFactCreateInput({
        brokerId: id,
        facts: input.facts,
        marketIdsByCode,
      });

      if (factRows.length > 0) {
        await tx.brokerFact.createMany({ data: factRows });
      }
    });
    revalidatePath("/admin/brokers");
    revalidatePath(editPath);
    revalidatePublicOperationalCache();
  } catch {
    redirectWithError(editPath, [
      "Broker could not be updated. Check for duplicate slug.",
    ]);
  }

  redirect(`${editPath}?saved=1`);
}
