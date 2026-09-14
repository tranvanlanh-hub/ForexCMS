"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminMutation } from "@/lib/admin/session";
import { revalidatePublicContentCache } from "@/lib/cache/public";
import { prisma } from "@/lib/db";
import { deleteMediaObjects, isStorageConfigured } from "@/lib/storage";

function field(data: FormData, name: string) { return String(data.get(name) ?? "").trim(); }
function fail(message: string): never { redirect(`/admin/media?error=${encodeURIComponent(message)}`); }

export async function updateMediaAction(data: FormData) {
  await requireAdminMutation(data);
  const id = field(data, "id");
  const altText = field(data, "altText").slice(0, 300);
  const caption = field(data, "caption").slice(0, 1000);
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset || asset.status !== "READY") fail("Only ready media can be edited.");
  await prisma.mediaAsset.update({ where: { id }, data: { altText: altText || null, caption: caption || null } });
  revalidatePath("/admin/media"); revalidatePublicContentCache(); redirect("/admin/media?saved=1");
}

export async function deleteMediaAction(data: FormData) {
  await requireAdminMutation(data);
  const id = field(data, "id");
  const asset = await prisma.mediaAsset.findUnique({ where: { id }, include: { variants: true, _count: { select: { featuredContent: true, socialContent: true, brokerLogos: true } } } });
  if (!asset) fail("Media asset was not found.");
  if (asset._count.featuredContent + asset._count.socialContent + asset._count.brokerLogos > 0) fail("This media asset is in use and cannot be deleted.");
  if (!(await isStorageConfigured())) fail("Media storage is not configured, so the object cannot be deleted safely.");
  await prisma.mediaAsset.update({ where: { id }, data: { status: "DELETING", errorMessage: null } });
  try {
    await deleteMediaObjects([asset.storageKey, ...(asset.pendingKey ? [asset.pendingKey] : []), ...asset.variants.map(item => item.storageKey)]);
    await prisma.mediaAsset.update({ where: { id }, data: { status: "DELETED", deletedAt: new Date(), pendingKey: null } });
  } catch (error) {
    await prisma.mediaAsset.update({ where: { id }, data: { errorMessage: error instanceof Error ? error.message.slice(0, 240) : "Object deletion failed." } });
    fail("Object deletion failed. The asset remains in deleting state and can be retried.");
  }
  revalidatePath("/admin/media"); revalidatePublicContentCache(); redirect("/admin/media?deleted=1");
}
