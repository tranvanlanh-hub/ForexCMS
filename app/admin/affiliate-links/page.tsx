import { AffiliateLinkStatus } from "@prisma/client";
import Link from "next/link";
import { DemoModeBanner } from "@/components/admin/demo-mode-banner";
import { affiliateLinkStatusLabels } from "@/lib/affiliate";
import { prisma } from "@/lib/db";
import { getDemoAffiliateRows, getDemoPilotDrafts } from "@/lib/demo/content-scale";

export const dynamic = "force-dynamic";

type AffiliateListItem = Awaited<ReturnType<typeof getAffiliateLinks>>[number];

async function getAffiliateLinks() {
  return prisma.affiliateLink.findMany({
    orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
    include: {
      broker: true,
      market: true,
    },
    take: 100,
  });
}

function statusClass(status: AffiliateLinkStatus) {
  if (status === AffiliateLinkStatus.ACTIVE) {
    return "border-[#b7dfca] bg-[#f0fdf6] text-[#166534]";
  }

  if (status === AffiliateLinkStatus.ARCHIVED || status === AffiliateLinkStatus.PAUSED) {
    return "border-[#d8dadd] bg-[#f4f4f5] text-[#52525b]";
  }

  return "border-[#f4d28c] bg-[#fffbeb] text-[#92400e]";
}

export default async function AdminAffiliateLinksPage() {
  let links: AffiliateListItem[] = [];
  let isDatabaseReady = true;

  try {
    links = await getAffiliateLinks();
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady) {
    const demoRows = getDemoAffiliateRows(await getDemoPilotDrafts());

    return (
      <div className="flex flex-col gap-6">
        <DemoModeBanner module="Affiliate Manager" />
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[#d9ded7] bg-white p-4">
            <p className="text-sm font-medium text-[#5f6268]">Demo tokens</p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">
              {demoRows.length}
            </p>
          </div>
          <div className="rounded-lg border border-[#d9ded7] bg-white p-4">
            <p className="text-sm font-medium text-[#5f6268]">Markets</p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">
              {new Set(demoRows.map((row) => row.market)).size}
            </p>
          </div>
          <div className="rounded-lg border border-[#d9ded7] bg-white p-4">
            <p className="text-sm font-medium text-[#5f6268]">Hard-coded URLs</p>
            <p className="mt-2 text-2xl font-semibold text-[#166534]">0</p>
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Token</th>
                  <th className="px-4 py-3 font-semibold">Broker</th>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">Draft usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1ed]">
                {demoRows.map((row) => (
                  <tr key={`${row.market}-${row.language}-${row.broker}-${row.campaign}`}>
                    <td className="px-4 py-4 font-semibold text-[#123c3a]">
                      {row.campaign}
                    </td>
                    <td className="px-4 py-4 text-[#374151]">{row.broker}</td>
                    <td className="px-4 py-4 text-[#374151]">
                      {row.market} / {row.language}
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {row.contentCount}
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
          Affiliate Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              Affiliate Links
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Keep campaign destinations centralized so content uses tokens
              instead of raw URLs.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
            href="/admin/affiliate-links/new"
          >
            New link
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Draft", links.filter((link) => link.status === "DRAFT").length],
          ["Active", links.filter((link) => link.status === "ACTIVE").length],
          ["Paused", links.filter((link) => link.status === "PAUSED").length],
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
        {links.length === 0 ? (
          <div className="p-6">
            <h2 className="text-base font-semibold text-[#111827]">
              No affiliate links yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f6268]">
              Create a broker and market first, then add campaign links here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Broker</th>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1ed]">
                {links.map((link) => (
                  <tr className="align-top" key={link.id}>
                    <td className="px-4 py-4">
                      <Link
                        className="font-semibold text-[#123c3a] hover:underline"
                        href={`/admin/affiliate-links/${link.id}/edit`}
                      >
                        {link.campaign}
                      </Link>
                      <p className="mt-1 text-xs text-[#5f6268]">
                        {link.languageCode}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {link.broker.name}
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {link.market.code}
                      <span className="block text-xs text-[#5f6268]">
                        {link.market.locale}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={[
                          "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                          statusClass(link.status),
                        ].join(" ")}
                      >
                        {affiliateLinkStatusLabels[link.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {link.priority}
                    </td>
                    <td className="max-w-sm truncate px-4 py-4 text-[#5f6268]">
                      {link.destinationUrl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
