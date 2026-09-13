"use server";

import { TemplateKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revalidatePublicContentCache } from "@/lib/cache/public";
import { normalizeSlug } from "@/lib/content";
import { prisma } from "@/lib/db";
import { requireAdminMutation } from "@/lib/admin/session";
import {
  normalizeInternalLinkSlots,
  templateBlockValues,
  templateCtaSlotValues,
  templateSchemaValues,
} from "@/lib/templates";

const templateKinds = new Set<TemplateKind>(Object.values(TemplateKind));

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function values(formData: FormData, name: string) {
  return [
    ...new Set(
      formData
        .getAll(name)
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  ];
}

function redirectWithError(path: string, errors: string[]): never {
  redirect(`${path}?error=${encodeURIComponent(errors.join(" "))}`);
}

function buildTemplateInput(formData: FormData) {
  const key = normalizeSlug(field(formData, "key"));
  const name = field(formData, "name");
  const description = field(formData, "description");
  const kindValue = field(formData, "kind");
  const kind = templateKinds.has(kindValue as TemplateKind)
    ? (kindValue as TemplateKind)
    : null;
  const allowedBlocks = values(formData, "allowedBlocks");
  const requiredBlocks = values(formData, "requiredBlocks");
  const schemaTypes = values(formData, "schemaTypes");
  const ctaSlots = values(formData, "ctaSlots");
  const internalLinkSlots = normalizeInternalLinkSlots(
    field(formData, "internalLinkSlots"),
  );
  const isActive = formData.get("isActive") === "on";
  const errors: string[] = [];

  if (!key) errors.push("Template key is required.");
  if (!name) errors.push("Template name is required.");
  if (!kind) errors.push("Template kind is invalid.");
  if (description.length > 500) {
    errors.push("Description must be 500 characters or less.");
  }

  const invalidBlocks = [...allowedBlocks, ...requiredBlocks].filter(
    (block) => !templateBlockValues.has(block),
  );
  if (invalidBlocks.length > 0) errors.push("Template contains an invalid block.");
  if (!allowedBlocks.includes("body")) {
    errors.push("Main body must be allowed.");
  }

  const requiredOutsideAllowed = requiredBlocks.filter(
    (block) => !allowedBlocks.includes(block),
  );
  if (requiredOutsideAllowed.length > 0) {
    errors.push("Every required block must also be allowed.");
  }

  if (schemaTypes.some((schema) => !templateSchemaValues.has(schema))) {
    errors.push("Template contains an invalid schema type.");
  }
  if (ctaSlots.some((slot) => !templateCtaSlotValues.has(slot))) {
    errors.push("Template contains an invalid CTA slot.");
  }
  if (ctaSlots.length > 0 && !allowedBlocks.includes("cta_slot")) {
    errors.push("Allow the affiliate CTA block before selecting CTA slots.");
  }

  return {
    data: {
      key,
      name,
      kind: kind ?? TemplateKind.ARTICLE,
      description: description || null,
      requiredBlocks,
      allowedBlocks,
      schemaTypes,
      ctaSlots,
      internalLinkSlots,
      isActive,
    },
    errors,
  };
}

export async function createTemplateAction(formData: FormData) {
  await requireAdminMutation(formData);
  const input = buildTemplateInput(formData);

  if (input.errors.length > 0) {
    redirectWithError("/admin/templates/new", input.errors);
  }

  let templateId = "";

  try {
    const template = await prisma.template.create({ data: input.data });
    templateId = template.id;
    revalidatePath("/admin/templates");
    revalidatePublicContentCache();
  } catch {
    redirectWithError("/admin/templates/new", [
      "Template could not be saved. Check for a duplicate key.",
    ]);
  }

  redirect(`/admin/templates/${templateId}/edit?saved=1`);
}

export async function updateTemplateAction(formData: FormData) {
  await requireAdminMutation(formData);
  const id = field(formData, "id");
  const editPath = `/admin/templates/${id}/edit`;

  if (!id) {
    redirectWithError("/admin/templates", ["Template ID is missing."]);
  }

  const input = buildTemplateInput(formData);

  if (input.errors.length > 0) {
    redirectWithError(editPath, input.errors);
  }

  let existing: {
    kind: TemplateKind;
    _count: { contentItems: number };
  } | null = null;

  try {
    existing = await prisma.template.findUnique({
      where: { id },
      select: { kind: true, _count: { select: { contentItems: true } } },
    });
  } catch {
    redirectWithError(editPath, ["Template could not be loaded."]);
  }

  if (!existing) {
    redirectWithError("/admin/templates", ["Template was not found."]);
  }
  if (
    existing._count.contentItems > 0 &&
    existing.kind !== input.data.kind
  ) {
    redirectWithError(editPath, [
      "Template kind cannot change while content items use this template.",
    ]);
  }

  try {
    await prisma.template.update({ where: { id }, data: input.data });
    revalidatePath("/admin/templates");
    revalidatePath(editPath);
    revalidatePath("/admin/content");
    revalidatePublicContentCache();
  } catch {
    redirectWithError(editPath, [
      "Template could not be updated. Check for a duplicate key.",
    ]);
  }

  redirect(`${editPath}?saved=1`);
}
