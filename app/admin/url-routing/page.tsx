import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { CsrfField } from "@/components/admin/csrf-field";
import { prisma } from "@/lib/db";
import { createContentAliasAction, toggleContentAliasAction } from "./actions";

export const dynamic = "force-dynamic";
const pageSize = 25;

export default async function UrlRoutingPage({ searchParams }: {
  searchParams: Promise<{ error?: string; marketId?: string; page?: string; q?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const where: Prisma.ContentUrlWhereInput = {};
  if (params.marketId) where.marketId = params.marketId;
  if (params.q?.trim()) where.OR = [
    { path: { contains: params.q.trim(), mode: "insensitive" } },
    { contentItem: { title: { contains: params.q.trim(), mode: "insensitive" } } },
  ];

  const [items, total, markets, targets] = await Promise.all([
    prisma.contentUrl.findMany({
      where,
      include: { contentItem: { include: { market: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contentUrl.count({ where }),
    prisma.market.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.contentItem.findMany({ orderBy: { title: "asc" }, take: 250, select: { id: true, title: true, canonicalPath: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return <div className="flex flex-col gap-6">
    <section className="border-b border-[#d9ded7] pb-5">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">URL Manager</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#111827]">Redirect history</h1>
      <p className="mt-2 text-sm text-[#5f6268]">Published URL changes redirect permanently to the current canonical URL.</p>
    </section>
    {params.error && <p className="editor-alert error">{params.error}</p>}
    {params.saved && <p className="editor-alert success">URL routing was updated.</p>}

    <form className="grid gap-3 rounded-lg border border-[#d9ded7] bg-white p-4 sm:grid-cols-[1fr_220px_auto]">
      <input className="rounded-md border border-[#d9ded7] px-3 py-2 text-sm" defaultValue={params.q} name="q" placeholder="Search URL or content title" />
      <select className="rounded-md border border-[#d9ded7] px-3 py-2 text-sm" defaultValue={params.marketId} name="marketId">
        <option value="">All markets</option>{markets.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
      </select>
      <button className="button button-outline" type="submit">Filter</button>
    </form>

    <form action={createContentAliasAction} className="grid gap-3 rounded-lg border border-[#d9ded7] bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
      <CsrfField />
      <label className="text-xs font-semibold text-[#4c6055]">Old URL path<input className="mt-2 block w-full rounded-md border border-[#d9ded7] px-3 py-2 text-sm" name="path" placeholder="/global/guides/old-slug/" required /></label>
      <label className="text-xs font-semibold text-[#4c6055]">Redirect to<select className="mt-2 block w-full rounded-md border border-[#d9ded7] px-3 py-2 text-sm" name="contentItemId" required><option value="">Choose content</option>{targets.map(t => <option key={t.id} value={t.id}>{t.title} — {t.canonicalPath}</option>)}</select></label>
      <button className="button self-end" type="submit">Add alias</button>
    </form>

    <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
      <div className="overflow-x-auto"><table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]"><tr><th className="px-4 py-3">Path</th><th className="px-4 py-3">Destination</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">State</th><th className="px-4 py-3">Action</th></tr></thead>
        <tbody className="divide-y divide-[#eef1ed]">{items.map(item => {
          const current = item.path === item.contentItem.canonicalPath;
          const available = item.contentItem.status === "PUBLISHED" && item.contentItem.market.status === "ACTIVE";
          return <tr key={item.id} className="align-top"><td className="px-4 py-4 font-mono text-xs">{item.path}</td><td className="px-4 py-4"><Link className="font-semibold text-[#123c3a] hover:underline" href={`/admin/content/${item.contentItemId}/edit`}>{item.contentItem.title}</Link><p className="mt-1 text-xs text-[#5f6268]">{item.contentItem.canonicalPath}</p></td><td className="px-4 py-4 text-xs">{item.source.toLowerCase()}</td><td className="px-4 py-4 text-xs">{current ? "Canonical" : item.redirectEnabled && available ? "Redirecting" : item.redirectEnabled ? "Target unavailable" : "Disabled"}</td><td className="px-4 py-4">{!current && <form action={toggleContentAliasAction}><CsrfField/><input type="hidden" name="id" value={item.id}/><button className="text-xs font-semibold text-[#0f766e] hover:underline" type="submit">{item.redirectEnabled ? "Disable" : "Enable"}</button></form>}</td></tr>;
        })}{items.length === 0 && <tr><td className="px-4 py-8 text-center text-[#5f6268]" colSpan={5}>No URL records found.</td></tr>}</tbody>
      </table></div>
    </section>
    <div className="flex items-center justify-between text-sm text-[#5f6268]"><span>{total} URL records</span><div className="flex gap-3">{page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}<span>Page {page} of {pages}</span>{page < pages && <Link href={`?page=${page + 1}`}>Next →</Link>}</div></div>
  </div>;
}
