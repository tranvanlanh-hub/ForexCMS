import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const outputPath = join("data", "ai-content", "pilot-50-drafts.json");

const contentTypeSegments = {
  ARTICLE: "articles",
  GUIDE: "guides",
  BROKER_REVIEW: "broker-reviews",
  BEST_BROKER_LIST: "best-brokers",
  COUNTRY_HUB: "country",
};

const markets = [
  { code: "global", language: "en", label: "Global" },
  { code: "us", language: "en", label: "United States" },
  { code: "uk", language: "en", label: "United Kingdom" },
  { code: "au", language: "en", label: "Australia" },
  { code: "vn", language: "vi", label: "Vietnam" },
];

const clusters = [
  {
    slug: "forex-basics",
    name: "Forex basics",
    topics: [
      ["ARTICLE", "forex-trading-basics", "Forex trading basics", "forex trading basics"],
      ["ARTICLE", "pips-lots-margin-leverage", "Pips lots margin and leverage", "pips lots margin leverage"],
      ["GUIDE", "how-to-read-forex-quotes", "How to read forex quotes", "how to read forex quotes"],
      ["ARTICLE", "forex-risk-management-checklist", "Forex risk management checklist", "forex risk management"],
    ],
  },
  {
    slug: "account-opening",
    name: "Account opening",
    topics: [
      ["GUIDE", "how-to-open-a-forex-account", "How to open a forex account", "how to open a forex account"],
      ["GUIDE", "forex-kyc-documents-checklist", "Forex KYC documents checklist", "forex kyc documents"],
      ["ARTICLE", "demo-vs-live-forex-account", "Demo vs live forex account", "demo vs live forex account"],
    ],
  },
  {
    slug: "broker-research",
    name: "Broker research",
    topics: [
      ["GUIDE", "how-to-verify-a-forex-broker", "How to verify a forex broker", "verify forex broker"],
      ["ARTICLE", "forex-broker-fees-explained", "Forex broker fees explained", "forex broker fees"],
      ["BEST_BROKER_LIST", "best-forex-brokers-for-beginners", "Best forex brokers for beginners", "best forex brokers for beginners"],
    ],
  },
  {
    slug: "broker-reviews",
    name: "Broker reviews",
    topics: [
      ["BROKER_REVIEW", "exness-review", "Exness review", "exness review", ["exness"]],
      ["BROKER_REVIEW", "samplefx-review", "SampleFX review", "samplefx review", ["samplefx"]],
      ["BROKER_REVIEW", "example-markets-review", "Example Markets review", "example markets review", ["example-markets"]],
    ],
  },
];

function slugWithMarket(baseSlug, market) {
  return market.code === "global" ? baseSlug : `${baseSlug}-${market.code}`;
}

function canonicalPath(market, contentType, slug) {
  return `/${market.code}/${contentTypeSegments[contentType]}/${slug}/`;
}

function templateFor(contentType) {
  return {
    ARTICLE: "article",
    GUIDE: "guide",
    BROKER_REVIEW: "broker-review",
    BEST_BROKER_LIST: "best-broker-list",
    COUNTRY_HUB: "country-hub",
  }[contentType];
}

function schemaTypesFor(contentType) {
  return {
    ARTICLE: ["Article", "BreadcrumbList", "FAQPage"],
    GUIDE: ["Article", "BreadcrumbList", "FAQPage"],
    BROKER_REVIEW: ["Review", "Article", "BreadcrumbList", "FAQPage"],
    BEST_BROKER_LIST: ["ItemList", "Article", "BreadcrumbList", "FAQPage"],
    COUNTRY_HUB: ["CollectionPage", "BreadcrumbList", "FAQPage"],
  }[contentType];
}

function affiliateTokensFor(contentType, market, brokers = []) {
  if (!["BROKER_REVIEW", "BEST_BROKER_LIST"].includes(contentType)) return [];

  return (brokers.length ? brokers : ["exness"]).map((broker) => ({
    broker,
    market: market.code,
    language: market.language,
    campaign: "review_top_cta",
  }));
}

