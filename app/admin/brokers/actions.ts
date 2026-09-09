"use server";

import { BrokerStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { brokerStatusLabels } from "@/lib/affiliate";
import { normalizeSlug } from "@/lib/content";
import { prisma } from "@/lib/db";

const allowedStatuses = new Set<BrokerStatus>(Object.values(BrokerStatus));

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function asBrokerStatus(value: FormDataEntryValue | null): BrokerStatus {
  return allowedStatuses.has(value as BrokerStatus)
    ? (value as BrokerStatus)
    : BrokerStatus.DRAFT;
}

function isUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function redirectWithError(path: string, errors: string[]): never {
  redirect(`${path}?error=${encodeURIComponent(errors.join(" "))}`);
}

function buildBrokerInput(formData: FormData) {
  const name = field(formData, "name");
  const slug = normalizeSlug(field(formData, "slug"));
  const status = asBrokerStatus(formData.get("status"));
  const logoUrl = field(formData, "logoUrl");
  const description = field(formData, "description");
  const errors: string[] = [];

  if (!name) errors.push("Broker name is required.");
  if (!slug) errors.push("Broker slug is required.");
  if (!brokerStatusLabels[status]) errors.push("Broker status is invalid.");
  if (!isUrl(logoUrl)) errors.push("Logo/media URL must be a valid HTTP URL.");
  if (description.length > 280) {
    errors.push("Short description must be 280 characters or less.");
  }

  return {
    data: {
      name,
      slug,
      status,
      logoUrl: logoUrl || null,
      description: description || null,
    },
    errors,
  };
}

export async function createBrokerAction(formData: FormData) {
  const input = buildBrokerInput(formData);

  if (input.errors.length > 0) {
    redirectWithError("/admin/brokers/new", input.errors);
  }

  try {
    const broker = await prisma.broker.create({ data: input.data });
    revalidatePath("/admin/brokers");
    redirect(`/admin/brokers/${broker.id}/edit?saved=1`);
  } catch {
    redirectWithError("/admin/brokers/new", [
      "Broker could not be saved. Check for duplicate slug.",
    ]);
  }
}

export async function updateBrokerAction(formData: FormData) {
  const id = field(formData, "id");
  const editPath = `/admin/brokers/${id}/edit`;

  if (!id) {
    redirectWithError("/admin/brokers", ["Broker ID is missing."]);
  }

  const input = buildBrokerInput(formData);

  if (input.errors.length > 0) {
    redirectWithError(editPath, input.errors);
  }

  try {
    await prisma.broker.update({
      where: { id },
      data: input.data,
    });
    revalidatePath("/admin/brokers");
    revalidatePath(editPath);
    redirect(`${editPath}?saved=1`);
  } catch {
    redirectWithError(editPath, [
      "Broker could not be updated. Check for duplicate slug.",
    ]);
  }
}
