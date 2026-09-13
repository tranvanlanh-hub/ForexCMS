import { AiImportForm } from "@/app/admin/ai-import/ai-import-form";
import { prisma } from "@/lib/db";
import { getCsrfToken } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

async function getReadiness() {
  const [marketCount, templateCount] = await Promise.all([
    prisma.market.count({ where: { status: "ACTIVE" } }),
    prisma.template.count({ where: { isActive: true } }),
  ]);

  return { marketCount, templateCount };
}

export default async function AdminAiImportPage() {
  const csrfToken = await getCsrfToken();
  let isDatabaseReady = true;
  let readiness: Awaited<ReturnType<typeof getReadiness>> | null = null;

  try {
    readiness = await getReadiness();
  } catch {
    isDatabaseReady = false;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          AI Import
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              Import AI draft
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Validate JSON or Markdown frontmatter before creating a CMS draft.
              Publishing stays in Content Manager after validation.
            </p>
          </div>
        </div>
      </section>

      {!isDatabaseReady ? (
        <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
          <h2 className="text-base font-semibold text-[#9a3412]">
            Database is not ready
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#9a3412]">
            Connect PostgreSQL and run the Prisma migration before importing
            drafts.
          </p>
        </div>
      ) : readiness?.marketCount === 0 || readiness?.templateCount === 0 ? (
        <div className="rounded-lg border border-[#f4d28c] bg-[#fffbeb] p-5">
          <h2 className="text-base font-semibold text-[#92400e]">
            Seed data needed
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#92400e]">
            Create at least one active market and one active template before
            importing AI drafts.
          </p>
        </div>
      ) : (
        <AiImportForm csrfToken={csrfToken} />
      )}
    </div>
  );
}
