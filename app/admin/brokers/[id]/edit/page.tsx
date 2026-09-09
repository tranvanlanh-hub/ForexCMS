import { notFound } from "next/navigation";
import { updateBrokerAction } from "@/app/admin/brokers/actions";
import { BrokerForm } from "@/app/admin/brokers/broker-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditBrokerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  let broker: Awaited<ReturnType<typeof prisma.broker.findUnique>> | null = null;
  let isDatabaseReady = true;

  try {
    broker = await prisma.broker.findUnique({ where: { id } });
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
          brokers.
        </p>
      </div>
    );
  }

  if (!broker) {
    notFound();
  }

  return (
    <BrokerForm
      action={updateBrokerAction}
      error={error}
      item={broker}
      saved={saved === "1"}
    />
  );
}
