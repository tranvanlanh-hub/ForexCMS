import Link from "next/link";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

type PilotDraft = {
  id: string;
  title: string;
  market: string;
  language: string;
  contentType: string;
  status: string;
  targetKeyword: string;
  canonicalPath: string;
  topicCluster: string;
};

async function getPilotDrafts() {
  try {
    const file = await readFile(
      join(process.cwd(), "data", "ai-content", "pilot-50-drafts.json"),
      "utf8",
    );

    return JSON.parse(file) as PilotDraft[];
  } catch {
    return [];
  }
}

export default async function ContentScaleDemoIndexPage() {
  const drafts = await getPilotDrafts();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <Link className="text-sm font-semibold text-[#123c3a]" href="/">
            Forex Affiliate CMS
          </Link>
          <Link
            className="text-sm font-semibold text-[#123c3a] hover:underline"
            href="/admin/content-scale"
          >
            Admin scale view
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <section className="border-b border-[var(--border)] pb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
            Frontend demo
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#111827]">
            AI pilot draft previews
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#5f6268]">
            These pages render the 50 pilot drafts on the public frontend without
            publishing them to the CMS database. They are intentionally marked as
            draft demos.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {drafts.map((draft) => (
            <Link
              className="rounded-lg border border-[#d9ded7] bg-white p-5 transition hover:border-[#0f766e] hover:shadow-sm"
              href={`/demo/content-scale/${draft.id}/`}
              key={draft.id}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f766e]">
                  {draft.market} / {draft.contentType}
                </p>
                <p className="rounded-sm border border-[#f0d38a] bg-[#fff8e6] px-2 py-1 text-xs font-semibold text-[#7a4d00]">
                  {draft.status}
                </p>
              </div>
              <h2 className="mt-3 text-lg font-semibold leading-snug text-[#111827]">
                {draft.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5f6268]">
                {draft.targetKeyword}
              </p>
              <p className="mt-4 break-words text-xs font-medium text-[#123c3a]">
                {draft.canonicalPath}
              </p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
