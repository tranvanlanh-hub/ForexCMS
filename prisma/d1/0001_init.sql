-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT,
    "languageCode" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "timezone" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT,
    "requiredBlocks" TEXT NOT NULL DEFAULT '[]',
    "allowedBlocks" TEXT NOT NULL DEFAULT '[]',
    "schemaTypes" TEXT NOT NULL DEFAULT '[]',
    "ctaSlots" TEXT NOT NULL DEFAULT '[]',
    "internalLinkSlots" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketId" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketId" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Topic_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Topic_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "primaryCategoryId" TEXT,
    "primaryTopicId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "body" TEXT NOT NULL DEFAULT '{}',
    "canonicalPath" TEXT NOT NULL,
    "authorName" TEXT,
    "reviewerName" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentItem_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_primaryTopicId_fkey" FOREIGN KEY ("primaryTopicId") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentItemId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentRevision_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeoMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "brokerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "canonicalPath" TEXT NOT NULL,
    "robotsIndex" TEXT NOT NULL DEFAULT 'INDEX',
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "hreflang" TEXT NOT NULL DEFAULT '{}',
    "schemaJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SeoMetadata_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeoMetadata_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeoMetadata_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Broker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "logoAssetKey" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "facts" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brokerId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'en',
    "campaign" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "trackingParams" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "sponsored" BOOLEAN NOT NULL DEFAULT true,
    "nofollow" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AffiliateLink_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AffiliateLink_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ContentBrokers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContentBrokers_A_fkey" FOREIGN KEY ("A") REFERENCES "Broker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContentBrokers_B_fkey" FOREIGN KEY ("B") REFERENCES "ContentItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE INDEX "AffiliateLink_languageCode_idx" ON "AffiliateLink"("languageCode");

-- CreateIndex
CREATE INDEX "AffiliateLink_startsAt_endsAt_idx" ON "AffiliateLink"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_brokerId_marketId_languageCode_campaign_priority_key" ON "AffiliateLink"("brokerId", "marketId", "languageCode", "campaign", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentCategories_AB_unique" ON "_ContentCategories"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentCategories_B_index" ON "_ContentCategories"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentTopics_AB_unique" ON "_ContentTopics"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentTopics_B_index" ON "_ContentTopics"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentBrokers_AB_unique" ON "_ContentBrokers"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentBrokers_B_index" ON "_ContentBrokers"("B");
