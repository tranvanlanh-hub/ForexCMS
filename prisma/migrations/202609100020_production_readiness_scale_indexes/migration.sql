-- Targeted indexes for checkpoint 31 production-readiness query paths.
-- These are additive PostgreSQL indexes and do not change portable app architecture.

CREATE INDEX "idx_content_public_lookup"
  ON "ContentItem"("marketId", "contentType", "status", "slug");

CREATE INDEX "idx_content_sitemap_market"
  ON "ContentItem"("marketId", "status", "publishedAt", "createdAt");

CREATE INDEX "idx_content_sitemap_status"
  ON "ContentItem"("status", "publishedAt", "createdAt");

CREATE INDEX "idx_affiliate_resolver"
  ON "AffiliateLink"("brokerId", "marketId", "languageCode", "campaign", "status", "priority", "updatedAt");
