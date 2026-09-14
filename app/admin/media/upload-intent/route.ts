import { NextResponse } from "next/server";
import { requireAdminApiMutation } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { buildMediaKeys, createMediaUploadUrl, extensionForMime, isStorageConfigured, MAX_MEDIA_UPLOAD_BYTES, MEDIA_UPLOAD_TTL_SECONDS, type AllowedMediaMime } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApiMutation(request);
    if (!(await isStorageConfigured())) return NextResponse.json({ error: "Media storage is not configured." }, { status: 503 });
    const body = await request.json() as { filename?: string; mimeType?: string; sizeBytes?: number };
    const filename = String(body.filename ?? "").replace(/[\\/\0]/g, "_").slice(0, 180);
    const mimeType = String(body.mimeType ?? "");
    const extension = extensionForMime(mimeType);
    const sizeBytes = Number(body.sizeBytes ?? 0);
    if (!filename || !extension || !Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_MEDIA_UPLOAD_BYTES) return NextResponse.json({ error: "Choose a supported JPEG, PNG, WebP or AVIF image within the upload limit." }, { status: 400 });
    const recentPending = await prisma.mediaAsset.count({ where: { createdBy: auth.account.username, status: "PENDING", createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } } });
    if (recentPending >= 20) return NextResponse.json({ error: "Too many pending uploads. Finish or retry them first." }, { status: 429 });
    const id = `media_${crypto.randomUUID().replaceAll("-", "")}`;
    const keys = buildMediaKeys(id, mimeType as AllowedMediaMime);
    await prisma.mediaAsset.create({ data: { id, yyyymm: keys.yyyymm, storageKey: keys.storageKey, pendingKey: keys.pendingKey, originalFilename: filename, mimeType, extension: keys.extension, sizeBytes: BigInt(sizeBytes), createdBy: auth.account.username } });
    try {
      const uploadUrl = await createMediaUploadUrl(keys.pendingKey, mimeType as AllowedMediaMime);
      return NextResponse.json({ assetId: id, uploadUrl, expiresAt: new Date(Date.now() + MEDIA_UPLOAD_TTL_SECONDS * 1000).toISOString() });
    } catch (error) {
      await prisma.mediaAsset.update({ where: { id }, data: { status: "ERROR", errorMessage: error instanceof Error ? error.message.slice(0, 240) : "Could not create upload URL." } });
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload could not start.";
    const status = message === "UNAUTHORIZED" ? 401 : message.startsWith("INVALID_") ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? "Upload could not start." : "Authentication expired. Refresh and try again." }, { status });
  }
}
