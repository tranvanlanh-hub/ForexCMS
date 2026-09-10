import Link from "next/link";
import { DemoModeBanner } from "@/components/admin/demo-mode-banner";
import { getDemoPilotDrafts } from "@/lib/demo/content-scale";
import { getSeoAuditReport, type SeoAuditIssue } from "@/lib/seo/audit";

export const dynamic = "force-dynamic";

const issueLabels: Record<SeoAuditIssue["type"], string> = {
  canonical_mismatch: "Canonical mismatch",
  hreflang_gap: "Hreflang gap",
  missing_faq: "Missing FAQ",
  missing_schema: "Missing schema readiness",
  missing_title_meta: "Missing title/meta",
  multiple_h1: "Multiple H1 risk",
  orphan_content: "Orphan content",
  sitemap_exclusion: "Sitemap exclusion",
};

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[#d9ded7] bg-white p-4">
      <p className="text-sm font-medium text-[#5f6268]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#111827]">{value}</p>
    </div>
  );
}

function severityClass(severity: SeoAuditIssue["severity"]) {
  return severity === "error"
    ? "border-[#f0b8a8] bg-[#fff7f4] text-[#9a3412]"
    : "border-[#f4d28c] bg-[#fffbeb] text-[#92400e]";
}

export default async function AdminSeoPage() {
  let report: Awaited<ReturnType<typeof getSeoAuditReport>> | null = null;

  try {
    report = await getSeoAuditReport();
  } catch {
    report = null;
  }

  if (report) {
    const errorCount = report.issues.filter((issue) => issue.severity === "error").length;
    const warningCount = report.issues.filter(
      (issue) => issue.severity === "warning",
    ).length;
    return (
      <div className="flex flex-col gap-6">
        <section className="border-b border-[#d9ded7] pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
            SEO / AEO / GEO Audit
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827]">
            Audit dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
            Checks published active-market content for metadata, schema,
            canonical, hreflang, FAQ, orphan pages, and sitemap inclusion.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Published scanned" value={report.scannedContentCount} />
          <Metric label="Sitemap eligible" value={report.sitemapEligibleCount} />
          <Metric label="Errors" value={errorCount} />
          <Metric label="Warnings" value={warningCount} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(report.issueCounts).map(([type, count]) => (
            <Metric
              key={type}
              label={issueLabels[type as SeoAuditIssue["type"]]}
              value={count}
            />
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="border-b border-[#d9ded7] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">
              Audit issues
            </h2>
            <p className="mt-1 text-xs text-[#5f6268]">
              Generated {report.generatedAt.toISOString()}
            </p>
          </div>
          {report.issues.length === 0 ? (
            <div className="p-5 text-sm leading-6 text-[#166534]">
              No SEO/AEO/GEO issues found in this scan.
            </div>
          ) : (
            <div className="divide-y divide-[#eef1ed]">
              {report.issues.slice(0, 100).map((issue, index) => (
                <div
                  className="grid gap-3 px-5 py-4 text-sm lg:grid-cols-[180px_1fr_180px]"
                  key={`${issue.contentId}-${issue.type}-${index}`}
                >
                  <div>
                    <span
                      className={[
                        "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                        severityClass(issue.severity),
                      ].join(" ")}
                    >
                      {issueLabels[issue.type]}
                    </span>
                    <p className="mt-2 text-xs font-medium uppercase text-[#5f6268]">
                      {issue.market}
                    </p>
                  </div>
                  <div>
                    <Link
                      className="font-semibold text-[#123c3a] hover:underline"
                      href={`/admin/content/${issue.contentId}/edit`}
                    >
                      {issue.title}
                    </Link>
                    <p className="mt-1 text-xs text-[#5f6268]">
                      {issue.canonicalPath}
                    </p>
                    <p className="mt-2 leading-6 text-[#374151]">
                      {issue.message}
                    </p>
                  </div>
                  <Link
                    className="h-fit w-fit rounded-md border border-[#cbd5ce] bg-white px-3 py-2 text-xs font-semibold text-[#123c3a] hover:border-[#0f766e]"
                    href={issue.canonicalPath}
                  >
                    View page
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  const demoDrafts = await getDemoPilotDrafts();

  return (
    <div className="flex flex-col gap-6">
      <DemoModeBanner module="SEO Audit" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Demo drafts available" value={demoDrafts.length} />
        <Metric label="Missing title/meta" value={0} />
        <Metric label="Canonical mismatches" value={0} />
        <Metric label="Hard-coded affiliate URLs" value={0} />
      </section>
    </div>
  );
}
