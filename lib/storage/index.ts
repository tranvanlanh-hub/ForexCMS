import "server-only";
import { CopyObjectCommand, DeleteObjectsCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const MAX_MEDIA_UPLOAD_BYTES = Number(process.env.MEDIA_MAX_UPLOAD_BYTES ?? 8 * 1024 * 1024);
export const MEDIA_UPLOAD_TTL_SECONDS = Number(process.env.MEDIA_UPLOAD_URL_TTL_SECONDS ?? 300);
const MIME_EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as const;
export type AllowedMediaMime = keyof typeof MIME_EXTENSIONS;
export type StorageConfig = { endpoint: string; region: string; bucket: string; publicBaseUrl: string; accessKeyId: string; secretAccessKey: string };

export function getStorageConfig(): StorageConfig {
  return { endpoint: process.env.S3_ENDPOINT ?? "", region: process.env.S3_REGION ?? "auto", bucket: process.env.S3_BUCKET ?? "", publicBaseUrl: (process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/$/, ""), accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" };
}
export function isStorageConfigured() { const c = getStorageConfig(); return Boolean(c.endpoint && c.bucket && c.publicBaseUrl && c.accessKeyId && c.secretAccessKey); }
function client() { const c = getStorageConfig(); if (!isStorageConfigured()) throw new Error("Media storage is not configured."); return new S3Client({ endpoint: c.endpoint, region: c.region, forcePathStyle: !c.endpoint.includes("r2.cloudflarestorage.com"), credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey } }); }
export function extensionForMime(mimeType: string): string | null { return MIME_EXTENSIONS[mimeType as AllowedMediaMime] ?? null; }
export function mediaMonth(date = new Date()) { return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
export function buildMediaKeys(assetId: string, mimeType: AllowedMediaMime, date = new Date()) { if (!/^[a-zA-Z0-9_-]+$/.test(assetId)) throw new Error("Invalid media asset ID."); const yyyymm = mediaMonth(date); const extension = MIME_EXTENSIONS[mimeType]; return { yyyymm, extension, pendingKey: `pending/${yyyymm}/${assetId}/original.${extension}`, storageKey: `uploads/${yyyymm}/${assetId}/original.${extension}` }; }
export function buildMediaPublicUrl(key: string) { const base = getStorageConfig().publicBaseUrl; return base && key ? `${base}/${key.split("/").map(encodeURIComponent).join("/")}` : ""; }
export async function createMediaUploadUrl(key: string, mimeType: AllowedMediaMime) { const c = getStorageConfig(); return getSignedUrl(client(), new PutObjectCommand({ Bucket: c.bucket, Key: key, ContentType: mimeType }), { expiresIn: MEDIA_UPLOAD_TTL_SECONDS }); }
export async function headMediaObject(key: string) { const c = getStorageConfig(); return client().send(new HeadObjectCommand({ Bucket: c.bucket, Key: key })); }
export async function readMediaHeader(key: string) { const c = getStorageConfig(); const response = await client().send(new GetObjectCommand({ Bucket: c.bucket, Key: key, Range: "bytes=0-65535" })); return new Uint8Array(await response.Body!.transformToByteArray()); }
export async function promoteMediaObject(pendingKey: string, storageKey: string, mimeType: string) { const c = getStorageConfig(); const copySource = `${c.bucket}/${pendingKey.split("/").map(encodeURIComponent).join("/")}`; await client().send(new CopyObjectCommand({ Bucket: c.bucket, Key: storageKey, CopySource: copySource, ContentType: mimeType, MetadataDirective: "REPLACE", CacheControl: "public, max-age=31536000, immutable" })); const destination = await headMediaObject(storageKey); if (!destination.ContentLength || destination.ContentType !== mimeType) throw new Error("Promoted media object could not be verified."); await deleteMediaObjects([pendingKey]); }
export async function deleteMediaObjects(keys: string[]) { if (!keys.length) return; const c = getStorageConfig(); await client().send(new DeleteObjectsCommand({ Bucket: c.bucket, Delete: { Objects: keys.map(Key => ({ Key })), Quiet: true } })); }

export function inspectImageHeader(bytes: Uint8Array, expectedMime: AllowedMediaMime) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); let mimeType = ""; let width = 0; let height = 0;
  if (bytes.length >= 24 && bytes[0] === 0x89 && String.fromCharCode(...bytes.slice(1, 4)) === "PNG") { mimeType = "image/png"; width = view.getUint32(16); height = view.getUint32(20); }
  else if (bytes.length >= 30 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") { mimeType = "image/webp"; const chunk = String.fromCharCode(...bytes.slice(12, 16)); if (chunk === "VP8X") { width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16); height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16); } else if (chunk === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) { width = view.getUint16(26, true) & 0x3fff; height = view.getUint16(28, true) & 0x3fff; } else if (chunk === "VP8L" && bytes[20] === 0x2f) { width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8); height = 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10); } }
  else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) { mimeType = "image/jpeg"; for (let offset = 2; offset + 9 < bytes.length;) { if (bytes[offset] !== 0xff) { offset++; continue; } const marker = bytes[offset + 1]; if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) { height = view.getUint16(offset + 5); width = view.getUint16(offset + 7); break; } const length = view.getUint16(offset + 2); if (length < 2) break; offset += 2 + length; } }
  else if (bytes.length >= 16 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" && String.fromCharCode(...bytes.slice(8, 12)).includes("avi")) { mimeType = "image/avif"; for (let offset = 0; offset + 12 < bytes.length; offset++) { if (String.fromCharCode(...bytes.slice(offset, offset + 4)) === "ispe") { width = view.getUint32(offset + 4); height = view.getUint32(offset + 8); break; } } }
  if (mimeType !== expectedMime || width < 1 || height < 1 || width > 20000 || height > 20000) throw new Error("Uploaded file is not a valid supported image.");
  return { mimeType, width, height };
}
