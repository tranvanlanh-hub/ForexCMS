"use server";

import {
  ContentStatus,
  ContentType,
  RobotsIndex,
  type Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canBulkChangeContentStatus } from "@/lib/admin/auth";
import { requireAdminMutation } from "@/lib/admin/session";
import { revalidatePublicContentCache } from "@/lib/cache/public";
import {
  extractAffiliateTokensFromText,
  normalizeCampaignToken,
  resolveAffiliateUrl,
} from "@/lib/affiliate";
import { prisma } from "@/lib/db";
import {
  buildDefaultMetaDescription,
  buildContentCanonicalPath,
  normalizeSlug,
  toMarkdownBody,
  validateBrokerReviewVerdict,
  validateContentForSave,
} from "@/lib/content";
import { claimContentUrl, releaseUnpublishedContentUrl } from "@/lib/routing/content-urls";
import { getBrokerReviewStructureWarnings } from "@/lib/brokers/review";
import { validateContentTaxonomy } from "@/lib/taxonomy";
import { logEvent } from "@/lib/observability/logging";

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
  summary: string | null;
  slug: string;
  contentType: ContentType;
  status: ContentStatus;
  body: Prisma.InputJsonObject;
  canonicalPath: string;
  authorName: string | null;
  reviewerName: string | null;
  publishedAt: Date | null;
  primaryCategoryId: string | null;
  primaryTopicId: string | null;
  featuredMediaId: string | null;
  socialMediaId: string | null;
};

type SeoWriteData = Omit<
  Prisma.SeoMetadataUncheckedCreateInput,
  "id" | "contentItemId" | "brokerId" | "createdAt" | "updatedAt"
>;

