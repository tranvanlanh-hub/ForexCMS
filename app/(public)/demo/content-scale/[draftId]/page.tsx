import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MarkdownContent } from "@/lib/content/markdown";
import { stringifyJsonLd } from "@/lib/seo";

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

async function getDrafts() {
  const file = await readFile(
    join(process.cwd(), "data", "ai-content", "pilot-50-drafts.json"),
    "utf8",
  );

  return JSON.parse(file) as PilotDraft[];
}

async function getDraft(draftId: string) {
  const drafts = await getDrafts();

  return {
    draft: drafts.find((item) => item.id === draftId),
    drafts,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ draftId: string }>;
}): Promise<Metadata> {
  const { draftId } = await params;
  const { draft } = await getDraft(draftId);

  if (!draft) {
    return {
      title: "Demo draft not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: draft.seoTitle,
    description: draft.metaDescription,
    robots: { index: false, follow: false },
  };
}

function getDemoInternalLinks(draft: PilotDraft, drafts: PilotDraft[]) {
  return draft.internalLinkTargets
    .map((targetPath) => {
      const target = drafts.find((item) => item.canonicalPath === targetPath);

      if (!target) return null;

      return {
        anchorText: target.title,
        maxLinksPerContent: 6,
        minWordsBetweenLinks: 80,
        score: 90,
        targetPath: `/demo/content-scale/${target.id}/`,
        targetTitle: target.title,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function buildDemoJsonLd(draft: PilotDraft) {
  return draft.schemaTypes.map((type) => ({
    "@context": "https://schema.org",
    "@type": type,
    name: draft.seoTitle,
    description: draft.metaDescription,
    inLanguage: draft.language,
    url: draft.canonicalPath,
  }));
}

export default async function ContentScaleDemoPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  const { draft, drafts } = await getDraft(draftId);

  if (!draft) {
    notFound();
  }

  const demoInternalLinks = getDemoInternalLinks(draft, drafts);
  const jsonLdSchemas = buildDemoJsonLd(draft);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <Link className="text-sm font-semibold text-[#123c3a]" href="/">
            MarketGB
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-[#5f6268]">
            <Link className="hover:text-[#123c3a]" href="/demo/content-scale/">
              Demo list
            </Link>
            <Link className="hover:text-[#123c3a]" href="/admin/content-scale">
              Admin view
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_320px] lg:px-8">
        <article className="min-w-0">
          <div className="rounded-md border border-[#f0d38a] bg-[#fff8e6] px-4 py-3 text-sm font-semibold text-[#7a4d00]">
            Demo draft only. This page is not published from the CMS database.
          </div>

          <nav className="mt-8 text-sm font-medium text-[#5f6268]">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link className="hover:text-[#123c3a]" href="/">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link className="hover:text-[#123c3a]" href="/demo/content-scale/">
                  Content scale demo
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>{draft.market}</li>
            </ol>
          </nav>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
            {draft.market} / {draft.contentType} / {draft.topicCluster}
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#111827] sm:text-5xl">
            {draft.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#5f6268]">
            {draft.metaDescription}
          </p>

          {draft.affiliateTokens.length > 0 ? (
            <div className="mt-7 rounded-md border border-[#d9ded7] bg-white p-5">
              <h2 className="text-base font-semibold text-[#111827]">
                CTA token preview
              </h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {draft.affiliateTokens.map((token) => (
                  <span
                    className="rounded-md bg-[#123c3a] px-4 py-2 text-sm font-semibold text-white"
                    key={`${token.market}-${token.language}-${token.broker}-${token.campaign}`}
                  >
                    {token.market}:{token.language}:{token.broker}:{token.campaign}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 border-t border-[var(--border)] pt-3">
            <MarkdownContent
              internalLinks={demoInternalLinks}
              markdown={draft.body}
            />
          </div>
        </article>

        <aside className="h-fit rounded-lg border border-[#d9ded7] bg-white p-5 lg:sticky lg:top-6">
          <h2 className="text-base font-semibold text-[#111827]">
            Demo checks
          </h2>
          <dl className="mt-4 divide-y divide-[#eef1ed] text-sm">
            <div className="py-3">
              <dt className="font-semibold text-[#5f6268]">Status</dt>
              <dd className="mt-1 text-[#111827]">{draft.status}</dd>
            </div>
            <div className="py-3">
              <dt className="font-semibold text-[#5f6268]">Canonical</dt>
              <dd className="mt-1 break-words text-[#111827]">
                {draft.canonicalPath}
              </dd>
            </div>
            <div className="py-3">
              <dt className="font-semibold text-[#5f6268]">Target keyword</dt>
              <dd className="mt-1 text-[#111827]">{draft.targetKeyword}</dd>
            </div>
            <div className="py-3">
              <dt className="font-semibold text-[#5f6268]">Schema types</dt>
              <dd className="mt-1 text-[#111827]">
                {draft.schemaTypes.join(", ")}
              </dd>
            </div>
            <div className="py-3">
              <dt className="font-semibold text-[#5f6268]">Internal targets</dt>
              <dd className="mt-1 space-y-2 text-[#111827]">
                {draft.internalLinkTargets.map((target) => (
                  <p className="break-words" key={target}>{target}</p>
                ))}
              </dd>
            </div>
          </dl>
        </aside>

        {jsonLdSchemas.map((schema, index) => (
          <script
            dangerouslySetInnerHTML={{ __html: stringifyJsonLd(schema) }}
            key={index}
            type="application/ld+json"
          />
        ))}
      </main>
    </div>
  );
}
