import {
  AffiliateLinkStatus,
  AnchorTextStatus,
  BrokerFactCategory,
  BrokerStatus,
  ContentStatus,
  ContentType,
  InternalLinkRuleMode,
  InternalLinkRuleStatus,
  InternalLinkSuggestionStatus,
  PrismaClient,
  RobotsIndex,
  TemplateKind,
  TopicClusterStatus,
} from "@prisma/client";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

for (const envFile of [".env.local", ".env"]) {
  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }
}

const prisma = new PrismaClient();
const demoAffiliateDestinationUrl = process.env.DEMO_AFFILIATE_DESTINATION_URL?.trim();

const supportedMarkets = [
  { code: "global", name: "Global", languageCode: "en", locale: "en", countryCode: null, isGlobal: true },
  { code: "us", name: "United States", languageCode: "en", locale: "en-US", countryCode: "US", isGlobal: false },
  { code: "uk", name: "United Kingdom", languageCode: "en", locale: "en-GB", countryCode: "GB", isGlobal: false },
  { code: "au", name: "Australia", languageCode: "en", locale: "en-AU", countryCode: "AU", isGlobal: false },
  { code: "vn", name: "Vietnam", languageCode: "vi", locale: "vi-VN", countryCode: "VN", isGlobal: false },
  { code: "th", name: "Thailand", languageCode: "th", locale: "th-TH", countryCode: "TH", isGlobal: false },
];

const commonArticleBlocks = ["intro", "summary", "table_of_contents", "body", "faq", "cta_slot"];
const reviewBlocks = ["intro", "summary", "table_of_contents", "pros_cons", "body", "faq", "cta_slot"];

const templateSeeds = [
  {
    key: "article",
    name: "Article",
    kind: TemplateKind.ARTICLE,
    description: "Editorial article template with intro, takeaways, TOC, FAQ, and optional CTA slots.",
    requiredBlocks: ["intro", "body"],
    allowedBlocks: commonArticleBlocks,
    schemaTypes: ["Article", "BreadcrumbList", "FAQPage"],
    ctaSlots: [],
    internalLinkSlots: ["contextual_body", "related_articles"],
  },
  {
    key: "guide",
    name: "Guide",
    kind: TemplateKind.GUIDE,
    description: "Step-by-step guide template for account opening and broker due diligence.",
    requiredBlocks: ["intro", "body"],
    allowedBlocks: commonArticleBlocks,
    schemaTypes: ["Article", "BreadcrumbList", "FAQPage"],
    ctaSlots: ["bottom"],
    internalLinkSlots: ["contextual_body", "related_guides"],
  },
  {
    key: "broker-review",
    name: "Broker Review",
    kind: TemplateKind.BROKER_REVIEW,
    description: "Broker review template with verdict sections, pros/cons, sourced facts, FAQ, and CTA slots.",
    requiredBlocks: ["intro", "pros_cons", "body"],
    allowedBlocks: reviewBlocks,
    schemaTypes: ["Review", "Article", "BreadcrumbList", "FAQPage"],
    ctaSlots: ["top", "middle", "bottom"],
    internalLinkSlots: ["broker_comparison", "best_broker_list", "related_guides"],
  },
  {
    key: "broker-comparison",
    name: "Broker Comparison",
    kind: TemplateKind.BROKER_COMPARISON,
    description: "Broker comparison template for sourced broker fact tables and controlled CTA slots.",
    requiredBlocks: ["intro", "body"],
    allowedBlocks: commonArticleBlocks,
    schemaTypes: ["ItemList", "Article", "BreadcrumbList", "FAQPage"],
    ctaSlots: ["top", "bottom"],
    internalLinkSlots: ["broker_review", "best_broker_list", "related_guides"],
  },
  {
    key: "best-broker-list",
    name: "Best Broker List",
    kind: TemplateKind.BEST_BROKER_LIST,
    description: "Best broker list template for market-specific roundups with controlled CTA slots.",
    requiredBlocks: ["intro", "body"],
    allowedBlocks: commonArticleBlocks,
    schemaTypes: ["ItemList", "Article", "BreadcrumbList", "FAQPage"],
    ctaSlots: ["top", "bottom"],
    internalLinkSlots: ["broker_review", "broker_comparison", "related_guides"],
  },
];

function markdownBody(markdown) {
  return {
    format: "markdown",
    markdown,
  };
}

