import "server-only";
import { mkdir, rename, rm, stat, readFile, writeFile, access } from "node:fs/promises";
import { dirname, normalize, resolve, sep } from "node:path";
import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_MEDIA_UPLOAD_BYTES = Number(process.env.MEDIA_MAX_UPLOAD_BYTES ?? 8 * 1024 * 1024);
export const MEDIA_UPLOAD_TTL_SECONDS = Number(process.env.MEDIA_UPLOAD_URL_TTL_SECONDS ?? 300);
const MIME_EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as const;
export type AllowedMediaMime = keyof typeof MIME_EXTENSIONS;

export type StorageConfig = {
  root: string;
  publicBase: string;
  signingSecret: string;
};

export function getStorageConfig(): StorageConfig {
  return {
    root: process.env.MEDIA_LOCAL_ROOT ?? "/var/www/marketgb/shared/uploads",
    publicBase: (process.env.MEDIA_PUBLIC_BASE ?? "/uploads").replace(/\/$/, ""),
    signingSecret: process.env.MEDIA_UPLOAD_SIGNING_SECRET ?? "",
  };
}

export async function isStorageConfigured(): Promise<boolean> {
  const { root, signingSecret } = getStorageConfig();
  if (!signingSecret || signingSecret.length < 32) return false;
  try {
    await access(root, 2 /* W_OK */);
    return true;
  } catch {
    return false;
  }
}

export function extensionForMime(mimeType: string): string | null {
  return MIME_EXTENSIONS[mimeType as AllowedMediaMime] ?? null;
}

export function mediaMonth(date = new Date()) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function buildMediaKeys(assetId: string, mimeType: AllowedMediaMime, date = new Date()) {
  if (!/^[a-zA-Z0-9_-]+$/.test(assetId)) throw new Error("Invalid media asset ID.");
  const yyyymm = mediaMonth(date);
  const extension = MIME_EXTENSIONS[mimeType];
  return {
    yyyymm,
    extension,
    pendingKey: `pending/${yyyymm}/${assetId}/original.${extension}`,
    storageKey: `uploads/${yyyymm}/${assetId}/original.${extension}`,
  };
}

export function buildMediaPublicUrl(key: string): string {
  const { publicBase } = getStorageConfig();
  return key ? `${publicBase}/${key.split("/").map(encodeURIComponent).join("/")}` : "";
}

function safeJoin(root: string, key: string): string {
  const normalized = normalize(key).replace(/^[/\\]+/, "");
  if (normalized.split(sep).some((segment) => segment === "..")) {
    throw new Error("Invalid media key.");
  }
  const full = resolve(root, normalized);
  if (!full.startsWith(resolve(root) + sep) && full !== resolve(root)) {
    throw new Error("Media key escapes storage root.");
  }
  return full;
}

function signUpload(key: string, exp: number): string {
  const { signingSecret } = getStorageConfig();
  if (!signingSecret) throw new Error("Media upload signing secret is not configured.");
  return createHmac("sha256", signingSecret).update(`${key}|${exp}`).digest("base64url");
}

export function verifyUploadSignature(key: string, exp: number, sig: string): boolean {
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = signUpload(key, exp);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createMediaUploadUrl(key: string, _mimeType: AllowedMediaMime): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + MEDIA_UPLOAD_TTL_SECONDS;
  const sig = signUpload(key, exp);
  return `/api/admin/media/upload?key=${encodeURIComponent(key)}&exp=${exp}&sig=${encodeURIComponent(sig)}`;
}

export async function writeMediaObject(key: string, data: Uint8Array | Buffer): Promise<{ sizeBytes: number; mimeType: string | null }> {
  const { root } = getStorageConfig();
  const full = safeJoin(root, key);
  await mkdir(dirname(full), { recursive: true });
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await writeFile(full, buffer);
  return { sizeBytes: buffer.length, mimeType: null };
}

export async function headMediaObject(key: string): Promise<{ sizeBytes: number; mimeType: string | null }> {
  const { root } = getStorageConfig();
  const full = safeJoin(root, key);
  const info = await stat(full);
  return { sizeBytes: info.size, mimeType: null };
}

export async function readMediaHeader(key: string, maxBytes = 65536): Promise<Uint8Array> {
  const { root } = getStorageConfig();
  const full = safeJoin(root, key);
  const handle = await stat(/*turbopackIgnore: true*/ full);
  const length = Math.min(maxBytes, handle.size);
  const buffer = await readFile(/*turbopackIgnore: true*/ full);
  return new Uint8Array(buffer.subarray(0, length));
}

export async function promoteMediaObject(pendingKey: string, storageKey: string): Promise<void> {
  const { root } = getStorageConfig();
  const pendingPath = safeJoin(root, pendingKey);
  const storagePath = safeJoin(root, storageKey);
  await mkdir(dirname(storagePath), { recursive: true });
  await rename(pendingPath, storagePath);
}

export async function deleteMediaObjects(keys: string[]): Promise<void> {
  const { root } = getStorageConfig();
  for (const key of keys) {
    const full = safeJoin(root, key);
    await rm(full, { force: true });
  }
}

export function inspectImageHeader(bytes: Uint8Array, expectedMime: AllowedMediaMime) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); let mimeType = ""; let width = 0; let height = 0;
  if (bytes.length >= 24 && bytes[0] === 0x89 && String.fromCharCode(...bytes.slice(1, 4)) === "PNG") { mimeType = "image/png"; width = view.getUint32(16); height = view.getUint32(20); }
  else if (bytes.length >= 30 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") { mimeType = "image/webp"; const chunk = String.fromCharCode(...bytes.slice(12, 16)); if (chunk === "VP8X") { width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16); height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16); } else if (chunk === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) { width = view.getUint16(26, true) & 0x3fff; height = view.getUint16(28, true) & 0x3fff; } else if (chunk === "VP8L" && bytes[20] === 0x2f) { width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8); height = 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10); } }
  else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) { mimeType = "image/jpeg"; for (let offset = 2; offset + 9 < bytes.length;) { if (bytes[offset] !== 0xff) { offset++; continue; } const marker = bytes[offset + 1]; if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) { height = view.getUint16(offset + 5); width = view.getUint16(offset + 7); break; } const length = view.getUint16(offset + 2); if (length < 2) break; offset += 2 + length; } }
  else if (bytes.length >= 16 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" && String.fromCharCode(...bytes.slice(8, 12)).includes("avi")) { mimeType = "image/avif"; for (let offset = 0; offset + 12 < bytes.length; offset++) { if (String.fromCharCode(...bytes.slice(offset, offset + 4)) === "ispe") { width = view.getUint32(offset + 4); height = view.getUint32(offset + 8); break; } } }
  if (mimeType !== expectedMime || width < 1 || height < 1 || width > 20000 || height > 20000) throw new Error("Uploaded file is not a valid supported image.");
  return { mimeType, width, height };
}
