import { NextResponse } from "next/server";
import { requireAdminApiMutation } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { headMediaObject, inspectImageHeader, MAX_MEDIA_UPLOAD_BYTES, promoteMediaObject, readMediaHeader, type AllowedMediaMime } from "@/lib/storage";

export async function POST(request: Request) {
  let assetId = "";
  try {
    const auth = await requireAdminApiMutation(request);
    const body = await request.json() as { assetId?: string };
    assetId = String(body.assetId ?? "");
    const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset || asset.createdBy !== auth.account.username) return NextResponse.json({ error: "Upload record was not found." }, { status: 404 });
    if (asset.status === "READY") return NextResponse.json({ ok: true });
    if (!asset.pendingKey || asset.status !== "PENDING") return NextResponse.json({ error: "Upload cannot be finalized in its current state." }, { status: 409 });
    const head = await headMediaObject(asset.pendingKey);
    const sizeBytes = Number(head.ContentLength ?? 0);
    if (sizeBytes < 1 || sizeBytes > MAX_MEDIA_UPLOAD_BYTES || sizeBytes !== Number(asset.sizeBytes) || head.ContentType !== asset.mimeType) throw new Error("Uploaded object metadata does not match the upload intent.");
    const dimensions = inspectImageHeader(await readMediaHeader(asset.pendingKey), asset.mimeType as AllowedMediaMime);
    await promoteMediaObject(asset.pendingKey, asset.storageKey, asset.mimeType);
    await prisma.mediaAsset.update({ where: { id: asset.id }, data: { status: "READY", pendingKey: null, width: dimensions.width, height: dimensions.height, sizeBytes: BigInt(sizeBytes), etag: head.ETag?.replaceAll('"', "") ?? null, errorMessage: null } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload could not be finalized.";
    const status = message === "UNAUTHORIZED" ? 401 : message.startsWith("INVALID_") ? 403 : 400;
    if (assetId && status === 400) await prisma.mediaAsset.updateMany({ where: { id: assetId, status: "PENDING" }, data: { status: "ERROR", errorMessage: message.slice(0, 240) } }).catch(() => undefined);
    return NextResponse.json({ error: status === 400 ? message : "Authentication expired. Refresh and try again." }, { status });
  }
}
