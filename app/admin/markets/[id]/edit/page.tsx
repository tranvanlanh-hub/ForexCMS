import { notFound } from "next/navigation";
import { MarketForm } from "@/app/admin/markets/market-form";
import { updateMarketAction } from "@/app/admin/markets/actions";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getMarket(id: string) {
  return prisma.market.findUnique({ where: { id } });
}

export default async function EditMarketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  let market: Awaited<ReturnType<typeof getMarket>> | null = null;
  let isDatabaseReady = true;

  try {
    market = await getMarket(id);
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
          Connect PostgreSQL and run the Prisma migration before editing
          markets.
        </p>
      </div>
    );
  }

  if (!market) {
    notFound();
  }

  return (
    <MarketForm
      action={updateMarketAction}
      error={error}
      item={market}
      saved={saved === "1"}
    />
  );
}
