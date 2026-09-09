import { notFound } from "next/navigation";
import { updateAffiliateLinkAction } from "@/app/admin/affiliate-links/actions";
import { AffiliateLinkForm } from "@/app/admin/affiliate-links/affiliate-link-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getAffiliateEditData(id: string) {
  const [item, brokers, markets] = await Promise.all([
    prisma.affiliateLink.findUnique({ where: { id } }),
    prisma.broker.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, status: true },
    }),
    prisma.market.findMany({
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

  return { brokers, item, markets };
}

export default async function EditAffiliateLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  let data: Awaited<ReturnType<typeof getAffiliateEditData>> | null = null;
  let isDatabaseReady = true;

  try {
    data = await getAffiliateEditData(id);
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady || !data) {
    return (
      <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
        <h1 className="text-base font-semibold text-[#9a3412]">
          Database is not ready
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#9a3412]">
          Connect PostgreSQL and run the Prisma migration before editing
          affiliate links.
        </p>
      </div>
    );
  }

  if (!data.item) {
    notFound();
  }

  return (
    <AffiliateLinkForm
      action={updateAffiliateLinkAction}
      brokers={data.brokers}
      error={error}
      item={data.item}
      markets={data.markets}
      saved={saved === "1"}
    />
  );
}
