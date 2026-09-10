import Link from "next/link";
import { DemoModeBanner } from "@/components/admin/demo-mode-banner";
import { getAnalyticsDashboardData } from "@/lib/analytics";
import {
  countDemoBy,
  getDemoAffiliateRows,
  getDemoPilotDrafts,
} from "@/lib/demo/content-scale";

export const dynamic = "force-dynamic";

type AnalyticsDashboardData = Awaited<ReturnType<typeof getAnalyticsDashboardData>>;

function EmptyRow({ children }: { children: string }) {
  return (
    <div className="p-5 text-sm leading-6 text-[#5f6268]">
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[#d9ded7] bg-white p-4">
      <p className="text-sm font-medium text-[#5f6268]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#111827]">{value}</p>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  let data: AnalyticsDashboardData | null = null;
  let isDatabaseReady = true;

  try {
    data = await getAnalyticsDashboardData();
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady || !data) {
    const demoDrafts = await getDemoPilotDrafts();
    const demoAffiliateRows = getDemoAffiliateRows(demoDrafts);
    const byType = countDemoBy(demoDrafts, (draft) => draft.contentType);

    return (
      <div className="flex flex-col gap-6">
        <DemoModeBanner module="Analytics and Quality" />
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Demo drafts audited" value={demoDrafts.length} />
          <Metric label="Audit errors" value={0} />
          <Metric label="Audit warnings" value={0} />
          <Metric label="Affiliate token rows" value={demoAffiliateRows.length} />
        </section>
        <section className="grid gap-4 xl:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
            <div className="border-b border-[#d9ded7] px-5 py-4">
              <h2 className="text-base font-semibold text-[#111827]">
                Demo quality checks
              </h2>
            </div>
            <div className="divide-y divide-[#eef1ed]">
              {[
                "SEO title and meta description present",
                "Canonical paths follow market/content-type/slug",
                "No hard-coded affiliate URLs",
                "FAQ/schema fields present",
                "Internal link targets assigned",
              ].map((item) => (
                <div className="px-5 py-4 text-sm font-medium text-[#166534]" key={item}>
                  Passed: {item}
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
            <div className="border-b border-[#d9ded7] px-5 py-4">
              <h2 className="text-base font-semibold text-[#111827]">
                Demo content mix
              </h2>
            </div>
            <div className="divide-y divide-[#eef1ed]">
              {Object.entries(byType).map(([type, count]) => (
                <div
                  className="flex items-center justify-between px-5 py-4 text-sm"
                  key={type}
                >
                  <span className="font-medium text-[#111827]">{type}</span>
                  <span className="font-semibold text-[#123c3a]">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Analytics
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827]">
          Click and Content Quality
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
          Affiliate click totals and editorial checks built from first-party CMS
          data. Click tracking stores campaign context only, without visitor
          profiles.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Affiliate clicks" value={data.totalAffiliateClicks} />
        <Metric label="Top broker rows" value={data.topBrokers.length} />
        <Metric label="Campaign rows" value={data.topCampaigns.length} />
        <Metric label="Market rows" value={data.topMarkets.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="border-b border-[#d9ded7] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">
              Clicks by campaign
            </h2>
          </div>
          {data.topCampaigns.length === 0 ? (
            <EmptyRow>No campaign click data yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-[#eef1ed]">
              {data.topCampaigns.map((item) => (
                <div
                  className="flex items-center justify-between gap-4 px-5 py-4"
                  key={item.campaign}
                >
                  <p className="font-semibold text-[#111827]">{item.campaign}</p>
                  <p className="text-lg font-semibold text-[#123c3a]">
                    {item.clicks}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="border-b border-[#d9ded7] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">
              Clicks by market
            </h2>
          </div>
          {data.topMarkets.length === 0 ? (
            <EmptyRow>No market click data yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-[#eef1ed]">
              {data.topMarkets.map((item) => (
                <div
                  className="flex items-center justify-between gap-4 px-5 py-4"
                  key={item.market}
                >
                  <p className="font-semibold text-[#111827]">{item.market}</p>
                  <p className="text-lg font-semibold text-[#123c3a]">
                    {item.clicks}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="border-b border-[#d9ded7] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">
              Clicks by date
            </h2>
          </div>
          {data.clicksByDate.length === 0 ? (
            <EmptyRow>No dated click data yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-[#eef1ed]">
              {data.clicksByDate.map((item) => (
                <div
                  className="flex items-center justify-between gap-4 px-5 py-4"
                  key={item.date}
                >
                  <p className="font-semibold text-[#111827]">{item.date}</p>
                  <p className="text-lg font-semibold text-[#123c3a]">
                    {item.clicks}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="SEO issues" value={data.contentMissingSeo.length} />
        <Metric
          label="Affiliate issues"
          value={
            data.inactiveOrEmptyAffiliateLinks.length +
            data.missingAffiliateCtas.length
          }
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="border-b border-[#d9ded7] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">
              Top brokers by click
            </h2>
          </div>
          {data.topBrokers.length === 0 ? (
            <EmptyRow>No broker click data yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-[#eef1ed]">
              {data.topBrokers.map((item, index) => (
                <div
                  className="flex items-center justify-between gap-4 px-5 py-4"
                  key={`${item.broker?.id ?? "missing"}-${index}`}
                >
                  <div>
                    <p className="font-semibold text-[#111827]">
                      {item.broker?.name ?? "Deleted broker"}
                    </p>
                    <p className="mt-1 text-xs text-[#5f6268]">
                      {item.broker?.slug ?? "broker record unavailable"}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-[#123c3a]">
                    {item.clicks}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="border-b border-[#d9ded7] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">
              Top content by click
            </h2>
          </div>
          {data.topContent.length === 0 ? (
            <EmptyRow>No content click data yet.</EmptyRow>
          ) : (
            <div className="divide-y divide-[#eef1ed]">
              {data.topContent.map((item, index) => (
                <div
                  className="flex items-center justify-between gap-4 px-5 py-4"
                  key={`${item.content?.id ?? "missing"}-${index}`}
                >
                  <div>
                    {item.content ? (
                      <Link
                        className="font-semibold text-[#123c3a] hover:underline"
                        href={`/admin/content/${item.content.id}/edit`}
                      >
                        {item.content.title}
                      </Link>
                    ) : (
                      <p className="font-semibold text-[#111827]">
                        Deleted content
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[#5f6268]">
                      {item.content?.canonicalPath ?? "content record unavailable"}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-[#123c3a]">
                    {item.clicks}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="border-b border-[#d9ded7] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">
              Missing SEO metadata
            </h2>
          </div>
          {data.contentMissingSeo.length === 0 ? (
            <EmptyRow>No missing SEO metadata found in the first scan.</EmptyRow>
          ) : (
            <div className="divide-y divide-[#eef1ed]">
              {data.contentMissingSeo.map((item) => (
                <div className="px-5 py-4" key={item.id}>
                  <Link
                    className="font-semibold text-[#123c3a] hover:underline"
                    href={`/admin/content/${item.id}/edit`}
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-[#5f6268]">
                    {item.market.code} / {item.canonicalPath}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
          <div className="border-b border-[#d9ded7] px-5 py-4">
            <h2 className="text-base font-semibold text-[#111827]">
              Broken or missing affiliate links
            </h2>
          </div>
          {data.inactiveOrEmptyAffiliateLinks.length === 0 &&
          data.missingAffiliateCtas.length === 0 ? (
            <EmptyRow>No affiliate link issues found in the first scan.</EmptyRow>
          ) : (
            <div className="divide-y divide-[#eef1ed]">
              {data.inactiveOrEmptyAffiliateLinks.map((link) => (
                <div className="px-5 py-4" key={link.id}>
                  <Link
                    className="font-semibold text-[#123c3a] hover:underline"
                    href={`/admin/affiliate-links/${link.id}/edit`}
                  >
                    {link.broker.name} / {link.campaign}
                  </Link>
                  <p className="mt-1 text-xs text-[#5f6268]">
                    {link.market.code} / {link.languageCode} / {link.status}
                  </p>
                </div>
              ))}
              {data.missingAffiliateCtas.map((item) => (
                <div
                  className="px-5 py-4"
                  key={`${item.contentId}-${item.campaign}`}
                >
                  <Link
                    className="font-semibold text-[#123c3a] hover:underline"
                    href={`/admin/content/${item.contentId}/edit`}
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-[#5f6268]">
                    Missing active CTA link for {item.market} / {item.campaign}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
        <div className="border-b border-[#d9ded7] px-5 py-4">
          <h2 className="text-base font-semibold text-[#111827]">
            Orphan published content
          </h2>
        </div>
        {data.orphanContent.length === 0 ? (
          <EmptyRow>No orphan published content found.</EmptyRow>
        ) : (
          <div className="divide-y divide-[#eef1ed]">
            {data.orphanContent.map((item) => (
              <div className="px-5 py-4" key={item.id}>
                <Link
                  className="font-semibold text-[#123c3a] hover:underline"
                  href={`/admin/content/${item.id}/edit`}
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-xs text-[#5f6268]">
                  {item.market.code} / no accepted incoming internal links
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
