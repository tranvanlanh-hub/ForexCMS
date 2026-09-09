-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'GUIDE', 'BROKER_REVIEW', 'BROKER_COMPARISON', 'BEST_BROKER_LIST', 'COUNTRY_HUB', 'TOPIC_HUB', 'GLOSSARY_TERM', 'LANDING_PAGE');

-- CreateEnum
CREATE TYPE "TemplateKind" AS ENUM ('ARTICLE', 'GUIDE', 'BROKER_REVIEW', 'BROKER_COMPARISON', 'BEST_BROKER_LIST', 'COUNTRY_HUB', 'TOPIC_HUB', 'GLOSSARY_TERM', 'LANDING_PAGE');

-- CreateEnum
CREATE TYPE "BrokerStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AffiliateLinkStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RobotsIndex" AS ENUM ('INDEX', 'NOINDEX');

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT,
    "languageCode" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "timezone" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "status" "MarketStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "TemplateKind" NOT NULL,
    "description" TEXT,
    "requiredBlocks" JSONB NOT NULL DEFAULT '[]',
    "allowedBlocks" JSONB NOT NULL DEFAULT '[]',
    "schemaTypes" JSONB NOT NULL DEFAULT '[]',
    "ctaSlots" JSONB NOT NULL DEFAULT '[]',
    "internalLinkSlots" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "primaryCategoryId" TEXT,
    "primaryTopicId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "body" JSONB NOT NULL DEFAULT '{}',
    "canonicalPath" TEXT NOT NULL,
    "authorName" TEXT,
    "reviewerName" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" JSONB NOT NULL DEFAULT '{}',
    "status" "ContentStatus" NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMetadata" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "brokerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "canonicalPath" TEXT NOT NULL,
    "robotsIndex" "RobotsIndex" NOT NULL DEFAULT 'INDEX',
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "hreflang" JSONB NOT NULL DEFAULT '{}',
    "schemaJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broker" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "websiteUrl" TEXT,
    "logoAssetKey" TEXT,
    "status" "BrokerStatus" NOT NULL DEFAULT 'DRAFT',
    "facts" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "trackingParams" JSONB NOT NULL DEFAULT '{}',
    "status" "AffiliateLinkStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "sponsored" BOOLEAN NOT NULL DEFAULT true,
    "nofollow" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContentCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContentCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ContentTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContentTopics_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ContentBrokers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContentBrokers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_code_key" ON "Market"("code");

-- CreateIndex
CREATE INDEX "Market_languageCode_idx" ON "Market"("languageCode");

-- CreateIndex
CREATE INDEX "Market_status_idx" ON "Market"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Template_key_key" ON "Template"("key");

-- CreateIndex
CREATE INDEX "Template_kind_idx" ON "Template"("kind");

-- CreateIndex
CREATE INDEX "Template_isActive_idx" ON "Template"("isActive");

-- CreateIndex
CREATE INDEX "Category_marketId_parentId_idx" ON "Category"("marketId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_marketId_slug_key" ON "Category"("marketId", "slug");

-- CreateIndex
CREATE INDEX "Topic_marketId_parentId_idx" ON "Topic"("marketId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_marketId_slug_key" ON "Topic"("marketId", "slug");

-- CreateIndex
CREATE INDEX "ContentItem_marketId_status_idx" ON "ContentItem"("marketId", "status");

-- CreateIndex
CREATE INDEX "ContentItem_contentType_idx" ON "ContentItem"("contentType");

-- CreateIndex
CREATE INDEX "ContentItem_publishedAt_idx" ON "ContentItem"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_marketId_contentType_slug_key" ON "ContentItem"("marketId", "contentType", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_canonicalPath_key" ON "ContentItem"("canonicalPath");

-- CreateIndex
CREATE INDEX "ContentRevision_contentItemId_createdAt_idx" ON "ContentRevision"("contentItemId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRevision_contentItemId_revisionNumber_key" ON "ContentRevision"("contentItemId", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMetadata_contentItemId_key" ON "SeoMetadata"("contentItemId");

-- CreateIndex
CREATE INDEX "SeoMetadata_marketId_idx" ON "SeoMetadata"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMetadata_brokerId_marketId_key" ON "SeoMetadata"("brokerId", "marketId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMetadata_canonicalPath_key" ON "SeoMetadata"("canonicalPath");

-- CreateIndex
CREATE UNIQUE INDEX "Broker_slug_key" ON "Broker"("slug");

-- CreateIndex
CREATE INDEX "Broker_status_idx" ON "Broker"("status");

-- CreateIndex
CREATE INDEX "AffiliateLink_brokerId_marketId_campaign_status_idx" ON "AffiliateLink"("brokerId", "marketId", "campaign", "status");

-- CreateIndex
CREATE INDEX "AffiliateLink_startsAt_endsAt_idx" ON "AffiliateLink"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_brokerId_marketId_campaign_priority_key" ON "AffiliateLink"("brokerId", "marketId", "campaign", "priority");

-- CreateIndex
CREATE INDEX "_ContentCategories_B_index" ON "_ContentCategories"("B");

-- CreateIndex
CREATE INDEX "_ContentTopics_B_index" ON "_ContentTopics"("B");

-- CreateIndex
CREATE INDEX "_ContentBrokers_B_index" ON "_ContentBrokers"("B");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_primaryTopicId_fkey" FOREIGN KEY ("primaryTopicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMetadata" ADD CONSTRAINT "SeoMetadata_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMetadata" ADD CONSTRAINT "SeoMetadata_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMetadata" ADD CONSTRAINT "SeoMetadata_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentCategories" ADD CONSTRAINT "_ContentCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentCategories" ADD CONSTRAINT "_ContentCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentTopics" ADD CONSTRAINT "_ContentTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentTopics" ADD CONSTRAINT "_ContentTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentBrokers" ADD CONSTRAINT "_ContentBrokers_A_fkey" FOREIGN KEY ("A") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentBrokers" ADD CONSTRAINT "_ContentBrokers_B_fkey" FOREIGN KEY ("B") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
