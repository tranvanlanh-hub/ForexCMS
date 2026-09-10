"use client";

import { useActionState } from "react";
import {
  aiImportAction,
  type AiImportActionState,
} from "@/app/admin/ai-import/actions";

const sampleInput = `---
title: Forex Trading Basics
slug: forex-trading-basics
market: global
language: en
contentType: ARTICLE
template: article
seoTitle: Forex Trading Basics for Beginners
metaDescription: Learn the basic ideas behind forex trading, currency pairs, risk, and broker selection.
brokerMentions: exness
affiliateTokens: global:exness:review_top_cta
---
Intro paragraph for the imported draft.

## Key Takeaways
- Forex trading involves currency pairs.
- Risk management matters before choosing leverage.

## What is forex trading?
Main article section.

## FAQ
### Is forex trading risky?
Yes. Forex trading can involve significant risk, especially with leverage.`;

const initialAiImportState: AiImportActionState = {
  input: "",
  errors: [],
  warnings: [],
  draft: null,
  preview: null,
};

function StatusList({
  items,
  tone,
}: {
  items: string[];
  tone: "error" | "warning";
}) {
  if (items.length === 0) return null;

  const classes =
    tone === "error"
      ? "border-[#f0b8a8] bg-[#fff7f4] text-[#9a3412]"
      : "border-[#f4d28c] bg-[#fffbeb] text-[#92400e]";

  return (
    <div className={`rounded-lg border p-4 ${classes}`}>
      <h2 className="text-sm font-semibold">
        {tone === "error" ? "Blocking validation" : "Warnings"}
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Preview({ state }: { state: AiImportActionState }) {
  if (!state.draft && !state.preview) {
    return (
      <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
        <h2 className="text-base font-semibold text-[#111827]">Preview</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f6268]">
          Paste JSON or Markdown frontmatter, then validate before saving.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#111827]">
            {state.draft?.title || "Untitled draft"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#5f6268]">
            {state.preview?.canonicalPath ?? "Canonical path will appear after validation."}
          </p>
        </div>
        <span className="rounded-md border border-[#b7dfca] bg-[#f0fdf6] px-2 py-1 text-xs font-semibold text-[#166534]">
          Draft only
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-[#111827]">Market</dt>
          <dd className="mt-1 text-[#5f6268]">
            {state.preview?.marketLabel ?? state.draft?.market ?? "-"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#111827]">Content type</dt>
          <dd className="mt-1 text-[#5f6268]">
            {state.preview?.contentTypeLabel ?? state.draft?.contentType ?? "-"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#111827]">Template</dt>
          <dd className="mt-1 text-[#5f6268]">
            {state.preview?.templateLabel ?? state.draft?.template ?? "-"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#111827]">Language</dt>
          <dd className="mt-1 text-[#5f6268]">{state.draft?.language || "-"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#111827]">SEO title</dt>
          <dd className="mt-1 text-[#5f6268]">{state.draft?.seoTitle || "-"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#111827]">Meta description</dt>
          <dd className="mt-1 text-[#5f6268]">
            {state.draft?.metaDescription || "-"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-[#eef1ed] pt-4">
        <h3 className="text-sm font-semibold text-[#111827]">Broker checks</h3>
        <p className="mt-2 text-sm leading-6 text-[#5f6268]">
          {(state.preview?.brokerLabels.length
            ? state.preview.brokerLabels.join(", ")
            : state.draft?.brokerMentions.join(", ")) || "No broker mentions"}
        </p>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-[#111827]">Affiliate tokens</h3>
        <p className="mt-2 text-sm leading-6 text-[#5f6268]">
          {(state.preview?.affiliateTokenLabels.length
            ? state.preview.affiliateTokenLabels.join(", ")
            : state.draft?.affiliateTokens
                .map((token) => `${token.market ?? state.draft?.market}:${token.broker}:${token.campaign}`)
                .join(", ")) || "No affiliate tokens"}
        </p>
      </div>

      {state.draft?.body ? (
        <div className="mt-5 border-t border-[#eef1ed] pt-4">
          <h3 className="text-sm font-semibold text-[#111827]">Body preview</h3>
          <pre className="mt-2 max-h-80 overflow-auto rounded-md border border-[#d9ded7] bg-[#fbfcfb] p-3 whitespace-pre-wrap text-xs leading-5 text-[#374151]">
            {state.draft.body}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export function AiImportForm() {
  const [state, formAction, isPending] = useActionState(
    aiImportAction,
    initialAiImportState,
  );
  const canSave = state.preview && state.errors.length === 0;

  return (
    <form action={formAction} className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
        <label className="text-sm font-semibold text-[#111827]" htmlFor="input">
          Import input
        </label>
        <textarea
          className="mt-2 min-h-[560px] w-full resize-y rounded-md border border-[#cbd5ce] px-3 py-3 font-mono text-sm leading-6 outline-none transition focus:border-[#0f766e]"
          defaultValue={state.input}
          id="input"
          name="input"
          placeholder={sampleInput}
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            className="h-11 rounded-md border border-[#0f766e] bg-white px-4 text-sm font-semibold text-[#123c3a] transition hover:bg-[#f0fdfa] disabled:opacity-60"
            disabled={isPending}
            name="intent"
            type="submit"
            value="validate"
          >
            {isPending ? "Checking..." : "Validate preview"}
          </button>
          <button
            className="h-11 rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49] disabled:cursor-not-allowed disabled:bg-[#8aa3a0]"
            disabled={isPending || !canSave}
            name="intent"
            type="submit"
            value="save"
          >
            Save draft
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#5f6268]">
          Save draft is enabled only after blocking validation passes. AI import
          never publishes directly.
        </p>
      </div>

      <aside className="flex flex-col gap-4">
        <StatusList items={state.errors} tone="error" />
        <StatusList items={state.warnings} tone="warning" />
        <Preview state={state} />
      </aside>
    </form>
  );
}