type ContentWriteInput =
  | { errors: string[] }
  | { brokerIds: string[]; categoryIds: string[]; topicIds: string[]; warnings: string[]; contentData: ContentWriteData; seoData: SeoWriteData };

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
  const summary = field(formData, "summary");
  const requestedSlug = normalizeSlug(field(formData, "slug") || title) || `content-${crypto.randomUUID().slice(0, 8)}`;
  let marketId = field(formData, "marketId");
  let templateId = field(formData, "templateId");
  const translationGroupKey = normalizeSlug(field(formData, "translationGroupKey"));
  const contentType = asContentType(formData.get("contentType")) || ContentType.ARTICLE;
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
  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
  const topicIds = formData.getAll("topicIds").map(String).filter(Boolean);
  const primaryCategoryId = field(formData, "primaryCategoryId") || null;
  const primaryTopicId = field(formData, "primaryTopicId") || null;
  const featuredMediaId = field(formData, "featuredMediaId") || null;
  const socialMediaId = field(formData, "socialMediaId") || null;

  const warnings: string[] = [];
  const errors = validateContentForSave({
    title,
    slug: requestedSlug,
    marketId,
    templateId,
    contentType,
    status,
    markdown,
    seoTitle,
    metaDescription,
  });

  if (summary.length > 500) errors.push("Verdict must be 500 characters or less.");
  if (status === ContentStatus.PUBLISHED && contentType === ContentType.BROKER_REVIEW) {
    errors.push(...validateBrokerReviewVerdict(summary));
  }

  if (errors.length > 0) {
    return { errors };
  }

  const [selectedMarket, selectedTemplate] = await Promise.all([
    marketId ? prisma.market.findUnique({ where: { id: marketId } }) : null,
    templateId ? prisma.template.findUnique({ where: { id: templateId } }) : null,
  ]);
  const market = selectedMarket ?? await prisma.market.findFirst({
    where: { status: "ACTIVE" },
    orderBy: [{ isGlobal: "desc" }, { code: "asc" }],
  });
  const template = selectedTemplate && String(selectedTemplate.kind) === String(contentType)
    ? selectedTemplate
    : await prisma.template.findFirst({
        where: { kind: contentType, isActive: true },
        orderBy: { name: "asc" },
      });

  marketId = market?.id ?? "";
  templateId = template?.id ?? "";

  if (!market) errors.push("Selected market was not found.");
  if (!template) errors.push("Selected template was not found.");
  if (status === ContentStatus.PUBLISHED && market?.status !== "ACTIVE") {
    errors.push("Selected market must be active before publishing.");
  }
  if (status === ContentStatus.PUBLISHED && template?.isActive !== true) {
    errors.push("Selected template must be active before publishing.");
  }
  const selectedMediaIds = [...new Set([featuredMediaId, socialMediaId].filter((id): id is string => Boolean(id)))];
  if (selectedMediaIds.length) {
    const readyMedia = await prisma.mediaAsset.count({ where: { id: { in: selectedMediaIds }, status: "READY" } });
    if (readyMedia !== selectedMediaIds.length) errors.push("Selected content images must be ready media assets.");
  }

  if (errors.length > 0 || !market || !template) {
    return { errors };
  }

  let slug = requestedSlug;
  let canonicalPath = buildContentCanonicalPath({
    marketCode: market.code,
    contentType,
    slug,
  });

  if (!canonicalPath || canonicalPath === `/${slug}/`) {
    errors.push("Canonical path must include market and content type.");
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
    if (!existingContentId && requestedSlug === normalizeSlug(title)) {
      let uniqueSlugFound = false;
      for (let suffix = 2; suffix <= 999; suffix += 1) {
        const candidateSlug = `${requestedSlug}-${suffix}`;
        const candidatePath = buildContentCanonicalPath({ marketCode: market.code, contentType, slug: candidateSlug });
        const conflict = await prisma.contentItem.findFirst({
          where: { OR: [{ marketId, contentType, slug: candidateSlug }, { canonicalPath: candidatePath }] },
          select: { id: true },
        });
        if (!conflict) {
          slug = candidateSlug;
          canonicalPath = candidatePath;
          uniqueSlugFound = true;
          break;
        }
      }
      if (!uniqueSlugFound) errors.push("Could not generate a unique URL slug.");
    } else {
      errors.push("Slug or canonical path already exists for this market and type.");
    }
  }

  const ownedUrl = await prisma.contentUrl.findUnique({
    where: { path: canonicalPath },
    select: { contentItemId: true },
  });
  if (ownedUrl && ownedUrl.contentItemId !== existingContentId) {
    errors.push("This URL belongs to another content item or its redirect history.");
  }

  const ctaSlots = asStringArray(template.ctaSlots);

  if (contentType === ContentType.BROKER_REVIEW) {
    if (brokerIds.length === 0) warnings.push("Broker review has no attached broker; public evidence and offers will be unavailable.");
    warnings.push(...getBrokerReviewStructureWarnings(markdown));
  }

  if (
    status === ContentStatus.PUBLISHED &&
    contentType !== ContentType.BROKER_REVIEW &&
    ctaSlots.length > 0 &&
    brokerIds.length > 0
  ) {
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
    summary: summary || null,
    slug,
    contentType,
    status,
    body: toMarkdownBody(markdown, template),
    canonicalPath,
    authorName: authorName || null,
    reviewerName: reviewerName || null,
    publishedAt:
      status === ContentStatus.PUBLISHED ? (existing?.publishedAt ?? now) : null,
    primaryCategoryId,
    primaryTopicId,
    featuredMediaId,
    socialMediaId,
  };

  const seoData = {
    marketId,
    title: seoTitle || title,
    description: metaDescription || buildDefaultMetaDescription(markdown),
    canonicalPath,
    robotsIndex: RobotsIndex.INDEX,
    robotsFollow: true,
  };

  return { brokerIds, categoryIds, topicIds, warnings, contentData, seoData };
}

