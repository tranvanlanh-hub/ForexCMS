-- Add translation groups so related localized content can produce safe hreflang maps.
CREATE TABLE "ContentTranslationGroup" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTranslationGroup_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ContentItem"
ADD COLUMN "translationGroupId" TEXT;

CREATE UNIQUE INDEX "ContentTranslationGroup_key_key"
ON "ContentTranslationGroup"("key");

CREATE UNIQUE INDEX "ContentItem_translationGroupId_marketId_key"
ON "ContentItem"("translationGroupId", "marketId");

CREATE INDEX "ContentItem_translationGroupId_idx"
ON "ContentItem"("translationGroupId");

ALTER TABLE "ContentItem"
ADD CONSTRAINT "ContentItem_translationGroupId_fkey"
FOREIGN KEY ("translationGroupId") REFERENCES "ContentTranslationGroup"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
