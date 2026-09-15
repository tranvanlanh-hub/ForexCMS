import { PrismaClient, BrokerStatus } from "@prisma/client";
import { readFile } from "node:fs/promises";

const apply = process.argv.includes("--apply");
const inputUrl = new URL("../data/brokers/research-20260915.json", import.meta.url);
const rows = JSON.parse(await readFile(inputUrl, "utf8"));
const prisma = new PrismaClient();

function isPlaceholder(value) {
  return typeof value === "string" && (/example\.com/i.test(value) || /\bdemo\b/i.test(value));
}

function fillable(existingValue, incomingValue) {
  if (incomingValue === null || incomingValue === undefined || incomingValue === "") return existingValue;
  if (existingValue === null || existingValue === undefined || existingValue === "" || isPlaceholder(existingValue)) {
    return incomingValue;
  }
  return existingValue;
}

async function main() {
  const existing = await prisma.broker.findMany({ where: { slug: { in: rows.map((row) => row.slug) } } });
  const bySlug = new Map(existing.map((broker) => [broker.slug, broker]));
  const plan = rows.map((row) => ({ slug: row.slug, action: bySlug.has(row.slug) ? "fill-missing" : "create" }));

  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", total: rows.length, create: plan.filter((item) => item.action === "create").length, fillMissing: plan.filter((item) => item.action === "fill-missing").length }, null, 2));
  if (!apply) return;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const current = bySlug.get(row.slug);
      if (!current) {
        await tx.broker.create({ data: { ...row, status: BrokerStatus.DRAFT } });
        continue;
      }

      await tx.broker.update({
        where: { id: current.id },
        data: {
          name: fillable(current.name, row.name),
          legalName: fillable(current.legalName, row.legalName),
          websiteUrl: fillable(current.websiteUrl, row.websiteUrl),
          supportEmail: fillable(current.supportEmail, row.supportEmail),
          supportPhone: fillable(current.supportPhone, row.supportPhone),
          contactPageUrl: fillable(current.contactPageUrl, row.contactPageUrl),
          foundedYear: fillable(current.foundedYear, row.foundedYear),
          headquartersCountry: fillable(current.headquartersCountry, row.headquartersCountry),
          headquartersAddress: fillable(current.headquartersAddress, row.headquartersAddress),
          priority: current.priority === 100 ? row.priority : current.priority,
        },
      });
    }
  });

  const inserted = await prisma.broker.findMany({
    where: { slug: { in: rows.map((row) => row.slug) } },
    orderBy: [{ priority: "asc" }, { name: "asc" }],
    select: { slug: true, status: true, priority: true },
  });
  const missing = rows.filter((row) => !inserted.some((broker) => broker.slug === row.slug)).map((row) => row.slug);
  console.log(JSON.stringify({ imported: inserted.length, missing, allDraftOrPreserved: inserted.every((broker) => Object.values(BrokerStatus).includes(broker.status)) }, null, 2));
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
