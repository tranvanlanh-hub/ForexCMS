import { notFound } from "next/navigation";
import { upsertBrokerReviewAssessmentAction } from "@/app/admin/brokers/actions";
import { BrokerReviewAssessmentForm } from "@/components/admin/broker-review-assessment-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BrokerReviewAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; marketId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id, marketId } = await params;
  const { error, saved } = await searchParams;
  const [broker, market] = await Promise.all([
    prisma.broker.findUnique({
      where: { id },
      select: { id: true, name: true },
    }),
    prisma.market.findFirst({
      where: { id: marketId, status: "ACTIVE" },
      select: { id: true, code: true, name: true, locale: true },
    }),
  ]);

  if (!broker || !market) notFound();

  const assessment = await prisma.brokerReviewAssessment.findUnique({
    where: {
      brokerId_marketId: {
        brokerId: broker.id,
        marketId: market.id,
      },
    },
  });

  return (
    <BrokerReviewAssessmentForm
      action={upsertBrokerReviewAssessmentAction}
      broker={broker}
      error={error}
      item={assessment}
      market={market}
      saved={saved === "1"}
    />
  );
}
