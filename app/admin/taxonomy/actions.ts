"use server";

import { TaxonomyStatus, TopicClusterStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminMutation } from "@/lib/admin/session";
import { normalizeSlug } from "@/lib/content";
import { prisma } from "@/lib/db";
import { validateCategoryParent } from "@/lib/taxonomy";

function field(data: FormData, name: string) { return String(data.get(name) ?? "").trim(); }
function fail(view: string, message: string): never { redirect(`/admin/taxonomy?view=${view}&error=${encodeURIComponent(message)}`); }
function done(view: string): never { revalidatePath("/admin/taxonomy"); revalidatePath("/admin/content"); redirect(`/admin/taxonomy?view=${view}&saved=1`); }
function status(value: string) { return Object.values(TaxonomyStatus).includes(value as TaxonomyStatus) ? value as TaxonomyStatus : TaxonomyStatus.ACTIVE; }

export async function saveCategoryAction(data: FormData) {
  await requireAdminMutation(data);
  const id = field(data, "id");
  const marketId = field(data, "marketId");
  const parentId = field(data, "parentId") || null;
  const name = field(data, "name");
  const slug = normalizeSlug(field(data, "slug") || name);
  const description = field(data, "description") || null;
  if (!marketId || !name || !slug) fail("categories", "Market, name and slug are required.");
  try {
    await prisma.$transaction(async (tx) => {
      await validateCategoryParent(tx, { categoryId: id || undefined, marketId, parentId });
      const payload = { marketId, parentId, name, slug, description, status: status(field(data, "status")) };
      if (id) await tx.category.update({ where: { id }, data: payload });
      else await tx.category.create({ data: payload });
    });
  } catch (error) { fail("categories", error instanceof Error ? error.message : "Category could not be saved."); }
  done("categories");
}

export async function saveTopicAction(data: FormData) {
  await requireAdminMutation(data);
  const id = field(data, "id");
  const marketId = field(data, "marketId");
  const topicClusterId = field(data, "topicClusterId") || null;
  const name = field(data, "name");
  const slug = normalizeSlug(field(data, "slug") || name);
  if (!marketId || !name || !slug) fail("topics", "Market, name and slug are required.");
  if (topicClusterId) {
    const [market, cluster] = await Promise.all([prisma.market.findUnique({ where: { id: marketId } }), prisma.topicCluster.findUnique({ where: { id: topicClusterId } })]);
    if (!market || !cluster || cluster.marketId !== marketId || cluster.languageCode !== market.languageCode) fail("topics", "Topic cluster must match the selected market and language.");
  }
  try {
    const payload = { marketId, parentId: null, topicClusterId, name, slug, description: field(data, "description") || null, status: status(field(data, "status")) };
    if (id) await prisma.topic.update({ where: { id }, data: payload });
    else await prisma.topic.create({ data: payload });
  } catch { fail("topics", "Topic could not be saved. Check for a duplicate slug."); }
  done("topics");
}

export async function saveTopicClusterAction(data: FormData) {
  await requireAdminMutation(data);
  const id = field(data, "id");
  const marketId = field(data, "marketId");
  const name = field(data, "name");
  const slug = normalizeSlug(field(data, "slug") || name);
  const selectedStatus = Object.values(TopicClusterStatus).includes(field(data, "status") as TopicClusterStatus) ? field(data, "status") as TopicClusterStatus : TopicClusterStatus.ACTIVE;
  const priorityContentItemId = field(data, "priorityContentItemId") || null;
  const market = await prisma.market.findUnique({ where: { id: marketId } });
  if (!market || !name || !slug) fail("clusters", "Market, name and slug are required.");
  if (priorityContentItemId) {
    if (!id) fail("clusters", "Create the cluster before selecting its priority content.");
    const content = await prisma.contentItem.findUnique({ where: { id: priorityContentItemId }, include: { primaryTopic: true } });
    if (!content || content.marketId !== marketId || content.status !== "PUBLISHED" || (id && content.primaryTopic?.topicClusterId !== id)) fail("clusters", "Priority content must be published in this market and assigned to this cluster.");
  }
  try {
    const payload = { marketId, languageCode: market.languageCode, name, slug, description: field(data, "description") || null, status: selectedStatus, priority: Math.max(0, Number(field(data, "priority")) || 100), priorityContentItemId };
    if (id) await prisma.topicCluster.update({ where: { id }, data: payload });
    else await prisma.topicCluster.create({ data: payload });
  } catch { fail("clusters", "Topic cluster could not be saved. Check for a duplicate slug."); }
  done("clusters");
}

export async function deleteTaxonomyAction(data: FormData) {
  await requireAdminMutation(data);
  const id = field(data, "id");
  const kind = field(data, "kind");
  try {
    if (kind === "category") {
      const item = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { children: true, contentItems: true, primaryContent: true } } } });
      if (!item || item._count.children + item._count.contentItems + item._count.primaryContent > 0) throw new Error();
      await prisma.category.delete({ where: { id } });
      done("categories");
    }
    if (kind === "topic") {
      const item = await prisma.topic.findUnique({ where: { id }, include: { _count: { select: { contentItems: true, primaryContent: true } } } });
      if (!item || item._count.contentItems + item._count.primaryContent > 0) throw new Error();
      await prisma.topic.delete({ where: { id } });
      done("topics");
    }
    if (kind === "cluster") {
      const item = await prisma.topicCluster.findUnique({ where: { id }, include: { _count: { select: { topics: true, anchorTexts: true, internalLinkRules: true } } } });
      if (!item || item._count.topics + item._count.anchorTexts + item._count.internalLinkRules > 0) throw new Error();
      await prisma.topicCluster.delete({ where: { id } });
      done("clusters");
    }
  } catch { fail(kind === "category" ? "categories" : kind === "cluster" ? "clusters" : "topics", "This taxonomy is still in use. Archive it instead."); }
  fail("categories", "Unsupported delete request.");
}
