CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'READY', 'ERROR', 'DELETING', 'DELETED');
CREATE TYPE "MediaKind" AS ENUM ('IMAGE');

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE',
  "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
  "yyyymm" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "pendingKey" TEXT,
  "originalFilename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "extension" TEXT NOT NULL,
  "sizeBytes" BIGINT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "etag" TEXT,
  "altText" TEXT,
  "caption" TEXT,
  "createdBy" TEXT,
  "errorMessage" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaVariant" (
  "id" TEXT NOT NULL,
  "mediaAssetId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" BIGINT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaVariant_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ContentItem" ADD COLUMN "featuredMediaId" TEXT;
ALTER TABLE "ContentItem" ADD COLUMN "socialMediaId" TEXT;
ALTER TABLE "Broker" ADD COLUMN "logoMediaId" TEXT;

CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE UNIQUE INDEX "MediaAsset_pendingKey_key" ON "MediaAsset"("pendingKey");
CREATE INDEX "MediaAsset_status_createdAt_idx" ON "MediaAsset"("status", "createdAt");
CREATE INDEX "MediaAsset_yyyymm_status_idx" ON "MediaAsset"("yyyymm", "status");
CREATE INDEX "MediaAsset_mimeType_idx" ON "MediaAsset"("mimeType");
CREATE INDEX "MediaAsset_originalFilename_idx" ON "MediaAsset"("originalFilename");
CREATE UNIQUE INDEX "MediaVariant_storageKey_key" ON "MediaVariant"("storageKey");
CREATE UNIQUE INDEX "MediaVariant_mediaAssetId_name_key" ON "MediaVariant"("mediaAssetId", "name");
CREATE INDEX "MediaVariant_mediaAssetId_idx" ON "MediaVariant"("mediaAssetId");
CREATE INDEX "ContentItem_featuredMediaId_idx" ON "ContentItem"("featuredMediaId");
CREATE INDEX "ContentItem_socialMediaId_idx" ON "ContentItem"("socialMediaId");
CREATE INDEX "Broker_logoMediaId_idx" ON "Broker"("logoMediaId");

ALTER TABLE "MediaVariant" ADD CONSTRAINT "MediaVariant_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_featuredMediaId_fkey" FOREIGN KEY ("featuredMediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_socialMediaId_fkey" FOREIGN KEY ("socialMediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Broker" ADD CONSTRAINT "Broker_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
