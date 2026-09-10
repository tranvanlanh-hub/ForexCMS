import { MarketStatus } from "@prisma/client";
import Link from "next/link";
import { DemoModeBanner } from "@/components/admin/demo-mode-banner";
import { marketStatusLabels } from "@/lib/market";
import { prisma } from "@/lib/db";
import { getDemoMarkets, getDemoPilotDrafts } from "@/lib/demo/content-scale";

export const dynamic = "force-dynamic";

type MarketListItem = Awaited<ReturnType<typeof getMarkets>>[number];

async function getMarkets() {
  return prisma.market.findMany({
    orderBy: [{ isGlobal: "desc" }, { code: "asc" }],
    include: {
      _count: {
        select: {
          affiliateLinks: true,
          contentItems: true,
        },
      },
    },
  });
}

function statusClass(status: MarketStatus) {
  if (status === MarketStatus.ACTIVE) {
    return "border-[#b7dfca] bg-[#f0fdf6] text-[#166534]";
  }

  return "border-[#d8dadd] bg-[#f4f4f5] text-[#52525b]";
}

export default async function AdminMarketsPage() {
  let markets: MarketListItem[] = [];
  let isDatabaseReady = true;

  try {
    markets = await getMarkets();
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady) {
    const demoMarkets = getDemoMarkets(await getDemoPilotDrafts());

    return (
      <div className="flex flex-col gap-6">
        <DemoModeBanner module="Market Manager" />
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[#d9ded7] bg-white p-4">
            <p className="text-sm font-medium text-[#5f6268]">Demo markets</p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">
              {demoMarkets.length}
            </p>
          </div>
          <div className="rounded-lg border border-[#d9ded7] bg-white p-4">
            <p className="text-sm font-medium text-[#5f6268]">Languages</p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">
              {new Set(demoMarkets.map((market) => market.language)).size}
            </p>
          </div>
          <div className="rounded-lg border border-[#d9ded7] bg-white p-4">
            <p className="text-sm font-medium text-[#5f6268]">Demo content</p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">
              {demoMarkets.reduce((sum, market) => sum + market.contentCount, 0)}
            </p>
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="divide-y divide-[#eef1ed]">
            {demoMarkets.map((market) => (
              <div
                className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[1fr_120px_160px]"
                key={market.code}
              >
                <div>
                  <p className="font-semibold text-[#111827]">{market.name}</p>
                  <p className="mt-1 text-xs text-[#5f6268]">/{market.code}/</p>
                </div>
                <p className="text-[#5f6268]">{market.language}</p>
                <p className="text-[#5f6268]">{market.contentCount} demo drafts</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Market Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              Markets
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Manage the supported market records used by public routing,
              locale metadata, hreflang, and affiliate campaign resolution.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
            href="/admin/markets/new"
          >
            New market
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total", markets.length],
          ["Active", markets.filter((market) => market.status === "ACTIVE").length],
          [
            "Inactive",
            markets.filter((market) => market.status === "INACTIVE").length,
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
        {markets.length === 0 ? (
          <div className="p-6">
            <h2 className="text-base font-semibold text-[#111827]">
              No markets yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f6268]">
              Seed or create supported markets before creating localized
              content.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">Language</th>
                  <th className="px-4 py-3 font-semibold">Country</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Content</th>
                  <th className="px-4 py-3 font-semibold">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1ed]">
                {markets.map((market) => (
                  <tr className="align-top" key={market.id}>
                    <td className="px-4 py-4">
                      <Link
                        className="font-semibold text-[#123c3a] hover:underline"
                        href={`/admin/markets/${market.id}/edit`}
                      >
                        {market.name}
                      </Link>
                      <p className="mt-1 text-xs text-[#5f6268]">
                        /{market.code}/
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {market.languageCode}
                      <span className="block text-xs text-[#5f6268]">
                        {market.locale}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {market.countryCode ?? "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={[
                          "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                          statusClass(market.status),
                        ].join(" ")}
                      >
                        {marketStatusLabels[market.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {market._count.contentItems}
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {market._count.affiliateLinks}
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