function bodyFor({ title, market, keyword, cluster, contentType, brokers }) {
  const brokerLine = brokers?.length
    ? `This draft references ${brokers.join(", ")} through CMS broker slugs and centralized CTA tokens.`
    : "This draft does not contain affiliate destination URLs.";
  const prosCons = contentType === "BROKER_REVIEW"
    ? "\n## Pros and Cons\n\n### Pros\n\n- Clear account research structure.\n- Centralized CTA handling.\n\n### Cons\n\n- Broker facts must be verified through sourced BrokerFact rows before publishing.\n"
    : "";

  return `# ${title}

This draft targets ${keyword} for the ${market.label} market. It belongs to the ${cluster.name} topic cluster and should remain draft until editorial and compliance review are complete.

## Key Takeaways

- Match the article to ${market.code} market intent.
- Keep internal links inside the same market and language.
- Use Broker and Affiliate Manager tokens instead of destination URLs.

${prosCons}
## Main checklist

Explain the search intent, practical next steps, and risk controls in plain language. ${brokerLine}

## Internal links to include

Link to the assigned targets naturally in the body after import review.

## FAQ

### What should be checked before publishing?

Check SEO metadata, canonical path, FAQ schema, affiliate tokens, and internal links.

### Can this draft include affiliate URLs?

No. Affiliate destinations must stay in Affiliate Manager records.`;
}

function makeDraft({ market, cluster, topic, index, clusterPillarPath, fallbackTargetPath }) {
  const [contentType, baseSlug, baseTitle, keyword, brokers = []] = topic;
  const slug = slugWithMarket(baseSlug, market);
  const title = market.code === "global" ? baseTitle : `${baseTitle} in ${market.label}`;
  const path = canonicalPath(market, contentType, slug);
  const target =
    clusterPillarPath && clusterPillarPath !== path
      ? [clusterPillarPath]
      : fallbackTargetPath
        ? [fallbackTargetPath]
        : [];

  return {
    id: `pilot-${String(index).padStart(2, "0")}`,
    title,
    slug,
    market: market.code,
    language: market.language,
    contentType,
    template: templateFor(contentType),
    status: "DRAFT",
    targetKeyword: market.code === "global" ? keyword : `${keyword} ${market.label}`,
    seoTitle: `${title}: Draft SEO Brief`,
    metaDescription: `Draft brief for ${keyword} in ${market.label}, covering SEO, internal links, FAQ, and affiliate validation.`,
    canonicalPath: path,
    topicCluster: cluster.slug,
    schemaTypes: schemaTypesFor(contentType),
    faq: [
      {
        question: "What should be checked before publishing?",
        answer: "SEO metadata, canonical path, schema, affiliate tokens, and internal links should all pass validation.",
      },
      {
        question: "Can this draft include affiliate URLs?",
        answer: "No. It may include broker and campaign tokens only.",
      },
    ],
    internalLinkTargets: target,
    affiliateTokens: affiliateTokensFor(contentType, market, brokers),
    brokerMentions: brokers,
    translationGroupKey: baseSlug,
    body: bodyFor({ title, market, keyword, cluster, contentType, brokers }),
  };
}

const drafts = [];
let index = 1;

for (const market of markets) {
  let marketCount = 0;

  for (const cluster of clusters) {
    const pillarTopic = cluster.topics[0];
    const pillarSlug = slugWithMarket(pillarTopic[1], market);
    const pillarPath = canonicalPath(market, pillarTopic[0], pillarSlug);
    const fallbackTopic = cluster.topics[1] || pillarTopic;
    const fallbackSlug = slugWithMarket(fallbackTopic[1], market);
    const fallbackPath = canonicalPath(market, fallbackTopic[0], fallbackSlug);

    for (const topic of cluster.topics) {
      if (marketCount >= 10) break;

      drafts.push(makeDraft({
        market,
        cluster,
        topic,
        index,
        clusterPillarPath: pillarPath,
        fallbackTargetPath: fallbackPath,
      }));
      index += 1;
      marketCount += 1;
    }

    if (marketCount >= 10) break;
  }
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(drafts, null, 2)}\n`);

console.log(`Generated ${drafts.length} draft pilot items at ${outputPath}.`);
