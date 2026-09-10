"use server";

import { ContentStatus, RobotsIndex, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeAiImportDraft,
  resolveAiImportReferences,
  validateAiImportInput,
  type AiImportValidationResult,
} from "@/lib/ai-import";
import { buildContentCanonicalPath, toMarkdownBody } from "@/lib/content";
import { prisma } from "@/lib/db";

export type AiImportActionState = AiImportValidationResult & {
  input: string;
  savedContentId?: string;
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

export async function aiImportAction(
  _previousState: AiImportActionState,
  formData: FormData,
): Promise<AiImportActionState> {
  const input = field(formData, "input");
  const intent = field(formData, "intent");
  const validation = await validateAiImportInput(input);

  if (intent !== "save" || validation.errors.length > 0 || !validation.draft) {
    return { input, ...validation };
  }

  const draft = normalizeAiImportDraft(input);
  const references = await resolveAiImportReferences(draft);

  if (!references || !draft.contentType) {
    return {
      input,
      ...validation,
      errors: [
        ...validation.errors,
        "Import references could not be resolved before save.",
      ],
    };
  }

  const contentType = draft.contentType;
  const canonicalPath = buildContentCanonicalPath({
    marketCode: references.market.code,
    contentType,
    slug: draft.slug,
  });
  const body = toMarkdownBody(draft.body, references.template);
  const translationGroup = draft.translationGroupKey
    ? await prisma.contentTranslationGroup.upsert({
        where: { key: draft.translationGroupKey },
        update: {},
        create: {
          key: draft.translationGroupKey,
          name: draft.title,
        },
      })
    : null;

  let itemId = "";

  try {
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.contentItem.create({
        data: {
          title: draft.title,
          slug: draft.slug,
          contentType,
          status: ContentStatus.DRAFT,
          marketId: references.market.id,
          templateId: references.template.id,
          translationGroupId: translationGroup?.id ?? null,
          canonicalPath,
          body,
          brokers: references.brokers.length
            ? {
                connect: references.brokers.map((broker) => ({ id: broker.id })),
              }
            : undefined,
        },
      });

      await tx.seoMetadata.create({
        data: {
          marketId: references.market.id,
          contentItemId: created.id,
          title: draft.seoTitle,
          description: draft.metaDescription,
          canonicalPath,
          robotsIndex: RobotsIndex.INDEX,
          robotsFollow: true,
        },
      });

      await tx.contentRevision.create({
        data: {
          contentItemId: created.id,
          revisionNumber: 1,
          title: draft.title,
          body: body as Prisma.InputJsonObject,
          status: ContentStatus.DRAFT,
          createdBy: "ai-import",
        },
      });

      return created;
    });

    itemId = item.id;
    revalidatePath("/admin/ai-import");
    revalidatePath("/admin/content");
  } catch {
    return {
      input,
      ...validation,
      errors: [
        ...validation.errors,
        "Draft could not be saved. Check duplicate slug or canonical path.",
      ],
    };
  }

  redirect(`/admin/content/${itemId}/edit?saved=1`);
}
