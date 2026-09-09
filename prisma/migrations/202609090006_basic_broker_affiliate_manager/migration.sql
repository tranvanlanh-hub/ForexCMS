ALTER TABLE "Broker"
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "description" TEXT;

ALTER TABLE "AffiliateLink"
ADD COLUMN "languageCode" TEXT NOT NULL DEFAULT 'en';

ALTER TABLE "AffiliateLink"
DROP CONSTRAINT IF EXISTS "AffiliateLink_brokerId_marketId_campaign_priority_key";

CREATE UNIQUE INDEX "AffiliateLink_brokerId_marketId_languageCode_campaign_priority_key"
ON "AffiliateLink"("brokerId", "marketId", "languageCode", "campaign", "priority");

CREATE INDEX "AffiliateLink_languageCode_idx" ON "AffiliateLink"("languageCode");
