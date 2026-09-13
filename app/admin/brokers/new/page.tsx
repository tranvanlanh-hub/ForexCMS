import { BrokerForm } from "@/app/admin/brokers/broker-form";
import { createBrokerAction } from "@/app/admin/brokers/actions";
import { prisma } from "@/lib/db";

export default async function NewBrokerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const mediaAssets = await prisma.mediaAsset.findMany({ where: { status: "READY" }, orderBy: { createdAt: "desc" }, select: { id: true, originalFilename: true } });

  return <BrokerForm action={createBrokerAction} error={error} mediaAssets={mediaAssets} />;
}
