import {
  AffiliateLinkStatus,
  ContentStatus,
  ContentType,
  InternalLinkSuggestionStatus,
  PrismaClient,
} from "@prisma/client";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

for (const envFile of [".env.local", ".env"]) {
  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }
}

const prisma = new PrismaClient();

const expectedPublished = [
  "/global/articles/forex-trading-basics/",
  "/global/articles/pips-lots-margin-leverage/",
  "/global/guides/how-to-open-a-forex-trading-account/",
  "/global/articles/forex-risk-management-checklist/",
  "/global/guides/how-to-verify-a-forex-broker/",
  "/global/broker-reviews/exness-review/",
  "/global/broker-reviews/samplefx-review/",
  "/global/best-brokers/best-forex-brokers-for-beginners/",
  "/global/articles/forex-trading-faq/",
  "/vn/articles/forex-la-gi/",
  "/vn/guides/cach-mo-tai-khoan-forex/",
  "/vn/broker-reviews/exness-review-vietnam/",
  "/vn/best-brokers/san-forex-uy-tin-cho-nguoi-moi/",
  "/vn/articles/cau-hoi-thuong-gap-ve-forex/",
  "/vn/articles/pip-lot-va-don-bay-trong-forex/",
  "/global/best-brokers/best-forex-brokers-low-minimum-deposit/",
];

const requiredTypes = [
  ContentType.ARTICLE,
  ContentType.GUIDE,
  ContentType.BROKER_REVIEW,
  ContentType.BEST_BROKER_LIST,
];

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function hasRawUrl(markdown) {
  return /https?:\/\//i.test(markdown);
}

function getMarkdown(body) {
  if (body && typeof body === "object" && !Array.isArray(body) && typeof body.markdown === "string") {
    return body.markdown;
  }

  return "";
}

async function main() {
  const content = await prisma.contentItem.findMany({
    where: {
      canonicalPath: { in: expectedPublished },
    },
    include: {
      market: true,
      seoMetadata: true,
      template: true,
      brokers: true,
    },
    orderBy: { canonicalPath: "asc" },
  });

  const paths = new Set(content.map((item) => item.canonicalPath));
  const missingPaths = expectedPublished.filter((path) => !paths.has(path));

  assert(missingPaths.length === 0, `Missing pilot content paths: ${missingPaths.join(", ")}`);
  assert(content.length >= 10 && content.length <= 20, `Pilot content count should be 10-20, got ${content.length}`);
  assert(new Set(content.map((item) => item.market.code)).has("global"), "Pilot content must include global market.");
  assert(new Set(content.map((item) => item.market.code)).has("vn"), "Pilot content must include vn market.");

  for (const type of requiredTypes) {
    assert(content.some((item) => item.contentType === type), `Pilot content missing ${type}.`);
  }

  for (const item of content) {
    assert(item.status === ContentStatus.PUBLISHED, `${item.canonicalPath} is not published.`);
    assert(item.canonicalPath.startsWith(`/${item.market.code}/`), `${item.canonicalPath} has wrong market prefix.`);
    assert(item.canonicalPath.endsWith("/"), `${item.canonicalPath} is missing trailing slash.`);
    assert(item.seoMetadata, `${item.canonicalPath} is missing SEO metadata.`);
    assert(item.seoMetadata?.canonicalPath === item.canonicalPath, `${item.canonicalPath} has mismatched SEO canonical.`);
    assert(item.seoMetadata?.title, `${item.canonicalPath} is missing SEO title.`);
    assert(item.seoMetadata?.description, `${item.canonicalPath} is missing meta description.`);
    assert(!hasRawUrl(getMarkdown(item.body)), `${item.canonicalPath} contains a raw URL in markdown body.`);
  }

  const draft = await prisma.contentItem.findUnique({
    where: { canonicalPath: "/global/articles/ai-import-pilot-draft/" },
  });
  assert(draft?.status === ContentStatus.DRAFT, "AI import pilot draft should exist and remain draft.");

  const brokerReviews = content.filter((item) => item.contentType === ContentType.BROKER_REVIEW);
  assert(brokerReviews.every((item) => item.brokers.length > 0), "Every broker review should attach at least one broker.");

  const affiliateLinks = await prisma.affiliateLink.findMany({
    where: {
      status: AffiliateLinkStatus.ACTIVE,
      broker: { status: "ACTIVE" },
      market: { code: { in: ["global", "vn"] }, status: "ACTIVE" },
      campaign: { in: ["review_top_cta", "review_middle_cta", "review_bottom_cta"] },
    },
    include: {
      broker: true,
      market: true,
    },
  });
  assert(affiliateLinks.length >= 6, "Expected active affiliate CTA links for pilot brokers and markets.");
  assert(
    affiliateLinks.every((link) => link.sponsored && link.nofollow),
    "Affiliate links should default to sponsored and nofollow.",
  );

  const acceptedInternalLinks = await prisma.internalLinkSuggestion.findMany({
    where: {
      status: InternalLinkSuggestionStatus.ACCEPTED,
      market: { code: { in: ["global", "vn"] } },
    },
    include: {
      market: true,
      sourceContentItem: { include: { market: true } },
      targetContentItem: { include: { market: true } },
    },
  });
  assert(acceptedInternalLinks.length >= 4, "Expected at least four accepted pilot internal links.");
  assert(
    acceptedInternalLinks.every(
      (link) =>
        link.marketId === link.sourceContentItem.marketId &&
        link.marketId === link.targetContentItem.marketId &&
        link.languageCode === link.sourceContentItem.market.languageCode &&
        link.languageCode === link.targetContentItem.market.languageCode,
    ),
    "Accepted internal links must stay within the same market and language.",
  );

  const templates = await prisma.template.findMany({
    where: { key: { in: ["article", "guide", "broker-review", "best-broker-list"] }, isActive: true },
  });
  assert(templates.length === 4, "Expected active article, guide, broker-review, and best-broker-list templates.");

  console.log("Pilot content check passed.");
  console.log(`Published pilot content: ${content.length}`);
  console.log(`Active affiliate links: ${affiliateLinks.length}`);
  console.log(`Accepted internal links: ${acceptedInternalLinks.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
