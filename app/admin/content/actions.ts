"use server";

import {
  ContentStatus,
  ContentType,
  RobotsIndex,
  type Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canBulkChangeContentStatus, normalizeAdminRole } from "@/lib/admin/auth";
import { revalidatePublicContentCache } from "@/lib/cache/public";
import {
  extractAffiliateTokensFromText,
  normalizeCampaignToken,
  resolveAffiliateUrl,
} from "@/lib/affiliate";
import { prisma } from "@/lib/db";
import { validateRequiredTemplateBlocks } from "@/lib/content/blocks";
import {
  buildContentCanonicalPath,
  normalizeSlug,
  toMarkdownBody,
  validateContentForSave,
} from "@/lib/content";

const allowedStatuses = new Set<ContentStatus>([
  ContentStatus.DRAFT,
  ContentStatus.REVIEW,
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
  translationGroupId: string | null;
  title: string;
  slug: string;
  contentType: ContentType;
  status: ContentStatus;
  body: Prisma.InputJsonObject;
  canonicalPath: string;
  authorName: string | null;
  reviewerName: string | null;
  publishedAt: Date | null;
};

type SeoWriteData = Omit<
  Prisma.SeoMetadataUncheckedCreateInput,
  "id" | "contentItemId" | "brokerId" | "createdAt" | "updatedAt"
>;

type ContentWriteInput =
  | { errors: string[] }
  | { brokerIds: string[]; contentData: ContentWriteData; seoData: SeoWriteData };

function asStringArray(value: Prisma.JsonValue | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function campaignForCtaSlot(slot: string) {
  return slot === "top" ? "review_top_cta" : `review_${slot}_cta`;
}

async function buildWriteInput(
  formData: FormData,
  existingContentId?: string,
): Promise<ContentWriteInput> {
  const title = field(formData, "title");
  const slug = normalizeSlug(field(formData, "slug"));
  const marketId = field(formData, "marketId");
  const templateId = field(formData, "templateId");
  const translationGroupKey = normalizeSlug(field(formData, "translationGroupKey"));
  const contentType = asContentType(formData.get("contentType"));
  const status = asContentStatus(formData.get("status"));
  const markdown = field(formData, "body");
  const seoTitle = field(formData, "seoTitle");
  const metaDescription = field(formData, "metaDescription");
  const authorName = field(formData, "authorName");
  const reviewerName = field(formData, "reviewerName");
  const brokerIds = formData
    .getAll("brokerIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

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
  if (status === ContentStatus.PUBLISHED && market?.status !== "ACTIVE") {
    errors.push("Selected market must be active before publishing.");
  }
  if (status === ContentStatus.PUBLISHED && template?.isActive !== true) {
    errors.push("Selected template must be active before publishing.");
  }

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

  if (status === ContentStatus.PUBLISHED) {
    errors.push(
      ...validateRequiredTemplateBlocks({
        markdown,
        requiredBlocks: template.requiredBlocks,
        template,
      }),
    );
  }

  const duplicate = await prisma.contentItem.findFirst({
    where: {
      OR: [
        { marketId, contentType, slug },
        { canonicalPath },
      ],
      ...(existingContentId ? { NOT: { id: existingContentId } } : {}),
    },
    select: { id: true },
  });

  if (duplicate) {
    errors.push("Slug or canonical path already exists for this market and type.");
  }

  const ctaSlots = asStringArray(template.ctaSlots);

  if (status === ContentStatus.PUBLISHED && ctaSlots.length > 0) {
    if (brokerIds.length === 0) {
      errors.push("Select at least one broker before publishing a CTA template.");
    } else {
      const brokers = await prisma.broker.findMany({
        where: { id: { in: brokerIds }, status: "ACTIVE" },
        select: { slug: true },
      });

      if (brokers.length !== brokerIds.length) {
        errors.push("Published CTA content can only use active brokers.");
      }

      for (const broker of brokers) {
        for (const slot of ctaSlots) {
          const resolved = await resolveAffiliateUrl({
            broker: broker.slug,
            market: market.code,
            language: market.languageCode,
            campaign: campaignForCtaSlot(slot),
          });

          if (!resolved) {
            errors.push(
              `Missing active affiliate link for ${broker.slug}:${normalizeCampaignToken(
                campaignForCtaSlot(slot),
              )} in ${market.code}/${market.languageCode}.`,
            );
          }
        }
      }
    }
  }

  for (const token of extractAffiliateTokensFromText(markdown)) {
    const resolved = await resolveAffiliateUrl({
      broker: token.broker,
      market: token.market || market.code,
      language: token.language || market.languageCode,
      campaign: token.campaign,
    });

    if (!resolved) {
      errors.push(
        `Affiliate token is invalid or inactive: ${token.broker}:${token.campaign}.`,
      );
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  const existing = existingContentId
    ? await prisma.contentItem.findUnique({
        where: { id: existingContentId },
        select: { publishedAt: true },
      })
    : null;
  const now = new Date();
  const translationGroup = translationGroupKey
    ? await prisma.contentTranslationGroup.upsert({
        where: { key: translationGroupKey },
        update: {},
        create: {
          key: translationGroupKey,
          name: title,
        },
      })
    : null;
  const contentData = {
    marketId,
    templateId,
    translationGroupId: translationGroup?.id ?? null,
    title,
    slug,
    contentType,
    status,
    body: toMarkdownBody(markdown, template),
    canonicalPath,
    authorName: authorName || null,
    reviewerName: reviewerName || null,
    publishedAt:
      status === ContentStatus.PUBLISHED ? (existing?.publishedAt ?? now) : null,
  };

  const seoData = {
    marketId,
    title: seoTitle || title,
    description: metaDescription,
    canonicalPath,
    robotsIndex: RobotsIndex.INDEX,
    robotsFollow: true,
  };

  return { brokerIds, contentData, seoData };
}

export async function createContentAction(formData: FormData) {
  const input = await buildWriteInput(formData);

  if ("errors" in input) {
    redirectWithError("/admin/content/new", input.errors);
  }

  try {
    const item = await prisma.$transaction(async (tx) => {
      const createdItem = await tx.contentItem.create({
        data: {
          ...input.contentData,
          brokers: input.brokerIds.length
            ? { connect: input.brokerIds.map((id) => ({ id })) }
            : undefined,
        },
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
    revalidatePublicContentCache();
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

  const input = await buildWriteInput(formData, id);

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
        data: {
          ...input.contentData,
          brokers: { set: input.brokerIds.map((brokerId) => ({ id: brokerId })) },
        },
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
    revalidatePublicContentCache();
    redirect(`${editPath}?saved=1`);
  } catch {
    redirectWithError(editPath, [
      "Content could not be updated. Check for duplicate slug or canonical path.",
    ]);
  }
}

const bulkStatuses = new Set<ContentStatus>([
  ContentStatus.DRAFT,
  ContentStatus.REVIEW,
  ContentStatus.ARCHIVED,
]);

export async function bulkUpdateContentStatusAction(formData: FormData) {
  const selectedIds = formData
    .getAll("contentId")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .slice(0, 100);
  const status = asContentStatus(formData.get("bulkStatus"));
  const returnPath = field(formData, "returnPath") || "/admin/content";
  const adminRole = normalizeAdminRole(
    (await headers()).get("x-forexcms-admin-role"),
  );

  if (!canBulkChangeContentStatus(adminRole)) {
    redirectWithError(returnPath, ["This admin role cannot bulk update content."]);
  }

  if (selectedIds.length === 0) {
    redirectWithError(returnPath, ["Select at least one content item."]);
  }

  if (!bulkStatuses.has(status)) {
    redirectWithError(returnPath, [
      "Bulk publish is disabled. Use the edit screen so publish validation can run.",
    ]);
  }

  await prisma.contentItem.updateMany({
    where: { id: { in: selectedIds } },
    data: {
      status,
      publishedAt: status === ContentStatus.ARCHIVED ? null : undefined,
    },
  });

  revalidatePath("/admin/content");
  revalidatePublicContentCache();
  redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}bulkSaved=1`);
}