export async function createContentAction(
  formData: FormData,
): Promise<void> {
  await requireAdminMutation(formData);
  const input = await buildWriteInput(formData);

  if ("errors" in input) {
    redirectWithError("/admin/content/new", input.errors);
  }

  let createdItemId = "";
  try {
    const item = await prisma.$transaction(async (tx) => {
      const taxonomy = await validateContentTaxonomy(tx, {
        marketId: input.contentData.marketId,
        categoryIds: input.categoryIds,
        topicIds: input.topicIds,
        primaryCategoryId: input.contentData.primaryCategoryId,
        primaryTopicId: input.contentData.primaryTopicId,
        requirePrimaryCategory: false,
      });
      const createdItem = await tx.contentItem.create({
        data: {
          ...input.contentData,
          brokers: input.brokerIds.length
            ? { connect: input.brokerIds.map((id) => ({ id })) }
            : undefined,
          categories: taxonomy.categoryIds.length ? { connect: taxonomy.categoryIds.map((id) => ({ id })) } : undefined,
          topics: taxonomy.topicIds.length ? { connect: taxonomy.topicIds.map((id) => ({ id })) } : undefined,
        },
      });

      await claimContentUrl(tx, {
        contentItemId: createdItem.id,
        marketId: createdItem.marketId,
        path: createdItem.canonicalPath,
        published: createdItem.status === ContentStatus.PUBLISHED,
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
            summary: input.contentData.summary,
            body: input.contentData.body,
            status: input.contentData.status,
        },
      });

      return createdItem;
    });
    createdItemId = item.id;
  } catch (error) {
    logEvent("error", "admin_content_create_failed", { error });
    redirectWithError("/admin/content/new", [
      "Content could not be saved. Check for duplicate slug or canonical path.",
    ]);
  }

  revalidatePath("/admin/content");
  revalidatePublicContentCache();
  const warningQuery = input.warnings.length ? `&warning=${encodeURIComponent(input.warnings.join(" "))}` : "";
  redirect(`/admin/content/${createdItemId}/edit?saved=1${warningQuery}`);
}

export async function updateContentAction(
  formData: FormData,
): Promise<void> {
  await requireAdminMutation(formData);
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
      const existingItem = await tx.contentItem.findUniqueOrThrow({
        where: { id },
        select: { canonicalPath: true, status: true },
      });
      const taxonomy = await validateContentTaxonomy(tx, {
        marketId: input.contentData.marketId,
        categoryIds: input.categoryIds,
        topicIds: input.topicIds,
        primaryCategoryId: input.contentData.primaryCategoryId,
        primaryTopicId: input.contentData.primaryTopicId,
        requirePrimaryCategory: false,
      });
      const latestRevision = await tx.contentRevision.findFirst({
        where: { contentItemId: id },
        orderBy: { revisionNumber: "desc" },
        select: { revisionNumber: true },
      });

      await claimContentUrl(tx, {
        contentItemId: id,
        marketId: input.contentData.marketId,
        path: input.contentData.canonicalPath,
        published: input.contentData.status === ContentStatus.PUBLISHED,
      });

      await tx.contentItem.update({
        where: { id },
        data: {
          ...input.contentData,
          brokers: { set: input.brokerIds.map((brokerId) => ({ id: brokerId })) },
          categories: { set: taxonomy.categoryIds.map((categoryId) => ({ id: categoryId })) },
          topics: { set: taxonomy.topicIds.map((topicId) => ({ id: topicId })) },
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
          summary: input.contentData.summary,
          body: input.contentData.body,
          status: input.contentData.status,
        },
      });

      if (existingItem.canonicalPath !== input.contentData.canonicalPath) {
        if (existingItem.status === ContentStatus.PUBLISHED) {
          await tx.contentUrl.updateMany({
            where: { contentItemId: id, path: existingItem.canonicalPath },
            data: { publishedOnce: true },
          });
        }
        await releaseUnpublishedContentUrl(tx, {
          contentItemId: id,
          path: existingItem.canonicalPath,
        });
      }
    });

  } catch (error) {
    logEvent("error", "admin_content_update_failed", { error, contentId: id });
    redirectWithError(editPath, [
      "Content could not be updated. Check for duplicate slug or canonical path.",
    ]);
  }

  revalidatePath("/admin/content");
  revalidatePath(editPath);
  revalidatePublicContentCache();
  const warningQuery = input.warnings.length ? `&warning=${encodeURIComponent(input.warnings.join(" "))}` : "";
  redirect(`${editPath}?saved=1${warningQuery}`);
}

const bulkStatuses = new Set<ContentStatus>([
  ContentStatus.DRAFT,
  ContentStatus.REVIEW,
  ContentStatus.ARCHIVED,
]);

export async function bulkUpdateContentStatusAction(formData: FormData) {
  await requireAdminMutation(formData);
  const selectedIds = formData
    .getAll("contentId")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .slice(0, 100);
  const status = asContentStatus(formData.get("bulkStatus"));
  const returnPath = field(formData, "returnPath") || "/admin/content";
  const adminRole = "admin" as const;

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
