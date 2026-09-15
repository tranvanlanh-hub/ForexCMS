CREATE TABLE "BrokerReviewAssessment" (
  "id" TEXT NOT NULL,
  "brokerId" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "regulationTrustScore" DECIMAL(2,1),
  "regulationTrustRationale" TEXT,
  "costsScore" DECIMAL(2,1),
  "costsRationale" TEXT,
  "tradingExperienceScore" DECIMAL(2,1),
  "tradingExperienceRationale" TEXT,
  "depositsWithdrawalsScore" DECIMAL(2,1),
  "depositsWithdrawalsRationale" TEXT,
  "supportEducationScore" DECIMAL(2,1),
  "supportEducationRationale" TEXT,
  "reviewerName" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "methodologyVersion" TEXT NOT NULL DEFAULT 'broker-review-v1',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BrokerReviewAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BrokerReviewAssessment_score_range_check" CHECK (
    ("regulationTrustScore" IS NULL OR "regulationTrustScore" BETWEEN 0 AND 5) AND
    ("costsScore" IS NULL OR "costsScore" BETWEEN 0 AND 5) AND
    ("tradingExperienceScore" IS NULL OR "tradingExperienceScore" BETWEEN 0 AND 5) AND
    ("depositsWithdrawalsScore" IS NULL OR "depositsWithdrawalsScore" BETWEEN 0 AND 5) AND
    ("supportEducationScore" IS NULL OR "supportEducationScore" BETWEEN 0 AND 5)
  ),
  CONSTRAINT "BrokerReviewAssessment_scored_reviewer_check" CHECK (
    (
      "regulationTrustScore" IS NULL AND
      "costsScore" IS NULL AND
      "tradingExperienceScore" IS NULL AND
      "depositsWithdrawalsScore" IS NULL AND
      "supportEducationScore" IS NULL
    ) OR ("reviewerName" IS NOT NULL AND "reviewedAt" IS NOT NULL)
  ),
  CONSTRAINT "BrokerReviewAssessment_methodology_version_check"
    CHECK ("methodologyVersion" = 'broker-review-v1')
);

CREATE UNIQUE INDEX "BrokerReviewAssessment_brokerId_marketId_key"
  ON "BrokerReviewAssessment"("brokerId", "marketId");
CREATE INDEX "BrokerReviewAssessment_marketId_brokerId_idx"
  ON "BrokerReviewAssessment"("marketId", "brokerId");

ALTER TABLE "BrokerReviewAssessment"
  ADD CONSTRAINT "BrokerReviewAssessment_brokerId_fkey"
  FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrokerReviewAssessment"
  ADD CONSTRAINT "BrokerReviewAssessment_marketId_fkey"
  FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
