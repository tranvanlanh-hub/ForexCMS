-- Expand Broker Manager with company/contact details, editorial priority,
-- and optional MarketGB review scores. Existing rows remain valid.
ALTER TABLE "Broker"
  ADD COLUMN "supportEmail" TEXT,
  ADD COLUMN "supportPhone" TEXT,
  ADD COLUMN "contactPageUrl" TEXT,
  ADD COLUMN "foundedYear" INTEGER,
  ADD COLUMN "headquartersCountry" TEXT,
  ADD COLUMN "headquartersAddress" TEXT,
  ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN "overallRating" DECIMAL(2,1),
  ADD COLUMN "trustSafetyRating" DECIMAL(2,1),
  ADD COLUMN "feesRating" DECIMAL(2,1),
  ADD COLUMN "researchEducationRating" DECIMAL(2,1),
  ADD COLUMN "tradingToolsRating" DECIMAL(2,1),
  ADD COLUMN "tradingPlatformsRating" DECIMAL(2,1),
  ADD COLUMN "customerSupportRating" DECIMAL(2,1),
  ADD COLUMN "accountTypesRating" DECIMAL(2,1),
  ADD COLUMN "specialFeaturesRating" DECIMAL(2,1),
  ADD COLUMN "accountOpeningRating" DECIMAL(2,1),
  ADD COLUMN "ratingSummary" TEXT,
  ADD COLUMN "ratingReviewedAt" TIMESTAMP(3);

ALTER TABLE "Broker"
  ADD CONSTRAINT "Broker_priority_range_check"
    CHECK ("priority" BETWEEN 1 AND 9999),
  ADD CONSTRAINT "Broker_founded_year_range_check"
    CHECK ("foundedYear" IS NULL OR "foundedYear" >= 1800),
  ADD CONSTRAINT "Broker_review_ratings_range_check"
    CHECK (
      ("overallRating" IS NULL OR "overallRating" BETWEEN 0 AND 5) AND
      ("trustSafetyRating" IS NULL OR "trustSafetyRating" BETWEEN 0 AND 5) AND
      ("feesRating" IS NULL OR "feesRating" BETWEEN 0 AND 5) AND
      ("researchEducationRating" IS NULL OR "researchEducationRating" BETWEEN 0 AND 5) AND
      ("tradingToolsRating" IS NULL OR "tradingToolsRating" BETWEEN 0 AND 5) AND
      ("tradingPlatformsRating" IS NULL OR "tradingPlatformsRating" BETWEEN 0 AND 5) AND
      ("customerSupportRating" IS NULL OR "customerSupportRating" BETWEEN 0 AND 5) AND
      ("accountTypesRating" IS NULL OR "accountTypesRating" BETWEEN 0 AND 5) AND
      ("specialFeaturesRating" IS NULL OR "specialFeaturesRating" BETWEEN 0 AND 5) AND
      ("accountOpeningRating" IS NULL OR "accountOpeningRating" BETWEEN 0 AND 5)
    );

CREATE INDEX "Broker_priority_status_idx" ON "Broker"("priority", "status");
