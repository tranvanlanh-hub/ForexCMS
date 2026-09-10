import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

for (const envFile of [".env.local", ".env"]) {
  if (existsSync(envFile)) loadEnvFile(envFile);
}

const prisma = new PrismaClient();

function getMarkdownBody(body) {
  return body && typeof body === "object" && typeof body.markdown === "string"
    ? body.markdown
    : "";
}

function countH1(markdown) {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => /^#\s+/.test(line.trim())).length;
}

function hasFaq(markdown, body) {
  if (/^##\s+(faq|faqs|frequently asked questions)\s*$/im.test(markdown)) {
    return true;
  }

  return Boolean(
    body &&
      typeof body === "object" &&
      Array.isArray(body.blocks) &&
      body.blocks.some((block) => block?.type === "faq" && block.items?.length),
  );
}

function expectedCanonical(item) {
  const typeSegments = {
    ARTICLE: "articles",
    GUIDE: "guides",
    BROKER_REVIEW: "broker-reviews",
    BROKER_COMPARISON: "compare",
    BEST_BROKER_LIST: "best-brokers",
    COUNTRY_HUB: "country",
    TOPIC_HUB: "topics",
    GLOSSARY_TERM: "glossary",
    LANDING_PAGE: "landing",
  };

  return `/${item.market.code}/${typeSegments[item.contentType]}/${item.slug}/`;
}

async function main() {
  const items = await prisma.contentItem.findMany({
    where: { status: "PUBLISHED", market: { status: "ACTIVE" } },
    include: {
      internalLinkTargetSuggestions: {
        where: { status: "ACCEPTED" },
        select: { id: true },
      },
      market: true,
      seoMetadata: true,
      template: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });
  const issues = [];

  for (const item of items) {
    const markdown = getMarkdownBody(item.body);
    const expectedPath = expectedCanonical(item);

    if (!item.seoMetadata?.title?.trim() || !item.seoMetadata?.description?.trim()) {
      issues.push([item.canonicalPath, "missing_title_meta"]);
    }

    if (countH1(markdown) > 1) issues.push([item.canonicalPath, "multiple_h1"]);
    if (!hasFaq(markdown, item.body)) issues.push([item.canonicalPath, "missing_faq"]);

    if (item.canonicalPath !== expectedPath || item.seoMetadata?.canonicalPath !== expectedPath) {
      issues.push([item.canonicalPath, `canonical_mismatch expected ${expectedPath}`]);
    }

    if (item.internalLinkTargetSuggestions.length === 0) {
      issues.push([item.canonicalPath, "orphan_content"]);
    }

    if (item.seoMetadata?.robotsIndex === "NOINDEX") {
      issues.push([item.canonicalPath, "sitemap_exclusion"]);
    }
  }

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        scannedContentCount: items.length,
        issueCount: issues.length,
        issues: issues.map(([path, issue]) => ({ path, issue })),
      },
      null,
      2,
    ),
  );
  // An audit with unresolved issues must not look like a passing launch gate.
  if (issues.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
