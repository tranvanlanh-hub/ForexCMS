import { readFileSync } from "node:fs";

const defaultInput = "data/ai-content/pilot-50-drafts.json";
const inputPath = process.argv[2] || defaultInput;

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

const requiredSchemaByType = {
  ARTICLE: ["Article", "BreadcrumbList", "FAQPage"],
  GUIDE: ["Article", "BreadcrumbList", "FAQPage"],
  BROKER_REVIEW: ["Review", "Article", "BreadcrumbList", "FAQPage"],
  BEST_BROKER_LIST: ["ItemList", "Article", "BreadcrumbList", "FAQPage"],
  COUNTRY_HUB: ["CollectionPage", "BreadcrumbList", "FAQPage"],
};

function canonicalPath(item) {
  return `/${item.market}/${contentTypeSegments[item.contentType]}/${item.slug}/`;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasRawUrl(value) {
  return typeof value === "string" && /https?:\/\//i.test(value);
}

function addIssue(issues, severity, item, message) {
  issues.push({
    severity,
    id: item?.id || "batch",
    canonicalPath: item?.canonicalPath || "",
    message,
  });
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

const items = JSON.parse(readFileSync(inputPath, "utf8"));
const issues = [];
const slugScopes = new Map();
const canonicalPaths = new Map();
const incomingLinks = new Map();
const knownPaths = new Set(items.map((item) => item.canonicalPath));

if (!Array.isArray(items)) {
  throw new Error("Audit input must be a JSON array.");
}

for (const item of items) {
  const scope = `${item.market}:${item.contentType}:${item.slug}`;
  const path = canonicalPath(item);

  if (slugScopes.has(scope)) {
    addIssue(issues, "error", item, `Duplicate slug scope also used by ${slugScopes.get(scope)}.`);
  }
  slugScopes.set(scope, item.id);

  if (canonicalPaths.has(item.canonicalPath)) {
    addIssue(issues, "error", item, `Duplicate canonical path also used by ${canonicalPaths.get(item.canonicalPath)}.`);
  }
  canonicalPaths.set(item.canonicalPath, item.id);

  if (!hasText(item.seoTitle)) addIssue(issues, "error", item, "Missing SEO title.");
  if (!hasText(item.metaDescription)) addIssue(issues, "error", item, "Missing meta description.");
  if (!hasText(item.targetKeyword)) addIssue(issues, "error", item, "Missing target keyword.");
  if (!hasText(item.market)) addIssue(issues, "error", item, "Missing market.");
  if (!hasText(item.language)) addIssue(issues, "error", item, "Missing language.");
  if (!contentTypeSegments[item.contentType]) addIssue(issues, "error", item, `Unsupported content type ${item.contentType}.`);
  if (item.template !== templateByType[item.contentType]) addIssue(issues, "error", item, "Template does not match content type.");
  if (item.status !== "DRAFT") addIssue(issues, "error", item, "Pilot/import content must remain DRAFT.");
  if (item.canonicalPath !== path) addIssue(issues, "error", item, `Canonical path should be ${path}.`);
  if (hasRawUrl(item.body)) addIssue(issues, "error", item, "Body contains a raw URL.");

  const faq = Array.isArray(item.faq) ? item.faq : [];
  if (faq.length === 0 || !/## FAQ/i.test(item.body || "")) {
    addIssue(issues, "error", item, "FAQ data or FAQ section is missing.");
  }

  const schemaTypes = Array.isArray(item.schemaTypes) ? item.schemaTypes : [];
  for (const schemaType of requiredSchemaByType[item.contentType] || []) {
    if (!schemaTypes.includes(schemaType)) {
      addIssue(issues, "error", item, `Missing schema type ${schemaType}.`);
    }
  }

  const targets = Array.isArray(item.internalLinkTargets) ? item.internalLinkTargets : [];
  if (targets.length === 0) {
    addIssue(issues, "warning", item, "No internal link targets assigned.");
  }

  for (const target of targets) {
    if (!knownPaths.has(target)) {
      addIssue(issues, "error", item, `Internal link target is not in this pilot batch: ${target}.`);
    }
    incomingLinks.set(target, (incomingLinks.get(target) || 0) + 1);
  }

  const affiliateTokens = Array.isArray(item.affiliateTokens) ? item.affiliateTokens : [];
  const brokerMentions = Array.isArray(item.brokerMentions) ? item.brokerMentions : [];

  if (["BROKER_REVIEW", "BEST_BROKER_LIST"].includes(item.contentType) && affiliateTokens.length === 0) {
    addIssue(issues, "error", item, "Broker CTA content is missing affiliate token.");
  }

  if (affiliateTokens.some((token) => !validateAffiliateToken(token))) {
    addIssue(issues, "error", item, "Affiliate token shape is invalid or contains a URL.");
  }

  if (item.contentType === "BROKER_REVIEW" && brokerMentions.length === 0) {
    addIssue(issues, "error", item, "BrokerReview is missing brokerMentions.");
  }
}

for (const item of items) {
  if (!incomingLinks.has(item.canonicalPath) && !Array.isArray(item.internalLinkTargets)) {
    addIssue(issues, "warning", item, "Potential orphan draft.");
  }
}

const errors = issues.filter((issue) => issue.severity === "error");
const warnings = issues.filter((issue) => issue.severity === "warning");

if (issues.length > 0) {
  for (const issue of issues) {
    console.log(`[${issue.severity.toUpperCase()}] ${issue.id} ${issue.canonicalPath} - ${issue.message}`);
  }
}

console.log(`Audited ${items.length} items from ${inputPath}.`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length > 0) {
  process.exit(1);
}