function canonicalPath(marketCode, contentType, slug) {
  const segments = {
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

  return `/${marketCode}/${segments[contentType]}/${slug}/`;
}

async function seedMarkets() {
  const rows = await Promise.all(
    supportedMarkets.map((market) =>
      prisma.market.upsert({
        where: { code: market.code },
        update: { ...market, status: "ACTIVE" },
        create: { ...market, status: "ACTIVE" },
      }),
    ),
  );

  return Object.fromEntries(rows.map((market) => [market.code, market]));
}

async function seedTemplates() {
  const rows = await Promise.all(
    templateSeeds.map((template) =>
      prisma.template.upsert({
        where: { key: template.key },
        update: { ...template, isActive: true },
        create: { ...template, isActive: true },
      }),
    ),
  );

  return Object.fromEntries(rows.map((template) => [template.key, template]));
}

async function seedBroker(slug, data) {
  return prisma.broker.upsert({
    where: { slug },
    update: {
      name: data.name,
      status: BrokerStatus.ACTIVE,
      logoUrl: data.logoUrl,
      description: data.description,
      websiteUrl: data.websiteUrl,
      legalName: data.legalName,
    },
    create: {
      slug,
      name: data.name,
      status: BrokerStatus.ACTIVE,
      logoUrl: data.logoUrl,
      description: data.description,
      websiteUrl: data.websiteUrl,
      legalName: data.legalName,
    },
  });
}

async function seedAffiliateLinks(markets, brokers) {
  if (!demoAffiliateDestinationUrl) {
    return;
  }

  const campaigns = ["review_top_cta", "review_middle_cta", "review_bottom_cta"];
  const brokerRows = [brokers.exness, brokers.samplefx, brokers["example-markets"]];
  const marketRows = [markets.global, markets.vn];

  for (const broker of brokerRows) {
    for (const market of marketRows) {
      for (let index = 0; index < campaigns.length; index += 1) {
        const campaign = campaigns[index];
        const existing = await prisma.affiliateLink.findFirst({
          where: {
            brokerId: broker.id,
            marketId: market.id,
            languageCode: market.languageCode,
            campaign,
            priority: 10 + index,
          },
        });

        const data = {
          brokerId: broker.id,
          marketId: market.id,
          languageCode: market.languageCode,
          campaign,
          destinationUrl: demoAffiliateDestinationUrl,
          status: AffiliateLinkStatus.ACTIVE,
          priority: 10 + index,
          sponsored: true,
          nofollow: true,
        };

        if (existing) {
          await prisma.affiliateLink.update({ where: { id: existing.id }, data });
        } else {
          await prisma.affiliateLink.create({ data });
        }
      }
    }
  }
}

async function seedBrokerFacts(markets, brokers) {
  await prisma.brokerFact.deleteMany({
    where: { brokerId: { in: Object.values(brokers).map((broker) => broker.id) } },
  });

  await prisma.brokerFact.createMany({
    data: [
      {
        brokerId: brokers.exness.id,
        category: BrokerFactCategory.MINIMUM_DEPOSIT,
        label: "Minimum deposit",
        value: "Varies by payment method and account type",
        sourceName: "Exness Help Center demo source",
        sourceUrl: "https://example.com/exness/minimum-deposit",
        displayOrder: 10,
        isPrimary: true,
      },
      {
        brokerId: brokers.exness.id,
        category: BrokerFactCategory.PLATFORM,
        label: "Trading platforms",
        value: "MetaTrader 4, MetaTrader 5, web and mobile trading",
        sourceName: "Exness platform demo source",
        sourceUrl: "https://example.com/exness/platforms",
        displayOrder: 20,
      },
      {
        brokerId: brokers.exness.id,
        marketId: markets.vn.id,
        category: BrokerFactCategory.SUPPORT_LANGUAGE,
        label: "Vietnamese support",
        value: "Vietnamese language support available in selected channels",
        sourceName: "Exness Vietnam demo support source",
        sourceUrl: "https://example.com/exness/vn-support",
        displayOrder: 30,
      },
      {
        brokerId: brokers.samplefx.id,
        category: BrokerFactCategory.MINIMUM_DEPOSIT,
        label: "Minimum deposit",
        value: "100",
        unit: "USD",
        sourceName: "SampleFX demo disclosure",
        sourceUrl: "https://example.com/samplefx/deposits",
        displayOrder: 10,
        isPrimary: true,
      },
      {
        brokerId: brokers.samplefx.id,
        category: BrokerFactCategory.SPREAD,
        label: "Typical spread",
        value: "From 1.0 pip on major pairs",
        sourceName: "SampleFX demo trading conditions",
        sourceUrl: "https://example.com/samplefx/spreads",
        displayOrder: 20,
      },
      {
        brokerId: brokers.samplefx.id,
        category: BrokerFactCategory.PLATFORM,
        label: "Platform",
        value: "Web trader and mobile app",
        sourceName: "SampleFX demo platform page",
        sourceUrl: "https://example.com/samplefx/platforms",
        displayOrder: 30,
      },
      {
        brokerId: brokers["example-markets"].id,
        category: BrokerFactCategory.MINIMUM_DEPOSIT,
        label: "Minimum deposit",
        value: "250",
        unit: "USD",
        sourceName: "Example Markets demo disclosure",
        sourceUrl: "https://example.com/example-markets/deposits",
        displayOrder: 10,
        isPrimary: true,
      },
      {
        brokerId: brokers["example-markets"].id,
        category: BrokerFactCategory.REGULATION_LICENSE,
        label: "Regulatory profile",
        value: "Demo multi-entity broker profile",
        sourceName: "Example Markets demo legal page",
        sourceUrl: "https://example.com/example-markets/legal",
        displayOrder: 20,
      },
      {
        brokerId: brokers["example-markets"].id,
        category: BrokerFactCategory.PAYMENT_METHOD,
        label: "Funding methods",
        value: "Bank transfer, card, and selected e-wallets",
        sourceName: "Example Markets demo funding page",
        sourceUrl: "https://example.com/example-markets/funding",
        displayOrder: 30,
      },
    ],
  });
}

async function upsertTopicCluster({ market, slug, name, description }) {
  return prisma.topicCluster.upsert({
    where: {
      marketId_languageCode_slug: {
        marketId: market.id,
        languageCode: market.languageCode,
        slug,
      },
    },
    update: { name, description, status: TopicClusterStatus.ACTIVE, priority: 20 },
    create: {
      marketId: market.id,
      languageCode: market.languageCode,
      slug,
      name,
      description,
      status: TopicClusterStatus.ACTIVE,
      priority: 20,
    },
  });
}

async function upsertTopic({ market, cluster, slug, name }) {
  return prisma.topic.upsert({
    where: { marketId_slug: { marketId: market.id, slug } },
    update: { name, topicClusterId: cluster.id },
    create: {
      marketId: market.id,
      topicClusterId: cluster.id,
      slug,
      name,
    },
  });
}

async function upsertTranslationGroup(key, name) {
  return prisma.contentTranslationGroup.upsert({
    where: { key },
    update: { name },
    create: { key, name },
  });
}

async function upsertContent(seed) {
  const path = canonicalPath(seed.market.code, seed.contentType, seed.slug);
  const body = markdownBody(seed.body);
  const publishedAt = seed.status === ContentStatus.PUBLISHED ? new Date("2026-09-09T12:00:00.000Z") : null;
  const brokerConnections = seed.brokers?.map((broker) => ({ id: broker.id })) ?? [];

  const item = await prisma.contentItem.upsert({
    where: { canonicalPath: path },
    update: {
      marketId: seed.market.id,
      templateId: seed.template.id,
      translationGroupId: seed.translationGroupId ?? null,
      primaryTopicId: seed.topic?.id ?? null,
      title: seed.title,
      slug: seed.slug,
      contentType: seed.contentType,
      status: seed.status,
      summary: seed.summary,
      body,
      authorName: seed.authorName ?? "ForexCMS Editorial",
      reviewerName: seed.reviewerName ?? "ForexCMS Review Desk",
      publishedAt,
      brokers: { set: brokerConnections },
    },
    create: {
      marketId: seed.market.id,
      templateId: seed.template.id,
      translationGroupId: seed.translationGroupId ?? null,
      primaryTopicId: seed.topic?.id ?? null,
      title: seed.title,
      slug: seed.slug,
      contentType: seed.contentType,
      status: seed.status,
      summary: seed.summary,
      body,
      canonicalPath: path,
      authorName: seed.authorName ?? "ForexCMS Editorial",
      reviewerName: seed.reviewerName ?? "ForexCMS Review Desk",
      publishedAt,
      brokers: { connect: brokerConnections },
    },
  });

  await prisma.seoMetadata.upsert({
    where: { contentItemId: item.id },
    update: {
      marketId: seed.market.id,
      title: seed.seoTitle,
      description: seed.metaDescription,
      canonicalPath: path,
      robotsIndex: RobotsIndex.INDEX,
      robotsFollow: true,
    },
    create: {
      marketId: seed.market.id,
      contentItemId: item.id,
      title: seed.seoTitle,
      description: seed.metaDescription,
      canonicalPath: path,
      robotsIndex: RobotsIndex.INDEX,
      robotsFollow: true,
    },
  });

  return item;
}

async function seedInternalLinks(markets, clusters, contentBySlug) {
  const globalRule = await prisma.internalLinkRule.upsert({
    where: { id: "seed-global-pilot-forex-education-rule" },
    update: {
      marketId: markets.global.id,
      languageCode: "en",
      topicClusterId: clusters.globalEducation.id,
      sourceContentType: ContentType.ARTICLE,
      targetContentType: ContentType.GUIDE,
      status: InternalLinkRuleStatus.ACTIVE,
      mode: InternalLinkRuleMode.SUGGEST_ONLY,
      maxLinksPerContent: 6,
      minWordsBetweenLinks: 120,
      priority: 20,
    },
    create: {
      id: "seed-global-pilot-forex-education-rule",
      marketId: markets.global.id,
      languageCode: "en",
      topicClusterId: clusters.globalEducation.id,
      name: "Global pilot education to guide suggestions",
      sourceContentType: ContentType.ARTICLE,
      targetContentType: ContentType.GUIDE,
      status: InternalLinkRuleStatus.ACTIVE,
      mode: InternalLinkRuleMode.SUGGEST_ONLY,
      maxLinksPerContent: 6,
      minWordsBetweenLinks: 120,
      priority: 20,
    },
  });

  const vnRule = await prisma.internalLinkRule.upsert({
    where: { id: "seed-vn-pilot-forex-education-rule" },
    update: {
      marketId: markets.vn.id,
      languageCode: "vi",
      topicClusterId: clusters.vnEducation.id,
      sourceContentType: ContentType.ARTICLE,
      targetContentType: ContentType.GUIDE,
      status: InternalLinkRuleStatus.ACTIVE,
      mode: InternalLinkRuleMode.SUGGEST_ONLY,
      maxLinksPerContent: 6,
      minWordsBetweenLinks: 120,
      priority: 20,
    },
    create: {
      id: "seed-vn-pilot-forex-education-rule",
      marketId: markets.vn.id,
      languageCode: "vi",
      topicClusterId: clusters.vnEducation.id,
      name: "Vietnam pilot education to guide suggestions",
      sourceContentType: ContentType.ARTICLE,
      targetContentType: ContentType.GUIDE,
      status: InternalLinkRuleStatus.ACTIVE,
      mode: InternalLinkRuleMode.SUGGEST_ONLY,
      maxLinksPerContent: 6,
      minWordsBetweenLinks: 120,
      priority: 20,
    },
  });

  const anchorSeeds = [
    {
      market: markets.global,
      cluster: clusters.globalEducation,
      text: "open a forex account",
      source: contentBySlug["forex-trading-basics"],
      target: contentBySlug["how-to-open-a-forex-trading-account"],
      rule: globalRule,
    },
    {
      market: markets.global,
      cluster: clusters.globalBrokers,
      text: "best forex brokers for beginners",
      source: contentBySlug["forex-trading-faq"],
      target: contentBySlug["best-forex-brokers-for-beginners"],
      rule: globalRule,
    },
    {
      market: markets.vn,
      cluster: clusters.vnEducation,
      text: "mo tai khoan forex",
      source: contentBySlug["forex-la-gi"],
      target: contentBySlug["cach-mo-tai-khoan-forex"],
      rule: vnRule,
    },
    {
      market: markets.vn,
      cluster: clusters.vnBrokers,
      text: "san forex uy tin",
      source: contentBySlug["cau-hoi-thuong-gap-ve-forex"],
      target: contentBySlug["san-forex-uy-tin-cho-nguoi-moi"],
      rule: vnRule,
    },
  ];

  for (const seed of anchorSeeds) {
    const anchor = await prisma.anchorText.upsert({
      where: {
        marketId_languageCode_text_targetContentItemId: {
          marketId: seed.market.id,
          languageCode: seed.market.languageCode,
          text: seed.text,
          targetContentItemId: seed.target.id,
        },
      },
      update: {
        topicClusterId: seed.cluster.id,
        status: AnchorTextStatus.ACTIVE,
        priority: 20,
      },
      create: {
        marketId: seed.market.id,
        languageCode: seed.market.languageCode,
        topicClusterId: seed.cluster.id,
        targetContentItemId: seed.target.id,
        text: seed.text,
        contentTypes: [seed.target.contentType],
        status: AnchorTextStatus.ACTIVE,
        priority: 20,
      },
    });

    await prisma.internalLinkSuggestion.upsert({
      where: {
        sourceContentItemId_targetContentItemId_anchorText: {
          sourceContentItemId: seed.source.id,
          targetContentItemId: seed.target.id,
          anchorText: seed.text,
        },
      },
      update: {
        marketId: seed.market.id,
        languageCode: seed.market.languageCode,
        anchorTextId: anchor.id,
        ruleId: seed.rule.id,
        status: InternalLinkSuggestionStatus.ACCEPTED,
        score: 90,
        reason: "Seeded pilot internal link within the same market and language.",
      },
      create: {
        marketId: seed.market.id,
        sourceContentItemId: seed.source.id,
        targetContentItemId: seed.target.id,
        anchorTextId: anchor.id,
        ruleId: seed.rule.id,
        anchorText: seed.text,
        languageCode: seed.market.languageCode,
        status: InternalLinkSuggestionStatus.ACCEPTED,
        score: 90,
        reason: "Seeded pilot internal link within the same market and language.",
      },
    });
  }
}

async function main() {
  const markets = await seedMarkets();
  const templates = await seedTemplates();

  const brokers = {
    exness: await seedBroker("exness", {
      name: "Exness",
      legalName: "Exness demo broker entity",
      websiteUrl: "https://example.com/exness",
      logoUrl: "https://example.com/media/brokers/exness-logo.png",
      description: "Demo broker profile used to test centralized affiliate CTAs and market-specific reviews.",
    }),
    samplefx: await seedBroker("samplefx", {
      name: "SampleFX",
      legalName: "SampleFX Markets Ltd demo entity",
      websiteUrl: "https://example.com/samplefx",
      logoUrl: "https://example.com/media/brokers/samplefx-logo.png",
      description: "Fictional demo broker used for comparison and best-list testing.",
    }),
    "example-markets": await seedBroker("example-markets", {
      name: "Example Markets",
      legalName: "Example Markets Group demo entity",
      websiteUrl: "https://example.com/example-markets",
      logoUrl: "https://example.com/media/brokers/example-markets-logo.png",
      description: "Fictional demo broker used for sourced fact and affiliate CTA checks.",
    }),
  };

  await seedBrokerFacts(markets, brokers);
  await seedAffiliateLinks(markets, brokers);

  const clusters = {
    globalEducation: await upsertTopicCluster({
      market: markets.global,
      slug: "forex-education",
      name: "Forex Education",
      description: "Core educational pages for global beginner forex readers.",
    }),
    globalBrokers: await upsertTopicCluster({
      market: markets.global,
      slug: "forex-broker-selection",
      name: "Forex Broker Selection",
      description: "Broker review, comparison, and selection pages for global readers.",
    }),
    vnEducation: await upsertTopicCluster({
      market: markets.vn,
      slug: "kien-thuc-forex",
      name: "Kien thuc forex",
      description: "Kien thuc nen tang cho nguoi doc forex tai Viet Nam.",
    }),
    vnBrokers: await upsertTopicCluster({
      market: markets.vn,
      slug: "chon-san-forex",
      name: "Chon san forex",
      description: "Noi dung chon san, review san, va danh sach san cho thi truong Viet Nam.",
    }),
  };

  const topics = {
    globalBasics: await upsertTopic({ market: markets.global, cluster: clusters.globalEducation, slug: "forex-basics", name: "Forex Basics" }),
    globalAccount: await upsertTopic({ market: markets.global, cluster: clusters.globalEducation, slug: "account-opening", name: "Account Opening" }),
    globalBrokers: await upsertTopic({ market: markets.global, cluster: clusters.globalBrokers, slug: "broker-selection", name: "Broker Selection" }),
    vnBasics: await upsertTopic({ market: markets.vn, cluster: clusters.vnEducation, slug: "forex-co-ban", name: "Forex co ban" }),
    vnAccount: await upsertTopic({ market: markets.vn, cluster: clusters.vnEducation, slug: "mo-tai-khoan", name: "Mo tai khoan" }),
    vnBrokers: await upsertTopic({ market: markets.vn, cluster: clusters.vnBrokers, slug: "chon-san", name: "Chon san" }),
  };

  const translationGroups = {
    basics: await upsertTranslationGroup("forex-basics-pilot", "Forex basics pilot"),
    account: await upsertTranslationGroup("open-forex-account-pilot", "Open forex account pilot"),
    faq: await upsertTranslationGroup("forex-faq-pilot", "Forex FAQ pilot"),
    bestBeginners: await upsertTranslationGroup("best-brokers-beginners-pilot", "Best brokers for beginners pilot"),
  };

  const contentSeeds = [
    {
      market: markets.global,
      template: templates.article,
      translationGroupId: translationGroups.basics.id,
      topic: topics.globalBasics,
      title: "Forex Trading Basics",
      slug: "forex-trading-basics",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.PUBLISHED,
      summary: "A practical beginner overview of currency pairs, pip movement, leverage, and risk.",
      seoTitle: "Forex Trading Basics for Beginners",
      metaDescription: "Learn how forex trading works, what currency pairs are, why leverage matters, and how beginners can approach risk.",
      body: `# Forex Trading Basics

Forex trading is the process of exchanging one currency for another. A beginner should first understand currency pairs, bid and ask prices, pip movement, margin, and the role of a regulated broker.

## Key Takeaways

- Currency pairs show the value of one currency against another.
- Leverage can magnify both gains and losses.
- Beginners should learn order types before placing live trades.
- A broker checklist should come before any deposit.

## What is a currency pair?

A currency pair compares two currencies. In EUR/USD, the euro is the base currency and the US dollar is the quote currency. If the pair rises, the base currency is strengthening against the quote currency.

## Why risk management comes first

New traders often focus on entries, but position size and stop placement matter more. A small account can be damaged quickly if every trade risks too much capital.

## Before choosing a broker

Review trading costs, platform stability, deposit methods, withdrawal process, support language, and regulatory profile. If you are ready to practise the process, learn how to open a forex account before funding a live balance.

## FAQ

### Is forex trading suitable for every beginner?

No. Forex can be risky, especially with leverage. Beginners should use education, demo practice, and small position sizes.

### Does this article contain affiliate links?

No. Any broker CTA on the page is resolved through the centralized affiliate manager.`,
    },
    {
      market: markets.global,
      template: templates.article,
      topic: topics.globalBasics,
      title: "Pips, Lots, Margin, and Leverage Explained",
      slug: "pips-lots-margin-leverage",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.PUBLISHED,
      summary: "A plain-English guide to four terms every new forex trader sees immediately.",
      seoTitle: "Pips, Lots, Margin, and Leverage Explained",
      metaDescription: "Understand pips, lots, margin, and leverage before placing your first forex trade.",
      body: `# Pips, Lots, Margin, and Leverage Explained

Forex platforms use a vocabulary that can feel unfamiliar at first. Four terms appear almost everywhere: pips, lots, margin, and leverage.

## Key Takeaways

- A pip is a common way to measure price movement.
- Lot size controls how much currency exposure a trade carries.
- Margin is collateral required to open leveraged trades.
- Leverage should be treated as risk exposure, not free buying power.

## What is a pip?

A pip is a small unit of price movement. Many major pairs quote to five decimals, but traders still use pip language to discuss spread, targets, and stop distance.

## What is a lot?

A lot describes position size. Smaller lots reduce the money value of each pip and can make practice more manageable.

## How margin and leverage connect

Margin is the amount set aside to support a position. Leverage lets a trader control a larger position with less upfront capital, but losses scale with the full position size.

## FAQ

### Should beginners use high leverage?

Usually no. Lower leverage and smaller lots make it easier to survive mistakes while learning.

### Is spread measured in pips?

Yes. Spread is commonly described as the pip difference between buy and sell prices.`,
    },
    {
      market: markets.global,
      template: templates.guide,
      translationGroupId: translationGroups.account.id,
      topic: topics.globalAccount,
      title: "How to Open a Forex Trading Account",
      slug: "how-to-open-a-forex-trading-account",
      contentType: ContentType.GUIDE,
      status: ContentStatus.PUBLISHED,
      summary: "A step-by-step account-opening guide for choosing a broker, verifying identity, and testing a platform.",
      brokers: [brokers.exness],
      seoTitle: "How to Open a Forex Trading Account",
      metaDescription: "Follow a practical checklist for opening a forex trading account, verifying your profile, and testing deposits and withdrawals.",
      body: `# How to Open a Forex Trading Account

Opening a forex account should be treated as an operational checklist, not a rushed signup. The goal is to verify that the broker, platform, funding process, and risk controls match your needs.

## Key Takeaways

- Decide your market, language, and support needs before choosing a broker.
- Verify identity and address using accurate documents.
- Test the platform and withdrawal process before scaling deposits.

## Step 1: Define your account needs

Choose whether you need a beginner account, lower spread account, swap-free account, local payment options, or specific platform support.

## Step 2: Compare broker basics

Check regulatory profile, fees, platform uptime, minimum deposit, support channels, and risk warnings. A best forex brokers for beginners list can help you organize candidates.

## Step 3: Complete verification

Most brokers request identity and address checks. Use matching names, clear document images, and accurate contact details.

## Step 4: Test with a small amount

Before committing larger funds, test login, order placement, deposit confirmation, and withdrawal handling with a conservative amount.

## FAQ

### Can I open more than one forex account?

Yes. Many traders maintain multiple accounts, but each account should still pass basic due diligence.

### Should I deposit before learning the platform?

No. Use demo mode or a very small balance until order entry and risk controls feel familiar.`,
    },
    {
      market: markets.global,
      template: templates.article,
      topic: topics.globalBasics,
      title: "Forex Risk Management Checklist",
      slug: "forex-risk-management-checklist",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.PUBLISHED,
      summary: "A simple checklist for position size, stop distance, leverage, and trade review.",
      seoTitle: "Forex Risk Management Checklist",
      metaDescription: "Use this beginner forex risk management checklist before placing leveraged trades.",
      body: `# Forex Risk Management Checklist

Risk management is the part of trading that decides whether a beginner survives long enough to improve. The checklist should be simple enough to use before every trade.

## Key Takeaways

- Decide risk per trade before choosing position size.
- Avoid moving a stop loss because of emotion.
- Track mistakes in a journal after each trading session.

## Position size

Position size should follow account balance, stop distance, and maximum acceptable loss. If the stop is wider, the lot size usually needs to be smaller.

## Leverage

Leverage changes how quickly a trade can affect equity. Low leverage does not remove risk, but it can reduce the speed of losses.

## Trade review

After each session, write down whether the trade followed the plan. The review should focus on process quality, not only profit or loss.

## FAQ

### What is the simplest risk rule?

Risk a small fixed percentage per trade and stop trading when the daily loss limit is reached.

### Does risk management guarantee profits?

No. It only helps limit damage and keep decisions consistent.`,
    },
    {
      market: markets.global,
      template: templates.guide,
      topic: topics.globalBrokers,
      title: "How to Verify a Forex Broker Before Depositing",
      slug: "how-to-verify-a-forex-broker",
      contentType: ContentType.GUIDE,
      status: ContentStatus.PUBLISHED,
      summary: "A due-diligence workflow for checking broker identity, trading terms, support, and withdrawal process.",
      brokers: [brokers.samplefx],
      seoTitle: "How to Verify a Forex Broker Before Depositing",
      metaDescription: "Learn how to verify a forex broker before depositing by checking facts, documents, support quality, and withdrawal terms.",
      body: `# How to Verify a Forex Broker Before Depositing

Broker verification is a practical safety step. It does not prove that trading will be profitable, but it can help avoid poor fit, unclear terms, and preventable account problems.

## Key Takeaways

- Match the broker name, legal entity, and client agreement.
- Read fees and withdrawal terms before depositing.
- Test support with a real account question.

## Check identity and entity details

Confirm the operating entity shown during signup. A broker may use different entities for different regions, so the contract matters.

## Review trading conditions

Look at spread, commission, leverage, account types, execution terms, and platform availability. Compare the details with broker reviews and broker fact tables.

## Test support and withdrawals

Ask a specific question and evaluate response quality. When possible, test a small withdrawal before depositing a larger balance.

## FAQ

### Is a broker review enough?

No. Reviews help, but you should still inspect the broker account documents and current trading conditions.

### What if broker terms are unclear?

Treat unclear terms as a reason to pause until support can explain them in writing.`,
    },
    {
      market: markets.global,
      template: templates["broker-review"],
      topic: topics.globalBrokers,
      title: "Exness Review",
      slug: "exness-review",
      contentType: ContentType.BROKER_REVIEW,
      status: ContentStatus.PUBLISHED,
      summary: "A pilot broker review page connected to Exness broker facts and centralized affiliate CTAs.",
      brokers: [brokers.exness],
      seoTitle: "Exness Review: Platforms, Costs, and Account Checklist",
      metaDescription: "Read a pilot Exness review covering platform access, broker facts, account checks, pros, cons, and FAQ.",
      body: `# Exness Review

This pilot review demonstrates how a broker page can combine editorial sections, sourced broker facts, and centralized CTA slots without placing affiliate URLs in the article body.

## Key Takeaways

- Exness is connected to structured broker facts in the CMS.
- CTA buttons resolve through Affiliate Manager tokens.
- Editors can update broker facts without rewriting the review.

## Pros and Cons

### Pros

- Multiple platform options are represented in broker facts.
- Market-specific support facts can be attached where relevant.
- CTA links are centrally managed.

### Cons

- This pilot review does not include a rating model yet.
- Readers still need to confirm current terms before depositing.

## Account experience

The review should help a reader understand signup steps, platform availability, funding checks, and support expectations.

## Broker due diligence

Use sourced broker facts as the structured layer, then add editorial context around account fit and risk.

## FAQ

### Does this review include a rating?

No. Review schema is emitted without reviewRating until a dedicated rating model exists.

### Are affiliate links in the markdown?

No. CTA slots use broker and campaign tokens.`,
    },
    {
      market: markets.global,
      template: templates["broker-review"],
      topic: topics.globalBrokers,
      title: "SampleFX Review",
      slug: "samplefx-review",
      contentType: ContentType.BROKER_REVIEW,
      status: ContentStatus.PUBLISHED,
      summary: "A fictional broker review for testing broker fact rendering and CTA resolution.",
      brokers: [brokers.samplefx],
      seoTitle: "SampleFX Review: Demo Broker Facts and CTA Flow",
      metaDescription: "Review fictional SampleFX demo broker data for platform, spread, minimum deposit, and CMS affiliate CTA behavior.",
      body: `# SampleFX Review

SampleFX is a fictional pilot broker used to test how reviews behave when broker facts, editorial sections, FAQs, and CTAs are all present.

## Key Takeaways

- The page uses sourced demo facts from Broker Manager.
- CTAs should resolve only when active affiliate links exist.
- The review shares a market and language with related broker pages.

## Pros and Cons

### Pros

- Clear demo minimum deposit fact.
- Platform details are structured.
- Useful for comparison route testing.

### Cons

- Fictional broker, so this page is for pipeline testing only.
- No rating score is stored yet.

## Trading conditions

The review describes spreads, platform options, and account setup in editorial language while facts stay in structured rows.

## FAQ

### Is SampleFX real?

No. It is a fictional demo broker for testing CMS behavior.

### Why include a fictional broker?

It lets the pipeline test comparison and CTA handling without making live financial claims.`,
    },
    {
      market: markets.global,
      template: templates["best-broker-list"],
      translationGroupId: translationGroups.bestBeginners.id,
      topic: topics.globalBrokers,
      title: "Best Forex Brokers for Beginners",
      slug: "best-forex-brokers-for-beginners",
      contentType: ContentType.BEST_BROKER_LIST,
      status: ContentStatus.PUBLISHED,
      summary: "A small best-broker list pilot focused on beginner account checks and safe comparison habits.",
      brokers: [brokers.exness, brokers.samplefx, brokers["example-markets"]],
      seoTitle: "Best Forex Brokers for Beginners: Pilot Checklist",
      metaDescription: "Compare beginner-friendly forex broker considerations including account setup, platform access, support, and risk controls.",
      body: `# Best Forex Brokers for Beginners

A beginner broker list should make comparison easier without implying that one account is right for every trader. This pilot page focuses on process, not guarantees.

## Key Takeaways

- Beginners should compare costs, platform usability, support, and withdrawal process.
- Broker reviews should link to structured broker fact pages.
- A first deposit should be small enough to test operations.

## How we group beginner broker options

The first pass groups brokers by account clarity, platform availability, support quality, and the ability to test funding and withdrawals.

## Beginner checklist

Shortlist brokers, read review pages, compare sourced facts, open a demo or small live account, and keep risk exposure conservative.

## FAQ

### Is the top broker always best for every trader?

No. Account fit depends on country, language, platform preference, payment method, and risk tolerance.

### Should I choose based only on bonuses?

No. Trading terms, withdrawal process, and risk controls matter more than promotions.`,
    },
    {
      market: markets.global,
      template: templates.article,
      translationGroupId: translationGroups.faq.id,
      topic: topics.globalBasics,
      title: "Forex Trading FAQ",
      slug: "forex-trading-faq",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.PUBLISHED,
      summary: "A compact FAQ page answering common beginner forex questions.",
      seoTitle: "Forex Trading FAQ for Beginners",
      metaDescription: "Find concise answers to common beginner questions about forex trading, brokers, leverage, demo accounts, and risk.",
      body: `# Forex Trading FAQ

This page collects short answers to common beginner questions. It also tests FAQPage schema generation from template blocks.

## Key Takeaways

- Forex trading involves leveraged currency speculation.
- Broker choice should include due diligence, not only pricing.
- Demo practice helps beginners understand platform mechanics.

## FAQ

### What is forex trading?

Forex trading is buying one currency while selling another, usually through currency pairs.

### What is a demo account?

A demo account lets you practise on a trading platform without using real money.

### Why do traders compare brokers?

They compare brokers to review costs, platform options, funding methods, support, and operational reliability.

### How can I start safely?

Start with education, practise in demo mode, understand risk, then use a small amount if you decide to trade live.`,
    },
    {
      market: markets.vn,
      template: templates.article,
      translationGroupId: translationGroups.basics.id,
      topic: topics.vnBasics,
      title: "Forex la gi?",
      slug: "forex-la-gi",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.PUBLISHED,
      summary: "Bai giai thich forex co ban cho nguoi moi tai thi truong Viet Nam.",
      seoTitle: "Forex la gi? Huong dan co ban cho nguoi moi",
      metaDescription: "Tim hieu forex la gi, cap tien te, pip, don bay, rui ro va cach bat dau hoc forex mot cach co kiem soat.",
      body: `# Forex la gi?

Forex la thi truong trao doi tien te, noi mot dong tien duoc dinh gia so voi dong tien khac. Nguoi moi nen hieu cap tien te, pip, don bay, ky quy va rui ro truoc khi nap tien.

## Key Takeaways

- Forex la giao dich theo cap tien te.
- Don bay co the lam loi nhuan va thua lo phong dai.
- Nguoi moi nen hoc demo va lap ke hoach quan tri rui ro.

## Cap tien te hoat dong nhu the nao

Mot cap tien te gom dong tien co so va dong tien dinh gia. Khi EUR/USD tang, dong euro dang manh len so voi do la My.

## Rui ro voi nguoi moi

Rui ro lon nhat thuong den tu giao dich qua lon, dung don bay cao, va khong co ke hoach dung lo. Truoc khi mo tai khoan forex, hay hoc cach tinh khoi luong lenh.

## FAQ

### Forex co phu hop voi tat ca moi nguoi khong?

Khong. Forex co rui ro cao va khong phu hop neu ban chua hieu don bay va kha nang thua lo.

### Bai viet co dat link affiliate trong noi dung khong?

Khong. Moi nut CTA neu co deu di qua Affiliate Manager.`,
    },
    {
      market: markets.vn,
      template: templates.guide,
      translationGroupId: translationGroups.account.id,
      topic: topics.vnAccount,
      title: "Cach mo tai khoan forex",
      slug: "cach-mo-tai-khoan-forex",
      contentType: ContentType.GUIDE,
      status: ContentStatus.PUBLISHED,
      summary: "Checklist mo tai khoan forex cho nguoi moi, tu chon san den xac minh va test rut tien.",
      brokers: [brokers.exness],
      seoTitle: "Cach mo tai khoan forex cho nguoi moi",
      metaDescription: "Lam theo checklist mo tai khoan forex: chon san, chuan bi giay to, xac minh, nap thu nho va test rut tien.",
      body: `# Cach mo tai khoan forex

Mo tai khoan forex nen duoc xem nhu mot quy trinh kiem tra. Ban can biet minh dang dang ky voi don vi nao, dieu kien giao dich ra sao, va cach rut tien co ro rang khong.

## Key Takeaways

- Chon san theo thi truong, ngon ngu ho tro va nhu cau thanh toan.
- Chuan bi thong tin ca nhan chinh xac de xac minh.
- Nen test nap rut voi so tien nho truoc.

## Buoc 1: Chon san va loai tai khoan

Hay so sanh san forex uy tin theo phi giao dich, nen tang, ho tro, dieu kien nap rut va muc do phu hop voi nguoi moi.

## Buoc 2: Dang ky va xac minh

Nhap thong tin dung voi giay to. Tai anh ro net va kiem tra lai dia chi, so dien thoai, email.

## Buoc 3: Test nen tang

Dung demo hoac khoi luong nho de kiem tra dat lenh, dung lo, chot loi va lich su giao dich.

## FAQ

### Co nen nap tien lon ngay sau khi mo tai khoan?

Khong. Nen bat dau nho de test quy trinh va kha nang quan tri rui ro.

### Co can xac minh danh tinh khong?

Thuong la co. Broker hop le thuong yeu cau xac minh theo quy trinh KYC.`,
    },
    {
      market: markets.vn,
      template: templates["broker-review"],
      topic: topics.vnBrokers,
      title: "Danh gia Exness cho trader Viet Nam",
      slug: "exness-review-vietnam",
      contentType: ContentType.BROKER_REVIEW,
      status: ContentStatus.PUBLISHED,
      summary: "Trang review pilot cho Exness o thi truong Viet Nam, co fact theo market va CTA tap trung.",
      brokers: [brokers.exness],
      seoTitle: "Danh gia Exness cho trader Viet Nam",
      metaDescription: "Xem danh gia Exness cho trader Viet Nam voi checklist tai khoan, fact co nguon, uu nhuoc diem va cau hoi thuong gap.",
      body: `# Danh gia Exness cho trader Viet Nam

Bai review pilot nay kiem tra viec gan broker, hien fact theo thi truong, FAQ schema, Review schema va CTA khong hard-code link trong noi dung.

## Key Takeaways

- Broker facts co the co ban global va ban rieng cho Viet Nam.
- CTA resolve qua token broker, market, language va campaign.
- Review chua co rating cho den khi co model cham diem rieng.

## Pros and Cons

### Pros

- Co fact demo ve nen tang giao dich.
- Co fact demo ve ho tro tieng Viet.
- CTA duoc quan ly tap trung.

### Cons

- Du lieu trong seed la demo, khong thay the viec kiem tra dieu khoan moi nhat.
- Chua co model rating cong khai.

## Trai nghiem tai khoan

Nguoi dung Viet Nam nen kiem tra ngon ngu ho tro, phuong thuc nap rut, quy trinh xac minh va dieu kien don bay truoc khi giao dich.

## FAQ

### Review nay co phai loi khuyen dau tu khong?

Khong. Day la noi dung demo CMS va thong tin tham khao ve quy trinh kiem tra broker.

### Nut CTA lay link tu dau?

Nut CTA lay link tu Affiliate Manager neu co link active cho broker va market.`,
    },
    {
      market: markets.vn,
      template: templates["best-broker-list"],
      translationGroupId: translationGroups.bestBeginners.id,
      topic: topics.vnBrokers,
      title: "San forex uy tin cho nguoi moi",
      slug: "san-forex-uy-tin-cho-nguoi-moi",
      contentType: ContentType.BEST_BROKER_LIST,
      status: ContentStatus.PUBLISHED,
      summary: "Danh sach pilot giup nguoi moi tai Viet Nam so sanh san theo checklist co kiem soat.",
      brokers: [brokers.exness, brokers.samplefx, brokers["example-markets"]],
      seoTitle: "San forex uy tin cho nguoi moi tai Viet Nam",
      metaDescription: "Tham khao checklist chon san forex cho nguoi moi tai Viet Nam: phi, nen tang, nap rut, ho tro va quan tri rui ro.",
      body: `# San forex uy tin cho nguoi moi

Nguoi moi khong nen chon san chi vi quang cao. Mot danh sach tot can giai thich tieu chi, dua ra cach kiem tra, va lien ket den review chi tiet.

## Key Takeaways

- Hay so sanh phi, nen tang, ho tro, nap rut va dieu khoan tai khoan.
- Uu tien san co thong tin ro rang va quy trinh rut tien minh bach.
- Bat dau voi so tien nho neu quyet dinh giao dich live.

## Tieu chi chon san

Tieu chi nen gom phap ly, chi phi, toc do nap rut, chat luong nen tang, ho tro tieng Viet va kha nang kiem soat rui ro.

## Cach doc review broker

Review nen tach y kien bien tap khoi du lieu broker co nguon. Neu thong tin quan trong chua co source, hay tam coi la can kiem tra them.

## FAQ

### Co san nao tot nhat cho tat ca nguoi moi khong?

Khong. Moi trader co nhu cau thi truong, ngan sach, phuong thuc thanh toan va muc chiu rui ro khac nhau.

### Nen doc gi truoc khi mo tai khoan?

Nen doc bai cach mo tai khoan forex va review broker lien quan.`,
    },
    {
      market: markets.vn,
      template: templates.article,
      translationGroupId: translationGroups.faq.id,
      topic: topics.vnBasics,
      title: "Cau hoi thuong gap ve forex",
      slug: "cau-hoi-thuong-gap-ve-forex",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.PUBLISHED,
      summary: "FAQ ngan cho nguoi moi tim hieu forex tai Viet Nam.",
      seoTitle: "Cau hoi thuong gap ve forex cho nguoi moi",
      metaDescription: "Tra loi ngan gon cac cau hoi pho bien ve forex, tai khoan demo, don bay, broker va cach bat dau an toan hon.",
      body: `# Cau hoi thuong gap ve forex

Trang FAQ nay kiem tra noi dung hoi dap, schema FAQPage va internal link trong cung market ngon ngu.

## Key Takeaways

- Forex co rui ro va can hoc truoc khi nap tien.
- Tai khoan demo giup lam quen voi nen tang.
- Chon broker can dua tren nhieu tieu chi, khong chi bonus.

## FAQ

### Forex la gi?

Forex la thi truong giao dich tien te theo cap, vi du EUR/USD hoac USD/JPY.

### Tai khoan demo la gi?

Tai khoan demo cho phep tap dat lenh tren nen tang ma khong dung tien that.

### Don bay co nguy hiem khong?

Co. Don bay lam tang quy mo vi the va co the lam thua lo nhanh hon.

### Nen chon san forex nhu the nao?

Hay so sanh dieu kien giao dich, nap rut, ho tro, quy trinh xac minh va san forex uy tin trong cung thi truong.`,
    },
    {
      market: markets.vn,
      template: templates.article,
      topic: topics.vnBasics,
      title: "Pip, lot va don bay trong forex",
      slug: "pip-lot-va-don-bay-trong-forex",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.PUBLISHED,
      summary: "Giai thich pip, lot, ky quy va don bay bang ngon ngu don gian cho nguoi moi.",
      seoTitle: "Pip, lot va don bay trong forex la gi?",
      metaDescription: "Hieu pip, lot, ky quy va don bay de quan ly rui ro tot hon khi bat dau hoc forex.",
      body: `# Pip, lot va don bay trong forex

Neu ban moi hoc forex, pip, lot va don bay la nhung khai niem can nam truoc khi dat lenh dau tien.

## Key Takeaways

- Pip do bien dong gia.
- Lot la quy mo vi the.
- Don bay lam tang tac dong cua loi nhuan va thua lo.

## Pip la gi?

Pip la don vi bien dong gia thuong dung khi noi ve spread, muc chot loi va dung lo.

## Lot la gi?

Lot the hien quy mo giao dich. Lot nho giup nguoi moi kiem soat rui ro tot hon.

## Don bay va ky quy

Ky quy la so tien bi giu de mo lenh co don bay. Don bay cao khong dong nghia voi an toan hon.

## FAQ

### Nguoi moi nen dung lot lon khong?

Khong. Nen dung lot nho cho den khi hieu ro rui ro.

### Don bay co phai tien mien phi khong?

Khong. Don bay la cong cu phong dai vi the va rui ro.`,
    },
    {
      market: markets.global,
      template: templates["best-broker-list"],
      topic: topics.globalBrokers,
      title: "Best Forex Brokers for Low Minimum Deposits",
      slug: "best-forex-brokers-low-minimum-deposit",
      contentType: ContentType.BEST_BROKER_LIST,
      status: ContentStatus.PUBLISHED,
      summary: "A pilot list for testing best-broker pages with low-deposit search intent.",
      brokers: [brokers.samplefx, brokers.exness],
      seoTitle: "Best Forex Brokers for Low Minimum Deposits",
      metaDescription: "Use this pilot checklist to compare low-minimum-deposit forex brokers, funding methods, trading costs, and account controls.",
      body: `# Best Forex Brokers for Low Minimum Deposits

Low minimum deposit pages attract beginners, but the amount required to start should never be the only selection criterion.

## Key Takeaways

- A low deposit can reduce operational test cost.
- Fees, spread, platform quality, and withdrawal rules still matter.
- Broker facts should show source-backed account details.

## What low minimum deposit means

A low deposit can help a trader test account opening, verification, platform use, and withdrawal operations with less capital at risk.

## What to check beyond deposit size

Review spread, commission, leverage, deposit methods, support availability, and account restrictions before deciding.

## FAQ

### Is the broker with the lowest deposit automatically best?

No. Low deposit is useful, but it does not replace due diligence.

### Should beginners trade live immediately?

No. Demo practice and a written risk plan should come first.`,
    },
    {
      market: markets.global,
      template: templates.article,
      topic: topics.globalBasics,
      title: "AI Import Pilot Draft",
      slug: "ai-import-pilot-draft",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.DRAFT,
      summary: "Draft-only seed used to verify that unpublished AI-style content does not render publicly.",
      seoTitle: "AI Import Pilot Draft",
      metaDescription: "Draft-only seed for checking admin edit and public not-found behavior.",
      body: `# AI Import Pilot Draft

This draft exists to verify that admin can edit unpublished content while the public route stays unavailable.

## Key Takeaways

- Draft content should be visible in admin only.
- Public rendering must require published status.

## Draft body

This content should not appear on the public site until an editor publishes it.`,
    },
  ];

  const contentBySlug = {};

  for (const seed of contentSeeds) {
    contentBySlug[seed.slug] = await upsertContent(seed);
  }

  await prisma.topicCluster.update({
    where: { id: clusters.globalEducation.id },
    data: { priorityContentItemId: contentBySlug["forex-trading-basics"].id },
  });
  await prisma.topicCluster.update({
    where: { id: clusters.globalBrokers.id },
    data: { priorityContentItemId: contentBySlug["best-forex-brokers-for-beginners"].id },
  });
  await prisma.topicCluster.update({
    where: { id: clusters.vnEducation.id },
    data: { priorityContentItemId: contentBySlug["forex-la-gi"].id },
  });
  await prisma.topicCluster.update({
    where: { id: clusters.vnBrokers.id },
    data: { priorityContentItemId: contentBySlug["san-forex-uy-tin-cho-nguoi-moi"].id },
  });

  await seedInternalLinks(markets, clusters, contentBySlug);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
