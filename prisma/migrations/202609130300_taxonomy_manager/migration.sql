CREATE TYPE "TaxonomyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

ALTER TABLE "Category" ADD COLUMN "status" "TaxonomyStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Topic" ADD COLUMN "status" "TaxonomyStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "Category_marketId_parentId_status_name_idx"
  ON "Category"("marketId", "parentId", "status", "name");
CREATE INDEX "Topic_marketId_topicClusterId_status_name_idx"
  ON "Topic"("marketId", "topicClusterId", "status", "name");
