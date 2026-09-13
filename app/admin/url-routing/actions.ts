"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminMutation } from "@/lib/admin/session";
import { revalidatePublicContentCache } from "@/lib/cache/public";
import { prisma } from "@/lib/db";
import { normalizeContentPath } from "@/lib/routing/content-urls";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function fail(message: string): never {
  redirect(`/admin/url-routing?error=${encodeURIComponent(message)}`);
}

export async function createContentAliasAction(formData: FormData) {
  await requireAdminMutation(formData);
  const contentItemId = field(formData, "contentItemId");
  const path = normalizeContentPath(field(formData, "path"));
  if (!contentItemId || !path) fail("Enter a valid internal content path with three segments.");

  const content = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: { market: true },
  });
  if (!content) fail("Target content was not found.");
  const [, market, contentType] = content.canonicalPath.split("/");
  if (!path.startsWith(`/${market}/${contentType}/`)) {
    fail("The alias must use the same market and content type as its target.");
  }
  if (path === content.canonicalPath) fail("The canonical URL cannot be added as an alias.");

  const currentOwner = await prisma.contentItem.findUnique({
    where: { canonicalPath: path },
    select: { id: true },
  });
  if (currentOwner) fail("That path is a current canonical URL.");

  try {
    await prisma.contentUrl.create({
      data: {
        path,
        contentItemId: content.id,
        marketId: content.marketId,
        publishedOnce: true,
        source: "MANUAL",
      },
    });
  } catch {
    fail("That path is already owned by content or redirect history.");
  }

  revalidatePath("/admin/url-routing");
  revalidatePublicContentCache();
  redirect("/admin/url-routing?saved=1");
}

export async function toggleContentAliasAction(formData: FormData) {
  await requireAdminMutation(formData);
  const id = field(formData, "id");
  const item = await prisma.contentUrl.findUnique({
    where: { id },
    include: { contentItem: { select: { canonicalPath: true } } },
  });
  if (!item) fail("URL record was not found.");
  if (item.path === item.contentItem.canonicalPath) fail("The canonical URL cannot be disabled.");

  await prisma.contentUrl.update({
    where: { id },
    data: { redirectEnabled: !item.redirectEnabled },
  });
  revalidatePath("/admin/url-routing");
  revalidatePublicContentCache();
  redirect("/admin/url-routing?saved=1");
}
