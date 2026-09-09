import { BrokerStatus } from "@prisma/client";
import Link from "next/link";
import { brokerStatusLabels } from "@/lib/affiliate";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type BrokerListItem = Awaited<ReturnType<typeof getBrokers>>[number];

async function getBrokers() {
  return prisma.broker.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          affiliateLinks: true,
          contentItems: true,
        },
      },
    },
    take: 100,
  });
}

function statusClass(status: BrokerStatus) {
  if (status === BrokerStatus.ACTIVE) {
    return "border-[#b7dfca] bg-[#f0fdf6] text-[#166534]";
  }

  if (status === BrokerStatus.ARCHIVED || status === BrokerStatus.INACTIVE) {
    return "border-[#d8dadd] bg-[#f4f4f5] text-[#52525b]";
  }

  return "border-[#f4d28c] bg-[#fffbeb] text-[#92400e]";
}

export default async function AdminBrokersPage() {
  let brokers: BrokerListItem[] = [];
  let isDatabaseReady = true;

  try {
    brokers = await getBrokers();
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady) {
    return (
      <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
        <h1 className="text-base font-semibold text-[#9a3412]">
          Database is not ready
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#9a3412]">
          Connect PostgreSQL and run the Prisma migration before using Broker
          Manager.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Broker Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              Brokers
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Manage broker profiles used by content relationships and
              affiliate link resolution.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
            href="/admin/brokers/new"
          >
            New broker
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Draft", brokers.filter((broker) => broker.status === "DRAFT").length],
          ["Active", brokers.filter((broker) => broker.status === "ACTIVE").length],
          ["Inactive", brokers.filter((broker) => broker.status === "INACTIVE").length],
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
        {brokers.length === 0 ? (
          <div className="p-6">
            <h2 className="text-base font-semibold text-[#111827]">
              No brokers yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f6268]">
              Create a broker before adding affiliate campaign links.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Broker</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Links</th>
                  <th className="px-4 py-3 font-semibold">Content</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1ed]">
                {brokers.map((broker) => (
                  <tr className="align-top" key={broker.id}>
                    <td className="px-4 py-4">
                      <Link
                        className="font-semibold text-[#123c3a] hover:underline"
                        href={`/admin/brokers/${broker.id}/edit`}
                      >
                        {broker.name}
                      </Link>
                      <p className="mt-1 text-xs text-[#5f6268]">
                        {broker.slug}
                      </p>
                      {broker.description ? (
                        <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f6268]">
                          {broker.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={[
                          "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                          statusClass(broker.status),
                        ].join(" ")}
                      >
                        {brokerStatusLabels[broker.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {broker._count.affiliateLinks}
                    </td>
                    <td className="px-4 py-4 text-[#374151]">
                      {broker._count.contentItems}
                    </td>
                    <td className="px-4 py-4 text-[#5f6268]">
                      {broker.updatedAt.toLocaleDateString("en-US")}
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
