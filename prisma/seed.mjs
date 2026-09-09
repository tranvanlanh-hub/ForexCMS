import {
  AffiliateLinkStatus,
  BrokerStatus,
  ContentStatus,
  ContentType,
  PrismaClient,
  RobotsIndex,
  TemplateKind,
} from "@prisma/client";

const prisma = new PrismaClient();

function markdownBody(markdown) {
  return {
    format: "markdown",
    markdown,
  };
}

async function main() {
  const market = await prisma.market.upsert({
    where: { code: "global" },
    update: {
      name: "Global",
      languageCode: "en",
      locale: "en",
      isGlobal: true,
      status: "ACTIVE",
    },
    create: {
      code: "global",
      name: "Global",
      languageCode: "en",
      locale: "en",
      isGlobal: true,
      status: "ACTIVE",
    },
  });

  const articleTemplate = await prisma.template.upsert({
    where: { key: "article" },
    update: {
      name: "Article",
      kind: TemplateKind.ARTICLE,
      isActive: true,
    },
    create: {
      key: "article",
      name: "Article",
      kind: TemplateKind.ARTICLE,
      description: "Default editorial article template.",
      requiredBlocks: ["intro", "body"],
      allowedBlocks: ["intro", "body", "faq", "summary"],
      schemaTypes: ["Article", "BreadcrumbList"],
      isActive: true,
    },
  });

  await prisma.template.upsert({
    where: { key: "broker-review" },
    update: {
      name: "Broker Review",
      kind: TemplateKind.BROKER_REVIEW,
      isActive: true,
    },
    create: {
      key: "broker-review",
      name: "Broker Review",
      kind: TemplateKind.BROKER_REVIEW,
      description: "Default broker review template.",
      requiredBlocks: ["intro", "broker_facts", "verdict"],
      allowedBlocks: ["intro", "broker_facts", "pros_cons", "verdict", "faq"],
      schemaTypes: ["Review", "BreadcrumbList"],
      ctaSlots: ["top", "middle", "bottom"],
      isActive: true,
    },
  });

  const broker = await prisma.broker.upsert({
    where: { slug: "exness" },
    update: {
      name: "Exness",
      status: BrokerStatus.ACTIVE,
      logoUrl: "https://example.com/media/brokers/exness-logo.png",
      description: "Demo broker profile used to test centralized affiliate CTAs.",
    },
    create: {
      slug: "exness",
      name: "Exness",
      status: BrokerStatus.ACTIVE,
      logoUrl: "https://example.com/media/brokers/exness-logo.png",
      description: "Demo broker profile used to test centralized affiliate CTAs.",
    },
  });

  const existingAffiliateLink = await prisma.affiliateLink.findFirst({
    where: {
      brokerId: broker.id,
      marketId: market.id,
      languageCode: "en",
      campaign: "review_top_cta",
      priority: 10,
    },
  });

  if (existingAffiliateLink) {
    await prisma.affiliateLink.update({
      where: { id: existingAffiliateLink.id },
      data: {
        destinationUrl: "https://example.com/go/exness?campaign=review_top_cta",
        status: AffiliateLinkStatus.ACTIVE,
        sponsored: true,
        nofollow: true,
      },
    });
  } else {
    await prisma.affiliateLink.create({
      data: {
        brokerId: broker.id,
        marketId: market.id,
        languageCode: "en",
        campaign: "review_top_cta",
        destinationUrl: "https://example.com/go/exness?campaign=review_top_cta",
        status: AffiliateLinkStatus.ACTIVE,
        priority: 10,
        sponsored: true,
        nofollow: true,
      },
    });
  }

  const published = await prisma.contentItem.upsert({
    where: { canonicalPath: "/global/articles/forex-trading-basics/" },
    update: {
      marketId: market.id,
      templateId: articleTemplate.id,
      title: "Forex Trading Basics",
      slug: "forex-trading-basics",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.PUBLISHED,
      summary: "A short demo article for testing the public content renderer.",
      body: markdownBody(`# Forex Trading Basics

Forex trading means exchanging one currency for another. This demo page proves that published CMS content can render on the public SEO route.

## What this page tests

- The URL includes market, content type, and slug.
- The page renders only when status is published.
- The visible title remains the only H1.

## Next steps

Later changes can replace this simple markdown renderer with template-aware blocks.`),
      publishedAt: new Date(),
      brokers: {
        set: [{ id: broker.id }],
      },
    },
    create: {
      marketId: market.id,
      templateId: articleTemplate.id,
      title: "Forex Trading Basics",
      slug: "forex-trading-basics",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.PUBLISHED,
      summary: "A short demo article for testing the public content renderer.",
      body: markdownBody(`# Forex Trading Basics

Forex trading means exchanging one currency for another. This demo page proves that published CMS content can render on the public SEO route.

## What this page tests

- The URL includes market, content type, and slug.
- The page renders only when status is published.
- The visible title remains the only H1.

## Next steps

Later changes can replace this simple markdown renderer with template-aware blocks.`),
      canonicalPath: "/global/articles/forex-trading-basics/",
      publishedAt: new Date(),
      brokers: {
        connect: [{ id: broker.id }],
      },
    },
  });

  await prisma.seoMetadata.upsert({
    where: { contentItemId: published.id },
    update: {
      marketId: market.id,
      title: "Forex Trading Basics | Forex Affiliate CMS",
      description: "Demo published forex article rendered by the public CMS route.",
      canonicalPath: "/global/articles/forex-trading-basics/",
      robotsIndex: RobotsIndex.INDEX,
      robotsFollow: true,
    },
    create: {
      marketId: market.id,
      contentItemId: published.id,
      title: "Forex Trading Basics | Forex Affiliate CMS",
      description: "Demo published forex article rendered by the public CMS route.",
      canonicalPath: "/global/articles/forex-trading-basics/",
      robotsIndex: RobotsIndex.INDEX,
      robotsFollow: true,
    },
  });

  await prisma.contentItem.upsert({
    where: { canonicalPath: "/global/articles/unpublished-draft-demo/" },
    update: {
      marketId: market.id,
      templateId: articleTemplate.id,
      title: "Unpublished Draft Demo",
      slug: "unpublished-draft-demo",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.DRAFT,
      body: markdownBody("This draft should not render publicly."),
      publishedAt: null,
    },
    create: {
      marketId: market.id,
      templateId: articleTemplate.id,
      title: "Unpublished Draft Demo",
      slug: "unpublished-draft-demo",
      contentType: ContentType.ARTICLE,
      status: ContentStatus.DRAFT,
      body: markdownBody("This draft should not render publicly."),
      canonicalPath: "/global/articles/unpublished-draft-demo/",
    },
  });
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
