import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

type AffiliateToken = {
  broker: string;
  market: string;
  language: string;
  campaign: string;
};

type PilotDraft = {
  id: string;
  title: string;
  slug: string;
  market: string;
  language: string;
  contentType: string;
  template: string;
  status: string;
  targetKeyword: string;
  seoTitle: string;
  metaDescription: string;
  canonicalPath: string;
  topicCluster: string;
  schemaTypes: string[];
  faq: Array<{ question: string; answer: string }>;
  internalLinkTargets: string[];
  affiliateTokens: AffiliateToken[];
  brokerMentions: string[];
  body: string;
};

async function getDraft(draftId: string) {
  const file = await readFile(
    join(process.cwd(), "data", "ai-content", "pilot-50-drafts.json"),
    "utf8",
  );
  const drafts = JSON.parse(file) as PilotDraft[];

  return drafts.find((draft) => draft.id === draftId);
}

function markdownPreview(markdown: string) {
  return markdown
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 18)
    .map((line, index) => {
      if (line.startsWith("# ")) {
        return (
          <h1 className="text-3xl font-semibold leading-tight text-[#111827]" key={index}>
            {line.replace(/^#\s+/, "")}
          </h1>
        );
      }

      if (line.startsWith("## ")) {
        return (
          <h2 className="pt-3 text-xl font-semibold text-[#111827]" key={index}>
            {line.replace(/^##\s+/, "")}
          </h2>
        );
      }

      if (line.startsWith("### ")) {
        return (
          <h3 className="pt-2 text-base font-semibold text-[#123c3a]" key={index}>
            {line.replace(/^###\s+/, "")}
          </h3>
        );
      }

      if (line.startsWith("- ")) {
        return (
          <p className="pl-4 text-sm leading-6 text-[#374151]" key={index}>
            {line}
          </p>
        );
      }

      return (
        <p className="text-sm leading-6 text-[#374151]" key={index}>
          {line}
        </p>
      );
    });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#eef1ed] py-3 last:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6268]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-[#111827]">{value}</p>
    </div>
  );
}

export default async function AdminContentScaleDraftPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  const draft = await getDraft(draftId);

  if (!draft) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <Link
          className="text-sm font-semibold text-[#123c3a] hover:underline"
          href="/admin/content-scale"
        >
          Back to Content Scale
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Pilot draft preview
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827]">
          {draft.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
          This is a file-backed demo preview. It shows the direction of the AI
          content workflow before importing drafts into PostgreSQL.
        </p>
        <Link
          className="mt-5 inline-flex rounded-md bg-[#123c3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b4f49]"
          href={`/demo/content-scale/${draft.id}/`}
        >
          Open frontend demo
        </Link>
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="h-fit rounded-lg border border-[#d9ded7] bg-white p-5">
          <InfoRow label="Status" value={draft.status} />
          <InfoRow label="Market" value={`${draft.market} / ${draft.language}`} />
          <InfoRow label="Content type" value={draft.contentType} />
          <InfoRow label="Template" value={draft.template} />
          <InfoRow label="Target keyword" value={draft.targetKeyword} />
          <InfoRow label="Topic cluster" value={draft.topicCluster} />
          <InfoRow label="Canonical" value={draft.canonicalPath} />
        </aside>

        <article className="rounded-lg border border-[#d9ded7] bg-white p-6">
          <div className="border-b border-[#eef1ed] pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6268]">
              SEO preview
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#111827]">
              {draft.seoTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f6268]">
              {draft.metaDescription}
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#d9ded7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6268]">
                Schema
              </p>
              <p className="mt-2 text-sm text-[#111827]">
                {draft.schemaTypes.join(", ")}
              </p>
            </div>
            <div className="rounded-lg border border-[#d9ded7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6268]">
                Internal links
              </p>
              <p className="mt-2 text-sm text-[#111827]">
                {draft.internalLinkTargets.length} target
              </p>
            </div>
            <div className="rounded-lg border border-[#d9ded7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6268]">
                Affiliate tokens
              </p>
              <p className="mt-2 text-sm text-[#111827]">
                {draft.affiliateTokens.length} token
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">{markdownPreview(draft.body)}</div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">FAQ</h2>
          <div className="mt-3 divide-y divide-[#eef1ed]">
            {draft.faq.map((item) => (
              <div className="py-3" key={item.question}>
                <p className="font-semibold text-[#111827]">{item.question}</p>
                <p className="mt-1 text-sm leading-6 text-[#5f6268]">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">Controlled links</h2>
          <div className="mt-3 space-y-3">
            {draft.internalLinkTargets.map((target) => (
              <p className="text-sm text-[#5f6268]" key={target}>
                Internal target: <span className="font-medium text-[#111827]">{target}</span>
              </p>
            ))}
            {draft.affiliateTokens.map((token) => (
              <p
                className="text-sm text-[#5f6268]"
                key={`${token.market}-${token.broker}-${token.campaign}`}
              >
                Affiliate token:{" "}
                <span className="font-medium text-[#111827]">
                  {token.market}:{token.language}:{token.broker}:{token.campaign}
                </span>
              </p>
            ))}
            {draft.affiliateTokens.length === 0 ? (
              <p className="text-sm text-[#5f6268]">
                No affiliate token needed for this draft.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
