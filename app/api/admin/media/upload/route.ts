import { NextResponse } from "next/server";
import { requireAdminApiMutation } from "@/lib/admin/session";
import { MAX_MEDIA_UPLOAD_BYTES, verifyUploadSignature, writeMediaObject } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    await requireAdminApiMutation(request);
    const url = new URL(request.url);
    const key = url.searchParams.get("key") ?? "";
    const expRaw = url.searchParams.get("exp") ?? "";
    const sig = url.searchParams.get("sig") ?? "";
    if (!key || !expRaw || !sig) return NextResponse.json({ error: "Missing upload parameters." }, { status: 400 });
    const exp = Number(expRaw);
    if (!Number.isFinite(exp)) return NextResponse.json({ error: "Invalid upload expiry." }, { status: 400 });
    if (!verifyUploadSignature(key, exp, sig)) return NextResponse.json({ error: "Upload signature is invalid or expired." }, { status: 403 });

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (!Number.isFinite(contentLength) || contentLength < 1 || contentLength > MAX_MEDIA_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Uploaded file is empty or exceeds the size limit." }, { status: 413 });
    }

    const arrayBuffer = await request.arrayBuffer();
    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > MAX_MEDIA_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Uploaded file is empty or exceeds the size limit." }, { status: 413 });
    }

    await writeMediaObject(key, new Uint8Array(arrayBuffer));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload could not be stored.";
    const status = message === "UNAUTHORIZED" ? 401 : message.startsWith("INVALID_") ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? "Upload could not be stored." : "Authentication expired. Refresh and try again." }, { status });
  }
}
