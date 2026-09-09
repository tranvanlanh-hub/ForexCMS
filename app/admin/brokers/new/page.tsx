import { BrokerForm } from "@/app/admin/brokers/broker-form";
import { createBrokerAction } from "@/app/admin/brokers/actions";

export default async function NewBrokerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <BrokerForm action={createBrokerAction} error={error} />;
}
