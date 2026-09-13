CREATE TYPE "ContentUrlSource" AS ENUM ('CONTENT', 'MANUAL');

CREATE TABLE "ContentUrl" (
  "id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "contentItemId" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "publishedOnce" BOOLEAN NOT NULL DEFAULT false,
  "redirectEnabled" BOOLEAN NOT NULL DEFAULT true,
  "source" "ContentUrlSource" NOT NULL DEFAULT 'CONTENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentUrl_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentUrl_path_key" ON "ContentUrl"("path");
CREATE INDEX "ContentUrl_contentItemId_createdAt_idx" ON "ContentUrl"("contentItemId", "createdAt");
CREATE INDEX "ContentUrl_marketId_redirectEnabled_idx" ON "ContentUrl"("marketId", "redirectEnabled");

ALTER TABLE "ContentUrl" ADD CONSTRAINT "ContentUrl_contentItemId_fkey"
  FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContentUrl" ADD CONSTRAINT "ContentUrl_marketId_fkey"
  FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "ContentUrl" (
  "id", "path", "contentItemId", "marketId", "publishedOnce",
  "redirectEnabled", "source", "createdAt", "updatedAt"
)
SELECT
  'curl_' || md5(c."id" || ':' || c."canonicalPath"),
  c."canonicalPath",
  c."id",
  c."marketId",
  CASE
    WHEN c."status" = 'PUBLISHED' OR EXISTS (
      SELECT 1 FROM "ContentRevision" r
      WHERE r."contentItemId" = c."id" AND r."status" = 'PUBLISHED'
    ) THEN true ELSE false
  END,
  true,
  'CONTENT'::"ContentUrlSource",
  c."createdAt",
  CURRENT_TIMESTAMP
FROM "ContentItem" c;
