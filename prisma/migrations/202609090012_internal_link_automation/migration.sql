CREATE TYPE "TopicClusterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "AnchorTextStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "InternalLinkRuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "InternalLinkRuleMode" AS ENUM ('SUGGEST_ONLY', 'AUTO_APPROVE');
CREATE TYPE "InternalLinkSuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'ARCHIVED');

ALTER TABLE "Topic"
ADD COLUMN "topicClusterId" TEXT;

CREATE TABLE "TopicCluster" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "priorityContentItemId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "description" TEXT,
    "status" "TopicClusterStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicCluster_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnchorText" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "topicClusterId" TEXT,
    "targetContentItemId" TEXT,
    "text" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "contentTypes" JSONB NOT NULL DEFAULT '[]',
    "status" "AnchorTextStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnchorText_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalLinkRule" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "topicClusterId" TEXT,
    "targetContentItemId" TEXT,
    "name" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "sourceContentType" "ContentType",
    "targetContentType" "ContentType",
    "status" "InternalLinkRuleStatus" NOT NULL DEFAULT 'DRAFT',
    "mode" "InternalLinkRuleMode" NOT NULL DEFAULT 'SUGGEST_ONLY',
    "maxLinksPerContent" INTEGER NOT NULL DEFAULT 6,
    "minWordsBetweenLinks" INTEGER NOT NULL DEFAULT 120,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalLinkRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalLinkSuggestion" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "sourceContentItemId" TEXT NOT NULL,
    "targetContentItemId" TEXT NOT NULL,
    "anchorTextId" TEXT,
    "ruleId" TEXT,
    "anchorText" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "status" "InternalLinkSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalLinkSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopicCluster_marketId_languageCode_slug_key"
ON "TopicCluster"("marketId", "languageCode", "slug");

CREATE INDEX "TopicCluster_marketId_languageCode_status_idx"
ON "TopicCluster"("marketId", "languageCode", "status");

CREATE INDEX "TopicCluster_priorityContentItemId_idx"
ON "TopicCluster"("priorityContentItemId");

CREATE UNIQUE INDEX "AnchorText_marketId_languageCode_text_targetContentItemId_key"
ON "AnchorText"("marketId", "languageCode", "text", "targetContentItemId");

CREATE INDEX "AnchorText_marketId_languageCode_status_idx"
ON "AnchorText"("marketId", "languageCode", "status");

CREATE INDEX "AnchorText_topicClusterId_idx"
ON "AnchorText"("topicClusterId");

CREATE INDEX "AnchorText_targetContentItemId_idx"
ON "AnchorText"("targetContentItemId");

CREATE INDEX "InternalLinkRule_marketId_languageCode_status_idx"
ON "InternalLinkRule"("marketId", "languageCode", "status");

CREATE INDEX "InternalLinkRule_topicClusterId_idx"
ON "InternalLinkRule"("topicClusterId");

CREATE INDEX "InternalLinkRule_targetContentItemId_idx"
ON "InternalLinkRule"("targetContentItemId");

CREATE INDEX "InternalLinkRule_sourceContentType_targetContentType_idx"
ON "InternalLinkRule"("sourceContentType", "targetContentType");

CREATE UNIQUE INDEX "InternalLinkSuggestion_sourceContentItemId_targetContentItemId_anchorText_key"
ON "InternalLinkSuggestion"("sourceContentItemId", "targetContentItemId", "anchorText");

CREATE INDEX "InternalLinkSuggestion_marketId_languageCode_status_idx"
ON "InternalLinkSuggestion"("marketId", "languageCode", "status");

CREATE INDEX "InternalLinkSuggestion_sourceContentItemId_status_idx"
ON "InternalLinkSuggestion"("sourceContentItemId", "status");

CREATE INDEX "InternalLinkSuggestion_targetContentItemId_idx"
ON "InternalLinkSuggestion"("targetContentItemId");

CREATE INDEX "InternalLinkSuggestion_ruleId_idx"
ON "InternalLinkSuggestion"("ruleId");

CREATE INDEX "Topic_topicClusterId_idx"
ON "Topic"("topicClusterId");

ALTER TABLE "Topic"
ADD CONSTRAINT "Topic_topicClusterId_fkey"
FOREIGN KEY ("topicClusterId") REFERENCES "TopicCluster"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TopicCluster"
ADD CONSTRAINT "TopicCluster_marketId_fkey"
FOREIGN KEY ("marketId") REFERENCES "Market"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TopicCluster"
ADD CONSTRAINT "TopicCluster_priorityContentItemId_fkey"
FOREIGN KEY ("priorityContentItemId") REFERENCES "ContentItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnchorText"
ADD CONSTRAINT "AnchorText_marketId_fkey"
FOREIGN KEY ("marketId") REFERENCES "Market"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnchorText"
ADD CONSTRAINT "AnchorText_topicClusterId_fkey"
FOREIGN KEY ("topicClusterId") REFERENCES "TopicCluster"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnchorText"
ADD CONSTRAINT "AnchorText_targetContentItemId_fkey"
FOREIGN KEY ("targetContentItemId") REFERENCES "ContentItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalLinkRule"
ADD CONSTRAINT "InternalLinkRule_marketId_fkey"
FOREIGN KEY ("marketId") REFERENCES "Market"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalLinkRule"
ADD CONSTRAINT "InternalLinkRule_topicClusterId_fkey"
FOREIGN KEY ("topicClusterId") REFERENCES "TopicCluster"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InternalLinkRule"
ADD CONSTRAINT "InternalLinkRule_targetContentItemId_fkey"
FOREIGN KEY ("targetContentItemId") REFERENCES "ContentItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalLinkSuggestion"
ADD CONSTRAINT "InternalLinkSuggestion_marketId_fkey"
FOREIGN KEY ("marketId") REFERENCES "Market"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalLinkSuggestion"
ADD CONSTRAINT "InternalLinkSuggestion_sourceContentItemId_fkey"
FOREIGN KEY ("sourceContentItemId") REFERENCES "ContentItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalLinkSuggestion"
ADD CONSTRAINT "InternalLinkSuggestion_targetContentItemId_fkey"
FOREIGN KEY ("targetContentItemId") REFERENCES "ContentItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalLinkSuggestion"
ADD CONSTRAINT "InternalLinkSuggestion_anchorTextId_fkey"
FOREIGN KEY ("anchorTextId") REFERENCES "AnchorText"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InternalLinkSuggestion"
ADD CONSTRAINT "InternalLinkSuggestion_ruleId_fkey"
FOREIGN KEY ("ruleId") REFERENCES "InternalLinkRule"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
