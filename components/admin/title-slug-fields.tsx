"use client";

import { useState, type ChangeEvent } from "react";

// Mirrors `normalizeSlug` in lib/content/index.ts so the auto-filled value
// is byte-identical to what the server action would produce.
function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function TitleSlugFields({
  initialTitle,
  initialSlug,
}: {
  initialTitle: string;
  initialSlug: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  // Editing an existing article: the slug was hand-tuned, don't clobber it.
  // New article: auto-fill freely until the editor touches the field.
  const [slug, setSlug] = useState(initialSlug);
  const [slugDirty, setSlugDirty] = useState(Boolean(initialSlug));

  function onTitleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setTitle(next);
    if (!slugDirty) setSlug(slugify(next));
  }

  function onSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlug(event.target.value);
    setSlugDirty(true);
  }

  function resetSlugFromTitle() {
    setSlug(slugify(title));
    setSlugDirty(false);
  }

  return (
    <>
      <label htmlFor="title">Article title</label>
      <input
        className="editor-title"
        id="title"
        name="title"
        onChange={onTitleChange}
        placeholder="Give your article a clear, descriptive title"
        required
        value={title}
      />
      <label
        htmlFor="slug"
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span>URL slug</span>
        {slugDirty && (
          <button
            className="text-[11px] font-semibold text-[#0f766e] hover:underline"
            onClick={resetSlugFromTitle}
            style={{ marginTop: 0 }}
            type="button"
          >
            Reset to title
          </button>
        )}
      </label>
      <input id="slug" name="slug" onChange={onSlugChange} value={slug} />
      <p className="field-help">
        Auto-generated from the title. Edit to override — lowercase letters,
        numbers and dashes only.
      </p>
    </>
  );
}
