"use server";

import { BrokerStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { brokerStatusLabels } from "@/lib/affiliate";
import { parseBrokerFactLines } from "@/lib/broker-facts";
import { revalidatePublicOperationalCache } from "@/lib/cache/public";
import { normalizeSlug } from "@/lib/content";
import { prisma } from "@/lib/db";

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

function redirectWithError(path: string, errors: string[]): never {
  redirect(`${path}?error=${encodeURIComponent(errors.join(" "))}`);
}

function buildBrokerInput(formData: FormData) {
  const name = field(formData, "name");
  const slug = normalizeSlug(field(formData, "slug"));
  const status = asBrokerStatus(formData.get("status"));
  const logoUrl = field(formData, "logoUrl");
  const description = field(formData, "description");
  const factsInput = parseBrokerFactLines(field(formData, "facts"));
  const errors: string[] = [];

  if (!name) errors.push("Broker name is required.");
  if (!slug) errors.push("Broker slug is required.");
  if (!brokerStatusLabels[status]) errors.push("Broker status is invalid.");
  if (!isUrl(logoUrl)) errors.push("Logo/media URL must be a valid HTTP URL.");
  errors.push(...factsInput.errors);
  if (description.length > 280) {
    errors.push("Short description must be 280 characters or less.");
  }

  return {
    data: {
      name,
      slug,
      status,
      logoUrl: logoUrl || null,
      description: description || null,
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
  const input = buildBrokerInput(formData);

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
  const id = field(formData, "id");
  const editPath = `/admin/brokers/${id}/edit`;

  if (!id) {
    redirectWithError("/admin/brokers", ["Broker ID is missing."]);
  }

  const input = buildBrokerInput(formData);

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
