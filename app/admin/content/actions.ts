"use server";

import {
  ContentStatus,
  ContentType,
  RobotsIndex,
  type Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  buildContentCanonicalPath,
  normalizeSlug,
  toMarkdownBody,
  validateContentForSave,
} from "@/lib/content";

const allowedStatuses = new Set<ContentStatus>([
  ContentStatus.DRAFT,
  ContentStatus.PUBLISHED,
  ContentStatus.ARCHIVED,
]);

function asContentType(value: FormDataEntryValue | null): ContentType | "" {
  return Object.values(ContentType).includes(value as ContentType)
    ? (value as ContentType)
    : "";
}

function asContentStatus(value: FormDataEntryValue | null): ContentStatus {
  return allowedStatuses.has(value as ContentStatus)
    ? (value as ContentStatus)
    : ContentStatus.DRAFT;
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function redirectWithError(path: string, errors: string[]): never {
  const message = encodeURIComponent(errors.join(" "));
  redirect(`${path}?error=${message}`);
}

type ContentWriteData = {
  marketId: string;
  templateId: string;
  title: string;
  slug: string;
  contentType: ContentType;
  status: ContentStatus;
  body: Prisma.InputJsonObject;
  canonicalPath: string;
  publishedAt: Date | null;
};

type SeoWriteData = Omit<
  Prisma.SeoMetadataUncheckedCreateInput,
  "id" | "contentItemId" | "brokerId" | "createdAt" | "updatedAt"
>;

type ContentWriteInput =
  | { errors: string[] }
  | { contentData: ContentWriteData; seoData: SeoWriteData };

async function buildWriteInput(formData: FormData): Promise<ContentWriteInput> {
  const title = field(formData, "title");
  const slug = normalizeSlug(field(formData, "slug"));
  const marketId = field(formData, "marketId");
  const templateId = field(formData, "templateId");
  const contentType = asContentType(formData.get("contentType"));
  const status = asContentStatus(formData.get("status"));
  const markdown = field(formData, "body");
  const seoTitle = field(formData, "seoTitle");
  const metaDescription = field(formData, "metaDescription");

  const errors = validateContentForSave({
    title,
    slug,
    marketId,
    templateId,
    contentType,
    status,
    markdown,
    seoTitle,
    metaDescription,
  });

  if (!marketId) errors.push("Market is required to build a safe URL.");
  if (!templateId) errors.push("Template is required.");
  if (!contentType) errors.push("Content type is required.");
  if (!title) errors.push("Title is required.");
  if (!slug) errors.push("Slug is required.");

  if (errors.length > 0 || !contentType) {
    return { errors };
  }

  const [market, template] = await Promise.all([
    prisma.market.findUnique({ where: { id: marketId } }),
    prisma.template.findUnique({ where: { id: templateId } }),
  ]);

  if (!market) errors.push("Selected market was not found.");
  if (!template) errors.push("Selected template was not found.");

  if (errors.length > 0 || !market || !template) {
    return { errors };
  }

  const canonicalPath = buildContentCanonicalPath({
    marketCode: market.code,
    contentType,
    slug,
  });

  if (!canonicalPath || canonicalPath === `/${slug}/`) {
    errors.push("Canonical path must include market and content type.");
  }

  if (errors.length > 0) {
    return { errors };
  }

  const now = new Date();
  const contentData = {
    marketId,
    templateId,
    title,
    slug,
    contentType,
    status,
    body: toMarkdownBody(markdown),
    canonicalPath,
    publishedAt: status === ContentStatus.PUBLISHED ? now : null,
  };

  const seoData = {
    marketId,
    title: seoTitle || title,
    description: metaDescription,
    canonicalPath,
    robotsIndex: RobotsIndex.INDEX,
    robotsFollow: true,
  };

  return { contentData, seoData };
}

export async function createContentAction(formData: FormData) {
  const input = await buildWriteInput(formData);

  if ("errors" in input) {
    redirectWithError("/admin/content/new", input.errors);
  }

  try {
    const item = await prisma.$transaction(async (tx) => {
      const createdItem = await tx.contentItem.create({
        data: input.contentData,
      });

      await tx.seoMetadata.create({
        data: {
          ...input.seoData,
          contentItemId: createdItem.id,
        },
      });

      await tx.contentRevision.create({
        data: {
          contentItemId: createdItem.id,
            revisionNumber: 1,
            title: input.contentData.title,
            body: input.contentData.body,
            status: input.contentData.status,
        },
      });

      return createdItem;
    });

    revalidatePath("/admin/content");
    redirect(`/admin/content/${item.id}/edit?saved=1`);
  } catch {
    redirectWithError("/admin/content/new", [
      "Content could not be saved. Check for duplicate slug or canonical path.",
    ]);
  }
}

export async function updateContentAction(formData: FormData) {
  const id = field(formData, "id");
  const editPath = `/admin/content/${id}/edit`;

  if (!id) {
    redirectWithError("/admin/content", ["Content ID is missing."]);
  }

  const input = await buildWriteInput(formData);

  if ("errors" in input) {
    redirectWithError(editPath, input.errors);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const latestRevision = await tx.contentRevision.findFirst({
        where: { contentItemId: id },
        orderBy: { revisionNumber: "desc" },
        select: { revisionNumber: true },
      });

      await tx.contentItem.update({
        where: { id },
        data: input.contentData,
      });

      await tx.seoMetadata.upsert({
        where: { contentItemId: id },
        create: {
          ...input.seoData,
          contentItemId: id,
        },
        update: input.seoData,
      });

      await tx.contentRevision.create({
        data: {
          contentItemId: id,
          revisionNumber: (latestRevision?.revisionNumber ?? 0) + 1,
          title: input.contentData.title,
          body: input.contentData.body,
          status: input.contentData.status,
        },
      });
    });

    revalidatePath("/admin/content");
    revalidatePath(editPath);
    redirect(`${editPath}?saved=1`);
  } catch {
    redirectWithError(editPath, [
      "Content could not be updated. Check for duplicate slug or canonical path.",
    ]);
  }
}
