"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function MediaUpload({ csrfToken, maxBytes, storageReady }: { csrfToken: string; maxBytes: number; storageReady: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload() {
    const file = inputRef.current?.files?.[0]; if (!file) return;
    setBusy(true); setMessage(""); setProgress(0);
    try {
      const intentResponse = await fetch("/admin/media/upload-intent/", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken }, body: JSON.stringify({ filename: file.name, mimeType: file.type, sizeBytes: file.size }) });
      const intent = await intentResponse.json() as { assetId?: string; uploadUrl?: string; error?: string };
      if (!intentResponse.ok || !intent.uploadUrl || !intent.assetId) throw new Error(intent.error ?? "Upload could not start.");
      await new Promise<void>((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open("PUT", intent.uploadUrl!); xhr.setRequestHeader("Content-Type", file.type); xhr.upload.onprogress = event => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); }; xhr.onerror = () => reject(new Error("Object upload failed. Check bucket CORS.")); xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Object upload failed (${xhr.status}).`)); xhr.send(file); });
      const finalizeResponse = await fetch("/admin/media/finalize/", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken }, body: JSON.stringify({ assetId: intent.assetId }) });
      const finalized = await finalizeResponse.json() as { error?: string }; if (!finalizeResponse.ok) throw new Error(finalized.error ?? "Upload could not be finalized.");
      setMessage("Upload complete. Refreshing library…"); router.push("/admin/media?uploaded=1"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); setBusy(false); }
  }
  return <section className="rounded-lg border border-[#d9ded7] bg-white p-5"><h2 className="text-lg font-semibold text-[#111827]">Upload image</h2><p className="mt-2 text-sm text-[#5f6268]">JPEG, PNG, WebP or AVIF · up to {Math.round(maxBytes / 1024 / 1024)} MiB · stored under uploads/yyyymm/assetId/.</p>{!storageReady && <p className="editor-alert error mt-4">Configure the S3/R2 environment variables before uploading.</p>}<div className="mt-4 flex flex-col gap-3 sm:flex-row"><input accept="image/jpeg,image/png,image/webp,image/avif" className="block flex-1 rounded-md border border-[#cbd5ce] p-2 text-sm" disabled={!storageReady || busy} ref={inputRef} type="file"/><button className="button" disabled={!storageReady || busy} onClick={upload} type="button">{busy ? "Uploading…" : "Upload"}</button></div>{busy && <progress aria-label="Upload progress" className="mt-4 w-full" max={100} value={progress}/>} {message && <p aria-live="polite" className="mt-3 text-sm text-[#5f6268]">{message}</p>}</section>;
}
