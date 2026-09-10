import { ContentStatus, ContentType, type Prisma } from "@prisma/client";
import Link from "next/link";
import { bulkUpdateContentStatusAction } from "@/app/admin/content/actions";
import { DemoModeBanner } from "@/components/admin/demo-mode-banner";
import {
  contentStatusLabels,
  contentTypeLabels,
  getMarkdownBody,
} from "@/lib/content";
import { prisma } from "@/lib/db";
import { getDemoPilotDrafts, type DemoPilotDraft } from "@/lib/demo/content-scale";
import { logEvent } from "@/lib/observability/logging";

export const dynamic = "force-dynamic";

type ContentListItem = Awaited<ReturnType<typeof getContentItems>>["items"][number];

const pageSize = 25;

function readEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined {
  return value && allowed.includes(value as T) ? (value as T) : undefined;
}

type ContentListFilters = {
  contentType?: ContentType;
  marketId?: string;
  page: number;
  query?: string;
  status?: ContentStatus;
  templateId?: string;
};

async function getContentItems(filters: ContentListFilters) {
  const where: Prisma.ContentItemWhereInput = {};

  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { slug: { contains: filters.query, mode: "insensitive" } },
      { canonicalPath: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  if (filters.marketId) where.marketId = filters.marketId;
  if (filters.templateId) where.templateId = filters.templateId;
  if (filters.status) where.status = filters.status;
  if (filters.contentType) where.contentType = filters.contentType;

  const [items, total, markets, templates] = await Promise.all([
    prisma.contentItem.findMany({
      where,
    orderBy: { updatedAt: "desc" },
    include: {
      market: true,
      template: true,
      seoMetadata: true,
      translationGroup: true,
    },
      take: pageSize,
      skip: (filters.page - 1) * pageSize,
    }),
    prisma.contentItem.count({ where }),
    prisma.market.findMany({
      orderBy: [{ isGlobal: "desc" }, { code: "asc" }],
      select: { id: true, code: true, name: true },
    }),
    prisma.template.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, key: true },
    }),
  ]);

  return { items, markets, templates, total };
}

