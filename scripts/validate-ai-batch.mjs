import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const inputPath = getArg("--input", "data/ai-content/pilot-50-drafts.json");
const rejectReportPath = getArg(
  "--reject-report",
  "data/ai-content/last-batch-reject-report.json",
);
const maxSize = Number(getArg("--max-size", "50"));
const dryRun = !args.includes("--import-drafts");

const contentTypeSegments = {
  ARTICLE: "articles",
  GUIDE: "guides",
  BROKER_REVIEW: "broker-reviews",
  BEST_BROKER_LIST: "best-brokers",
  COUNTRY_HUB: "country",
};

const templateByType = {
  ARTICLE: "article",
  GUIDE: "guide",
  BROKER_REVIEW: "broker-review",
  BEST_BROKER_LIST: "best-broker-list",
  COUNTRY_HUB: "country-hub",
};

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function canonicalPath(item) {
  return `/${item.market}/${contentTypeSegments[item.contentType]}/${item.slug}/`;
}

function hasRawUrl(value) {
  return typeof value === "string" && /https?:\/\//i.test(value);
}

function validateAffiliateToken(token) {
  return (
    token &&
    hasText(token.broker) &&
    hasText(token.market) &&
    hasText(token.language) &&
    /^[a-z0-9_-]+$/.test(token.campaign || "") &&
    !hasRawUrl(JSON.stringify(token))
  );
}

function addReject(rejectsById, item, reason) {
  const id = item?.id || "batch";
  const existing = rejectsById.get(id) ?? {
    id,
    title: item?.title || "",
    canonicalPath: item?.canonicalPath || "",
    reasons: [],
  };

  existing.reasons.push(reason);
  rejectsById.set(id, existing);
}

const rawItems = JSON.parse(readFileSync(inputPath, "utf8"));

if (!Array.isArray(rawItems)) {
  throw new Error("Batch input must be a JSON array.");
}

const rejectsById = new Map();
const slugScopes = new Map();
const canonicalPaths = new Map();
const knownPaths = new Set(rawItems.map((item) => item.canonicalPath));

if (rawItems.length > maxSize) {
  addReject(rejectsById, null, `Batch size ${rawItems.length} exceeds limit ${maxSize}.`);
}

for (const item of rawItems) {
  const scope = `${item.market}:${item.contentType}:${item.slug}`;
  const expectedPath = contentTypeSegments[item.contentType]
    ? canonicalPath(item)
    : "";

  if (!hasText(item.title)) addReject(rejectsById, item, "Missing title.");
  if (!hasText(item.slug)) addReject(rejectsById, item, "Missing slug.");
  if (!hasText(item.market)) addReject(rejectsById, item, "Missing market.");
  if (!hasText(item.language)) addReject(rejectsById, item, "Missing language.");
  if (!hasText(item.body)) addReject(rejectsById, item, "Missing body.");
  if (!hasText(item.seoTitle)) addReject(rejectsById, item, "Missing SEO title.");
  if (!hasText(item.metaDescription)) {
    addReject(rejectsById, item, "Missing meta description.");
  }
  if (!contentTypeSegments[item.contentType]) {
    addReject(rejectsById, item, `Unsupported content type ${item.contentType}.`);
  }
  if (item.template !== templateByType[item.contentType]) {
    addReject(rejectsById, item, "Template does not match content type.");
  }
  if (item.status !== "DRAFT") {
    addReject(rejectsById, item, "Batch safety only accepts DRAFT items.");
  }
  if (expectedPath && item.canonicalPath !== expectedPath) {
    addReject(rejectsById, item, `Canonical path should be ${expectedPath}.`);
  }
  if (hasRawUrl(item.body)) {
    addReject(rejectsById, item, "Body contains a raw URL.");
  }

  if (slugScopes.has(scope)) {
    addReject(
      rejectsById,
      item,
      `Duplicate slug scope also used by ${slugScopes.get(scope)}.`,
    );
  }
  slugScopes.set(scope, item.id);

  if (canonicalPaths.has(item.canonicalPath)) {
    addReject(
      rejectsById,
      item,
      `Duplicate canonical path also used by ${canonicalPaths.get(item.canonicalPath)}.`,
    );
  }
  canonicalPaths.set(item.canonicalPath, item.id);

  const faq = Array.isArray(item.faq) ? item.faq : [];
  if (faq.length === 0 || !/^##\s+FAQ\s*$/im.test(item.body || "")) {
    addReject(rejectsById, item, "FAQ data or FAQ section is missing.");
  }

  const targets = Array.isArray(item.internalLinkTargets)
    ? item.internalLinkTargets
    : [];

  for (const target of targets) {
    if (!knownPaths.has(target)) {
      addReject(rejectsById, item, `Internal link target is not in this batch: ${target}.`);
    }
  }

  const affiliateTokens = Array.isArray(item.affiliateTokens)
    ? item.affiliateTokens
    : [];

  if (
    ["BROKER_REVIEW", "BEST_BROKER_LIST"].includes(item.contentType) &&
    affiliateTokens.length === 0
  ) {
    addReject(rejectsById, item, "Broker CTA content is missing affiliate token.");
  }

  if (affiliateTokens.some((token) => !validateAffiliateToken(token))) {
    addReject(rejectsById, item, "Affiliate token shape is invalid or contains a URL.");
  }
}

const rejectedItems = [...rejectsById.values()];
const acceptedItems =
  rejectedItems.length === 0
    ? rawItems
    : rawItems.filter((item) => !rejectsById.has(item.id));
const report = {
  generatedAt: new Date().toISOString(),
  inputPath,
  dryRun,
  maxSize,
  totalItems: rawItems.length,
  acceptedCount: acceptedItems.length,
  rejectedCount: rejectedItems.length,
  rejectedItems,
  importBehavior: dryRun
    ? "Dry run only. No database writes were attempted."
    : "Draft import requested, but this safety script does not publish content.",
};

mkdirSync(dirname(rejectReportPath), { recursive: true });
writeFileSync(rejectReportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Validated ${rawItems.length} items from ${inputPath}.`);
console.log(`Accepted: ${acceptedItems.length}`);
console.log(`Rejected: ${rejectedItems.length}`);
console.log(`Dry run: ${dryRun ? "yes" : "no"}`);
console.log(`Reject report: ${rejectReportPath}`);

if (rejectedItems.length > 0) {
  process.exitCode = 1;
}
