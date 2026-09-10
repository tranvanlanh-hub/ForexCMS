import { MarketForm } from "@/app/admin/markets/market-form";
import { createMarketAction } from "@/app/admin/markets/actions";

export default async function NewMarketPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <MarketForm action={createMarketAction} error={error} />;
}