function statusClass(status: ContentStatus) {
  if (status === ContentStatus.PUBLISHED) {
    return "border-[#b7dfca] bg-[#f0fdf6] text-[#166534]";
  }

  if (status === ContentStatus.ARCHIVED) {
    return "border-[#d8dadd] bg-[#f4f4f5] text-[#52525b]";
  }

  if (status === ContentStatus.REVIEW) {
    return "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]";
  }

  return "border-[#f4d28c] bg-[#fffbeb] text-[#92400e]";
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    bulkSaved?: string;
    contentType?: string;
    error?: string;
    marketId?: string;
    page?: string;
    q?: string;
    status?: string;
    templateId?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const filters: ContentListFilters = {
    contentType: readEnum(params.contentType, Object.values(ContentType)),
    marketId: params.marketId || undefined,
    page,
    query: params.q?.trim() || undefined,
    status: readEnum(params.status, Object.values(ContentStatus)),
    templateId: params.templateId || undefined,
  };
  const returnParams = new URLSearchParams();
  if (filters.query) returnParams.set("q", filters.query);
  if (filters.marketId) returnParams.set("marketId", filters.marketId);
  if (filters.status) returnParams.set("status", filters.status);
  if (filters.contentType) returnParams.set("contentType", filters.contentType);
  if (filters.templateId) returnParams.set("templateId", filters.templateId);
  if (page > 1) returnParams.set("page", String(page));
  const returnPath = `/admin/content${returnParams.size ? `?${returnParams}` : ""}`;

  let items: ContentListItem[] = [];
  let markets: Awaited<ReturnType<typeof getContentItems>>["markets"] = [];
  let templates: Awaited<ReturnType<typeof getContentItems>>["templates"] = [];
  let total = 0;
  let demoDrafts: DemoPilotDraft[] = [];
  let isDatabaseReady = true;

  try {
    const data = await getContentItems(filters);
    items = data.items;
    markets = data.markets;
    templates = data.templates;
    total = data.total;
  } catch (error) {
    logEvent("error", "admin_content_database_unreachable", { error });
    isDatabaseReady = false;
    demoDrafts = await getDemoPilotDrafts();
  }

  if (!isDatabaseReady) {
    return (
      <div className="flex flex-col gap-6">
        <section className="border-b border-[#d9ded7] pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
            Content Manager
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827]">
            Content
          </h1>
        </section>
        <DemoModeBanner module="Content Manager" />
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Demo drafts", demoDrafts.length],
            ["Markets", new Set(demoDrafts.map((draft) => draft.market)).size],
            [
              "Frontend previews",
              demoDrafts.filter((draft) => draft.status === "DRAFT").length,
            ],
          ].map(([label, value]) => (
            <div
              className="rounded-lg border border-[#d9ded7] bg-white p-4"
              key={label}
            >
              <p className="text-sm font-medium text-[#5f6268]">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">
                {value}
              </p>
            </div>
          ))}
        </section>
        <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">SEO</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1ed]">
                {demoDrafts.slice(0, 50).map((draft) => (
                  <tr className="align-top" key={draft.id}>
                    <td className="px-4 py-4">
                      <Link
                        className="font-semibold text-[#123c3a] hover:underline"
                        href={`/demo/content-scale/${draft.id}/`}
                      >
                        {draft.title}
                      </Link>
                      <p className="mt-1 text-xs text-[#5f6268]">
                        {draft.canonicalPath}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {draft.market}
                      <span className="block text-xs text-[#5f6268]">
                        {draft.language}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {draft.contentType}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-[#166534]">
                      Ready
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-md border border-[#f4d28c] bg-[#fffbeb] px-2 py-1 text-xs font-semibold text-[#92400e]">
                        {draft.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Content Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              Content
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Manage market-scoped content with templates, publishing status,
              canonical paths, and SEO metadata.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
            href="/admin/content/new"
          >
            New content
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Draft", items.filter((item) => item.status === "DRAFT").length],
          ["Review", items.filter((item) => item.status === "REVIEW").length],
          [
            "Published",
            items.filter((item) => item.status === "PUBLISHED").length,
          ],
          [
            "Archived",
            items.filter((item) => item.status === "ARCHIVED").length,
          ],
        ].map(([label, value]) => (
          <div
            className="rounded-lg border border-[#d9ded7] bg-white p-4"
            key={label}
          >
            <p className="text-sm font-medium text-[#5f6268]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">
              {value}
            </p>
          </div>
        ))}
      </section>

      {params.error ? (
        <div className="rounded-md border border-[#f0b8a8] bg-[#fff7f4] px-4 py-3 text-sm font-medium leading-6 text-[#9a3412]">
          {params.error}
        </div>
      ) : null}

      {params.bulkSaved === "1" ? (
        <div className="rounded-md border border-[#b7dfca] bg-[#f0fdf6] px-4 py-3 text-sm font-medium leading-6 text-[#166534]">
          Bulk update saved.
        </div>
      ) : null}

      <form
        action="/admin/content"
        className="grid gap-3 rounded-lg border border-[#d9ded7] bg-white p-4 md:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))_auto]"
      >
        <input
          className="h-10 rounded-md border border-[#cbd5ce] px-3 text-sm outline-none transition focus:border-[#0f766e]"
          defaultValue={filters.query}
          name="q"
          placeholder="Search title, slug, canonical"
        />
        <select
          className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none transition focus:border-[#0f766e]"
          defaultValue={filters.marketId ?? ""}
          name="marketId"
        >
          <option value="">All markets</option>
          {markets.map((market) => (
            <option key={market.id} value={market.id}>
              {market.code} - {market.name}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none transition focus:border-[#0f766e]"
          defaultValue={filters.status ?? ""}
          name="status"
        >
          <option value="">All statuses</option>
          {Object.values(ContentStatus).map((status) => (
            <option key={status} value={status}>
              {contentStatusLabels[status]}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none transition focus:border-[#0f766e]"
          defaultValue={filters.contentType ?? ""}
          name="contentType"
        >
          <option value="">All types</option>
          {Object.values(ContentType).map((type) => (
            <option key={type} value={type}>
              {contentTypeLabels[type]}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none transition focus:border-[#0f766e]"
          defaultValue={filters.templateId ?? ""}
          name="templateId"
        >
          <option value="">All templates</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <button
          className="h-10 rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
          type="submit"
        >
          Filter
        </button>
      </form>

      <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
        {items.length === 0 ? (
          <div className="p-6">
            <h2 className="text-base font-semibold text-[#111827]">
              No content yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f6268]">
              Create the first draft after market and template seed data are
              available.
            </p>
          </div>
        ) : (
          <form action={bulkUpdateContentStatusAction}>
            <input name="returnPath" type="hidden" value={returnPath} />
            <div className="flex flex-col gap-3 border-b border-[#d9ded7] bg-[#fbfcfb] px-4 py-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-medium text-[#5f6268]">
                Showing {items.length} of {total} content items
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  className="h-10 rounded-md border border-[#cbd5ce] bg-white px-3 text-sm outline-none transition focus:border-[#0f766e]"
                  defaultValue={ContentStatus.REVIEW}
                  name="bulkStatus"
                >
                  <option value={ContentStatus.REVIEW}>Move to review</option>
                  <option value={ContentStatus.DRAFT}>Move to draft</option>
                  <option value={ContentStatus.ARCHIVED}>Archive</option>
                </select>
                <button
                  className="h-10 rounded-md border border-[#cbd5ce] bg-white px-4 text-sm font-semibold text-[#111827] transition hover:border-[#0f766e]"
                  type="submit"
                >
                  Apply to selected
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Select</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Template</th>
                  <th className="px-4 py-3 font-semibold">Group</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">SEO</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1ed]">
                {items.map((item) => {
                  const hasBody = Boolean(getMarkdownBody(item.body));
                  const hasSeo = Boolean(
                    item.seoMetadata?.title && item.seoMetadata.description,
                  );

                  return (
                    <tr className="align-top" key={item.id}>
                      <td className="px-4 py-4">
                        <input
                          aria-label={`Select ${item.title}`}
                          className="h-4 w-4 rounded border-[#cbd5ce]"
                          name="contentId"
                          type="checkbox"
                          value={item.id}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          className="font-semibold text-[#123c3a] hover:underline"
                          href={`/admin/content/${item.id}/edit`}
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-xs text-[#5f6268]">
                          {item.canonicalPath}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-[#374151]">
                        {item.market.code}
                        <span className="block text-xs text-[#5f6268]">
                          {item.market.locale}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#374151]">
                        {contentTypeLabels[item.contentType]}
                      </td>
                      <td className="px-4 py-4 text-[#374151]">
                        {item.template.name}
                      </td>
                      <td className="px-4 py-4 text-[#374151]">
                        {item.translationGroup?.key ?? "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                            statusClass(item.status),
                          ].join(" ")}
                        >
                          {item.status === ContentStatus.REVIEW
                            ? "Review"
                            : contentStatusLabels[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-[#374151]">
                        {hasSeo && hasBody ? "Ready" : "Missing fields"}
                      </td>
                      <td className="px-4 py-4 text-[#5f6268]">
                        {item.updatedAt.toLocaleDateString("en-US")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </form>
        )}
      </section>

      {total > pageSize ? (
        <nav className="flex items-center justify-between text-sm">
          <Link
            aria-disabled={page <= 1}
            className={[
              "rounded-md border border-[#cbd5ce] bg-white px-4 py-2 font-semibold text-[#111827]",
              page <= 1 ? "pointer-events-none opacity-50" : "hover:border-[#0f766e]",
            ].join(" ")}
            href={`/admin/content?${new URLSearchParams({
              ...Object.fromEntries(returnParams),
              page: String(Math.max(1, page - 1)),
            })}`}
          >
            Previous
          </Link>
          <span className="font-medium text-[#5f6268]">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <Link
            aria-disabled={page >= Math.ceil(total / pageSize)}
            className={[
              "rounded-md border border-[#cbd5ce] bg-white px-4 py-2 font-semibold text-[#111827]",
              page >= Math.ceil(total / pageSize)
                ? "pointer-events-none opacity-50"
                : "hover:border-[#0f766e]",
            ].join(" ")}
            href={`/admin/content?${new URLSearchParams({
              ...Object.fromEntries(returnParams),
              page: String(Math.min(Math.ceil(total / pageSize), page + 1)),
            })}`}
          >
            Next
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
