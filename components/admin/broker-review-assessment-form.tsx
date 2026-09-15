import type { BrokerReviewAssessment, Market } from "@prisma/client";
import Link from "next/link";
import { CsrfField } from "@/components/admin/csrf-field";
import {
  BROKER_REVIEW_METHODOLOGY_VERSION,
  brokerReviewCriteria,
} from "@/lib/brokers/review";

type AssessmentItem = Pick<
  BrokerReviewAssessment,
  | "regulationTrustScore"
  | "regulationTrustRationale"
  | "costsScore"
  | "costsRationale"
  | "tradingExperienceScore"
  | "tradingExperienceRationale"
  | "depositsWithdrawalsScore"
  | "depositsWithdrawalsRationale"
  | "supportEducationScore"
  | "supportEducationRationale"
  | "reviewerName"
  | "reviewedAt"
  | "methodologyVersion"
>;

type BrokerReviewAssessmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  broker: { id: string; name: string };
  error?: string;
  item?: AssessmentItem | null;
  market: Pick<Market, "id" | "code" | "name" | "locale">;
  saved?: boolean;
};

export function BrokerReviewAssessmentForm({
  action,
  broker,
  error,
  item,
  market,
  saved,
}: BrokerReviewAssessmentFormProps) {
  return (
    <form action={action} className="flex flex-col gap-6">
      <CsrfField />
      <input name="brokerId" type="hidden" value={broker.id} />
      <input name="marketId" type="hidden" value={market.id} />

      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0b68ff]">
          Broker review assessment
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#07162f]">
              {broker.name} · {market.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#53657c]">
              MarketGB editorial assessment for {market.locale}. Scores are not broker-supplied claims.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md border border-[#d8e1ec] bg-white px-4 text-sm font-semibold text-[#07162f] transition hover:border-[#0b68ff]"
            href={`/admin/brokers/${broker.id}/edit`}
          >
            Back to broker
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-[#f0b8a8] bg-[#fff7f4] px-4 py-3 text-sm font-medium leading-6 text-[#9a3412]">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="rounded-md border border-[#b7dfca] bg-[#f0fdf6] px-4 py-3 text-sm font-medium leading-6 text-[#166534]">
          Assessment saved.
        </div>
      ) : null}

      <section className="rounded-lg border border-[#d8e1ec] bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#07162f]">Five review criteria</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#53657c]">
              Use 0.0–5.0. A score requires reviewer and review date below. Rationale is optional, but readers will see when it is unavailable.
            </p>
          </div>
          <span className="rounded-md border border-[#d3e1f5] bg-[#eef4fc] px-3 py-2 text-xs font-semibold text-[#0754cf]">
            {BROKER_REVIEW_METHODOLOGY_VERSION}
          </span>
        </div>

        <div className="mt-5 grid gap-5">
          {brokerReviewCriteria.map((criterion) => (
            <div className="grid gap-4 rounded-lg border border-[#d8e1ec] p-4 lg:grid-cols-[160px_1fr]" key={criterion.key}>
              <label className="text-sm font-semibold text-[#07162f]" htmlFor={criterion.scoreField}>
                {criterion.label}
                <input
                  className="mt-2 h-11 w-full rounded-md border border-[#cbd8e8] px-3 text-sm font-normal outline-none transition focus:border-[#0b68ff]"
                  defaultValue={item?.[criterion.scoreField]?.toString() ?? ""}
                  id={criterion.scoreField}
                  max={5}
                  min={0}
                  name={criterion.scoreField}
                  step={0.1}
                  type="number"
                />
              </label>
              <label className="text-sm font-semibold text-[#07162f]" htmlFor={criterion.rationaleField}>
                Rationale
                <textarea
                  className="mt-2 min-h-24 w-full resize-y rounded-md border border-[#cbd8e8] px-3 py-3 text-sm font-normal leading-6 outline-none transition focus:border-[#0b68ff]"
                  defaultValue={item?.[criterion.rationaleField] ?? ""}
                  id={criterion.rationaleField}
                  maxLength={500}
                  name={criterion.rationaleField}
                  placeholder={criterion.description}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-[#d8e1ec] bg-white p-5 md:grid-cols-[1fr_240px]">
        <label className="text-sm font-semibold text-[#07162f]" htmlFor="reviewerName">
          Reviewer name
          <input
            className="mt-2 h-11 w-full rounded-md border border-[#cbd8e8] px-3 text-sm font-normal outline-none transition focus:border-[#0b68ff]"
            defaultValue={item?.reviewerName ?? ""}
            id="reviewerName"
            name="reviewerName"
          />
        </label>
        <label className="text-sm font-semibold text-[#07162f]" htmlFor="reviewedAt">
          Assessment date
          <input
            className="mt-2 h-11 w-full rounded-md border border-[#cbd8e8] px-3 text-sm font-normal outline-none transition focus:border-[#0b68ff]"
            defaultValue={item?.reviewedAt?.toISOString().slice(0, 10) ?? ""}
            id="reviewedAt"
            name="reviewedAt"
            type="date"
          />
        </label>
        <p className="text-sm leading-6 text-[#53657c] md:col-span-2">
          Methodology version is fixed in code. If the rubric changes, a new version will be added instead of rewriting this assessment.
        </p>
      </section>

      <div>
        <button className="inline-flex h-11 items-center rounded-md bg-[#0b68ff] px-5 text-sm font-semibold text-white transition hover:bg-[#0754cf]" type="submit">
          Save assessment
        </button>
      </div>
    </form>
  );
}
