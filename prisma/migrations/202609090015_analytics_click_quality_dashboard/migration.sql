-- CreateTable
CREATE TABLE "AffiliateClickEvent" (
    "id" TEXT NOT NULL,
    "affiliateLinkId" TEXT NOT NULL,
    "brokerId" TEXT,
    "contentItemId" TEXT,
    "market" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "referrer" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliateClickEvent_affiliateLinkId_clickedAt_idx" ON "AffiliateClickEvent"("affiliateLinkId", "clickedAt");

-- CreateIndex
CREATE INDEX "AffiliateClickEvent_brokerId_clickedAt_idx" ON "AffiliateClickEvent"("brokerId", "clickedAt");

-- CreateIndex
CREATE INDEX "AffiliateClickEvent_contentItemId_clickedAt_idx" ON "AffiliateClickEvent"("contentItemId", "clickedAt");

-- CreateIndex
CREATE INDEX "AffiliateClickEvent_market_campaign_clickedAt_idx" ON "AffiliateClickEvent"("market", "campaign", "clickedAt");

-- CreateIndex
CREATE INDEX "AffiliateClickEvent_clickedAt_idx" ON "AffiliateClickEvent"("clickedAt");

-- AddForeignKey
ALTER TABLE "AffiliateClickEvent" ADD CONSTRAINT "AffiliateClickEvent_affiliateLinkId_fkey" FOREIGN KEY ("affiliateLinkId") REFERENCES "AffiliateLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClickEvent" ADD CONSTRAINT "AffiliateClickEvent_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClickEvent" ADD CONSTRAINT "AffiliateClickEvent_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
