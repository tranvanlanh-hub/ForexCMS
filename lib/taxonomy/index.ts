import { TaxonomyStatus, TopicClusterStatus, type Prisma } from "@prisma/client";

export const taxonomyStatusLabels: Record<TaxonomyStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

export async function validateCategoryParent(
  tx: Prisma.TransactionClient,
  input: { categoryId?: string; marketId: string; parentId: string | null },
) {
  if (!input.parentId) return;
  if (input.parentId === input.categoryId) throw new Error("A category cannot be its own parent.");

  const parent = await tx.category.findUnique({
    where: { id: input.parentId },
    include: { parent: { include: { parent: true } } },
  });
  if (!parent || parent.marketId !== input.marketId) throw new Error("Parent category must be in the same market.");
  if (parent.parent?.parent) throw new Error("Categories are limited to three levels.");

  if (input.categoryId) {
    const descendants = await tx.category.findMany({
      where: { OR: [{ parentId: input.categoryId }, { parent: { parentId: input.categoryId } }] },
      select: { id: true, parentId: true },
    });
    if (descendants.some((item) => item.id === input.parentId)) throw new Error("A descendant cannot become the parent.");
    const subtreeHeight = descendants.some((item) => item.parentId !== input.categoryId) ? 3 : descendants.length ? 2 : 1;
    const parentDepth = parent.parent ? 2 : 1;
    if (parentDepth + subtreeHeight > 3) throw new Error("Moving this branch would exceed three levels.");
  }
}

export async function validateContentTaxonomy(
  tx: Prisma.TransactionClient,
  input: {
    marketId: string;
    categoryIds: string[];
    topicIds: string[];
    primaryCategoryId: string | null;
    primaryTopicId: string | null;
    requirePrimaryCategory: boolean;
  },
) {
  const categoryIds = [...new Set([...input.categoryIds, ...(input.primaryCategoryId ? [input.primaryCategoryId] : [])])].slice(0, 10);
  const topicIds = [...new Set([...input.topicIds, ...(input.primaryTopicId ? [input.primaryTopicId] : [])])].slice(0, 20);
  const [categories, topics] = await Promise.all([
    tx.category.findMany({ where: { id: { in: categoryIds } } }),
    tx.topic.findMany({ where: { id: { in: topicIds } }, include: { topicCluster: true } }),
  ]);
  if (categories.length !== categoryIds.length || categories.some((item) => item.marketId !== input.marketId)) throw new Error("Categories must exist in the selected market.");
  if (topics.length !== topicIds.length || topics.some((item) => item.marketId !== input.marketId)) throw new Error("Topics must exist in the selected market.");
  if (input.requirePrimaryCategory && !input.primaryCategoryId) throw new Error("Primary category is required before publishing.");
  const primaryCategory = categories.find((item) => item.id === input.primaryCategoryId);
  if (input.requirePrimaryCategory && primaryCategory?.status !== TaxonomyStatus.ACTIVE) throw new Error("Primary category must be active before publishing.");
  const primaryTopic = topics.find((item) => item.id === input.primaryTopicId);
  if (input.primaryTopicId && (primaryTopic?.status !== TaxonomyStatus.ACTIVE || primaryTopic.topicCluster?.status !== TopicClusterStatus.ACTIVE)) throw new Error("Primary topic must be active and belong to an active cluster before publishing.");
  return { categoryIds, topicIds };
}
