-- CreateEnum
CREATE TYPE "BrokerFactCategory" AS ENUM (
  'REGULATION_LICENSE',
  'MINIMUM_DEPOSIT',
  'SPREAD',
  'LEVERAGE',
  'PLATFORM',
  'ACCOUNT_TYPE',
  'PAYMENT_METHOD',
  'SUPPORT_LANGUAGE',
  'RESTRICTED_COUNTRY',
  'OTHER'
);

-- CreateTable
CREATE TABLE "BrokerFact" (
  "id" TEXT NOT NULL,
  "brokerId" TEXT NOT NULL,
  "marketId" TEXT,
  "category" "BrokerFactCategory" NOT NULL,
  "label" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "unit" TEXT,
  "appliesTo" TEXT,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "citationText" TEXT,
  "sourceRetrievedAt" TIMESTAMP(3),
  "displayOrder" INTEGER NOT NULL DEFAULT 100,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BrokerFact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerFact_brokerId_marketId_category_label_value_key"
ON "BrokerFact"("brokerId", "marketId", "category", "label", "value");

-- CreateIndex
CREATE INDEX "BrokerFact_brokerId_category_idx" ON "BrokerFact"("brokerId", "category");

-- CreateIndex
CREATE INDEX "BrokerFact_marketId_category_idx" ON "BrokerFact"("marketId", "category");

-- CreateIndex
CREATE INDEX "BrokerFact_sourceUrl_idx" ON "BrokerFact"("sourceUrl");

-- AddForeignKey
ALTER TABLE "BrokerFact"
ADD CONSTRAINT "BrokerFact_brokerId_fkey"
FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerFact"
ADD CONSTRAINT "BrokerFact_marketId_fkey"
FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;
