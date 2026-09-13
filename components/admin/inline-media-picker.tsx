"use client";

import { useRef, useState } from "react";

type MediaOption = { id: string; originalFilename: string };

// Inline media upload for the content editor — uploads via the existing
// /admin/media/upload-intent/ + /admin/media/finalize/ endpoints, appends the
// new asset to the dropdown, and selects it. Mirrors the flow in
// components/admin/media-upload.tsx but stays in place.
export function InlineMediaPicker({
  name,
  label,
  emptyLabel,
  initialValue,
  mediaAssets,
  csrfToken,
  storageReady,
  maxBytes,
}: {
  name: string;
  label: string;
  emptyLabel: string;
  initialValue: string;
  mediaAssets: MediaOption[];
  csrfToken: string;
  storageReady: boolean;
  maxBytes: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [options, setOptions] = useState<MediaOption[]>(mediaAssets);
  const [value, setValue] = useState(initialValue);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    setProgress(0);
    try {
      const intentResponse = await fetch("/admin/media/upload-intent/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const intent = (await intentResponse.json()) as {
        assetId?: string;
        uploadUrl?: string;
        error?: string;
      };
      if (!intentResponse.ok || !intent.uploadUrl || !intent.assetId) {
        throw new Error(intent.error ?? "Upload could not start.");
      }
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", intent.uploadUrl!);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onerror = () => reject(new Error("Object upload failed. Check bucket CORS."));
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Object upload failed (${xhr.status}).`));
        xhr.send(file);
      });
      const finalizeResponse = await fetch("/admin/media/finalize/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ assetId: intent.assetId }),
      });
      const finalized = (await finalizeResponse.json()) as { error?: string };
      if (!finalizeResponse.ok) {
        throw new Error(finalized.error ?? "Upload could not be finalized.");
      }
      const newOption: MediaOption = {
        id: intent.assetId,
        originalFilename: file.name,
      };
      setOptions((current) => [newOption, ...current]);
      setValue(intent.assetId);
      setMessage(`Uploaded ${file.name}.`);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label htmlFor={name}>
      {label}
      <select
        disabled={busy}
        id={name}
        name={name}
        onChange={(event) => setValue(event.target.value)}
        value={value}
      >
        <option value="">{emptyLabel}</option>
        {options.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.originalFilename}
          </option>
        ))}
      </select>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginTop: 8,
        }}
      >
        <input
          ref={inputRef}
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={!storageReady || busy}
          type="file"
        />
        <p className="field-help" style={{ marginTop: 0 }}>
          JPEG, PNG, WebP or AVIF · up to {Math.round(maxBytes / 1024 / 1024)} MiB
        </p>
        <button
          className="button button-outline"
          disabled={!storageReady || busy}
          onClick={upload}
          style={{ alignSelf: "flex-start", fontSize: 11, padding: "6px 12px", minHeight: 0 }}
          type="button"
        >
          {busy ? `Uploading ${progress}%` : "Upload new image"}
        </button>
        {!storageReady && (
          <p className="field-help" style={{ color: "#9a3412" }}>
            Configure the S3/R2 environment variables before uploading.
          </p>
        )}
        {message && (
          <p aria-live="polite" className="field-help">
            {message}
          </p>
        )}
      </div>
    </label>
  );
}
