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
  internalLinkTargets: string[];
  affiliateTokens: unknown[];
};

type BatchPlanRow = {
  id: string;
  status: string;
  market: string;
  topicCluster: string;
  suggestedContentType: string;
};

type RejectReport = {
  generatedAt: string;
  dryRun: boolean;
  maxSize: number;
  totalItems: number;
  acceptedCount: number;
  rejectedCount: number;
  rejectedItems: Array<{
    id: string;
    title: string;
    canonicalPath: string;
    reasons: string[];
  }>;
};

async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-lg border border-[#d9ded7] bg-white p-4">
      <p className="text-sm font-medium text-[#5f6268]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#111827]">{value}</p>
    </article>
  );
}

function DistributionTable({
  rows,
  title,
}: {
  rows: Record<string, number>;
  title: string;
}) {
  const entries = Object.entries(rows).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
      <div className="border-b border-[#d9ded7] px-5 py-4">
        <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
      </div>
      <div className="divide-y divide-[#eef1ed]">
        {entries.map(([label, count]) => (
          <div className="flex items-center justify-between px-5 py-3" key={label}>
            <span className="text-sm text-[#111827]">{label}</span>
            <span className="text-sm font-semibold text-[#123c3a]">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminContentScalePage() {
  const [pilotDrafts, batchPlan, rejectReport] = await Promise.all([
    readJsonFile<PilotDraft[]>(
      join(process.cwd(), "data", "ai-content", "pilot-50-drafts.json"),
      [],
    ),
    readJsonFile<BatchPlanRow[]>(
      join(process.cwd(), "data", "ai-content", "batch-250-plan.json"),
      [],
    ),
    readJsonFile<RejectReport | null>(
      join(process.cwd(), "data", "ai-content", "last-batch-reject-report.json"),
      null,
    ),
  ]);
  const draftStatuses = [...new Set(pilotDrafts.map((item) => item.status))];
  const planStatuses = [...new Set(batchPlan.map((item) => item.status))];
  const affiliateTokenCount = pilotDrafts.reduce(
    (sum, item) => sum + item.affiliateTokens.length,
    0,
  );
  const internalLinkTargetCount = pilotDrafts.reduce(
    (sum, item) => sum + item.internalLinkTargets.length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Content Scale
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827]">
          Checkpoints 16-30
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
          This page shows the AI content schema, 50-item pilot, audit gate,
          planned large batch, operations notes, and AI batch safety status.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pilot draft items" value={pilotDrafts.length} />
        <StatCard label="Pilot statuses" value={draftStatuses.join(", ") || "Missing"} />
        <StatCard label="Planned batch rows" value={batchPlan.length} />
        <StatCard label="Batch status" value={planStatuses.join(", ") || "Missing"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">
            AI batch safety
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Batch size limit"
              value={rejectReport?.maxSize ?? 50}
            />
            <StatCard
              label="Accepted"
              value={rejectReport?.acceptedCount ?? "Run validation"}
            />
            <StatCard
              label="Rejected"
              value={rejectReport?.rejectedCount ?? "Run validation"}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#5f6268]">
            Batch validation is dry-run by default and writes a reject report.
            Accepted items can only enter the CMS as drafts through the import
            workflow; bulk publish remains unavailable.
          </p>
        </div>

        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">
            Reject report
          </h2>
          {!rejectReport ? (
            <p className="mt-3 text-sm leading-6 text-[#5f6268]">
              No reject report has been generated yet.
            </p>
          ) : rejectReport.rejectedItems.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-[#166534]">
              Last dry-run accepted all {rejectReport.totalItems} items at{" "}
              {rejectReport.generatedAt}.
            </p>
          ) : (
            <div className="mt-3 max-h-72 overflow-auto divide-y divide-[#eef1ed]">
              {rejectReport.rejectedItems.slice(0, 10).map((item) => (
                <div className="py-3 text-sm" key={item.id}>
                  <p className="font-semibold text-[#111827]">
                    {item.title || item.id}
                  </p>
                  <p className="mt-1 text-xs text-[#5f6268]">
                    {item.canonicalPath}
                  </p>
                  <p className="mt-2 text-[#9a3412]">
                    {item.reasons.join(" ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DistributionTable
          rows={countBy(pilotDrafts, (item) => item.market)}
          title="Pilot by market"
        />
        <DistributionTable
          rows={countBy(pilotDrafts, (item) => item.contentType)}
          title="Pilot by content type"
        />
        <DistributionTable
          rows={countBy(pilotDrafts, (item) => item.topicCluster)}
          title="Pilot by topic cluster"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">Audit gate</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label="Affiliate tokens in pilot" value={affiliateTokenCount} />
            <StatCard label="Internal link targets" value={internalLinkTargetCount} />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#5f6268]">
            Last local audit command passed with 0 errors and 0 warnings. DB-backed
            import and smoke tests still require a reachable PostgreSQL database.
          </p>
        </div>

        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">Scale decision</h2>
          <p className="mt-3 text-sm leading-6 text-[#5f6268]">
            The 250-row batch is planned-only. Real draft creation stays blocked
            until AI import, SEO validation, internal links, affiliate validation,
            and PostgreSQL smoke tests are green.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              className="rounded-md border border-[#cbd5ce] bg-white px-4 py-2 text-sm font-semibold text-[#123c3a] hover:border-[#0f766e]"
              href="/admin/ai-import"
            >
              Open AI Import
            </Link>
            <Link
              className="rounded-md border border-[#cbd5ce] bg-white px-4 py-2 text-sm font-semibold text-[#123c3a] hover:border-[#0f766e]"
              href="/admin/analytics"
            >
              Open Quality Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
        <div className="border-b border-[#d9ded7] px-5 py-4">
          <h2 className="text-base font-semibold text-[#111827]">
            Recent pilot drafts
          </h2>
        </div>
        <div className="divide-y divide-[#eef1ed]">
          {pilotDrafts.slice(0, 10).map((item) => (
            <div
              className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[1fr_160px_120px_96px]"
              key={item.id}
            >
              <div>
                <Link
                  className="font-semibold text-[#123c3a] hover:underline"
                  href={`/admin/content-scale/${item.id}`}
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-xs text-[#5f6268]">{item.canonicalPath}</p>
              </div>
              <p className="text-[#5f6268]">{item.market} / {item.language}</p>
              <p className="font-medium text-[#123c3a]">{item.contentType}</p>
            <Link
              className="w-fit rounded-md border border-[#cbd5ce] bg-white px-3 py-2 text-xs font-semibold text-[#123c3a] hover:border-[#0f766e]"
                href={`/demo/content-scale/${item.id}/`}
            >
                Frontend
            </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
