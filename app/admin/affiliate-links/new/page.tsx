import { AffiliateLinkForm } from "@/app/admin/affiliate-links/affiliate-link-form";
import { createAffiliateLinkAction } from "@/app/admin/affiliate-links/actions";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getAffiliateFormOptions() {
  const [brokers, markets] = await Promise.all([
    prisma.broker.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, status: true },
    }),
    prisma.market.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ isGlobal: "desc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        languageCode: true,
        locale: true,
      },
    }),
  ]);

  return { brokers, markets };
}

export default async function NewAffiliateLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  let options: Awaited<ReturnType<typeof getAffiliateFormOptions>> | null = null;
  let isDatabaseReady = true;

  try {
    options = await getAffiliateFormOptions();
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady || !options) {
    return (
      <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
        <h1 className="text-base font-semibold text-[#9a3412]">
          Database is not ready
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#9a3412]">
          Connect PostgreSQL and run the Prisma migration before creating
          affiliate links.
        </p>
      </div>
    );
  }

  if (options.brokers.length === 0 || options.markets.length === 0) {
    return (
      <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
        <h1 className="text-base font-semibold text-[#9a3412]">
          Broker and market needed
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#9a3412]">
          Create at least one broker and one market before adding affiliate
          links.
        </p>
      </div>
    );
  }

  return (
    <AffiliateLinkForm
      action={createAffiliateLinkAction}
      brokers={options.brokers}
      error={error}
      markets={options.markets}
    />
  );
}
