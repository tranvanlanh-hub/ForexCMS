import { BrokerFactCategory, BrokerStatus, type Broker, type BrokerFact, type Market } from "@prisma/client";
import Link from "next/link";
import { CsrfField } from "@/components/admin/csrf-field";
import { brokerStatusLabels } from "@/lib/affiliate";
import {
  brokerFactCategoryExamples,
  brokerFactCategoryLabels,
  serializeBrokerFactsForForm,
} from "@/lib/broker-facts";
import {
  brokerRatingFields,
  type BrokerRatingFieldName,
} from "@/lib/brokers/review-fields";
import { getBrokerReviewScoreSummary } from "@/lib/brokers/review";

type BrokerFormItem = Pick<
  Broker,
  | "id"
  | "name"
  | "slug"
  | "status"
  | "priority"
  | "legalName"
  | "websiteUrl"
  | "supportEmail"
  | "supportPhone"
  | "contactPageUrl"
  | "foundedYear"
  | "headquartersCountry"
  | "headquartersAddress"
  | "logoUrl"
  | "logoMediaId"
  | "description"
  | "overallRating"
  | "trustSafetyRating"
  | "feesRating"
  | "researchEducationRating"
  | "tradingToolsRating"
  | "tradingPlatformsRating"
  | "customerSupportRating"
  | "accountTypesRating"
  | "specialFeaturesRating"
  | "accountOpeningRating"
  | "ratingSummary"
  | "ratingReviewedAt"
> & {
  reviewAssessments?: Array<{
    market: { code: string; name: string; locale: string };
    regulationTrustScore: Broker["overallRating"];
    costsScore: Broker["overallRating"];
    tradingExperienceScore: Broker["overallRating"];
    depositsWithdrawalsScore: Broker["overallRating"];
    supportEducationScore: Broker["overallRating"];
    regulationTrustRationale: string | null;
    costsRationale: string | null;
    tradingExperienceRationale: string | null;
    depositsWithdrawalsRationale: string | null;
    supportEducationRationale: string | null;
    reviewerName: string | null;
    methodologyVersion: string;
    reviewedAt: Date | null;
  }>;
} & {
  factItems?: Array<
    Pick<
      BrokerFact,
      | "category"
      | "label"
      | "value"
      | "unit"
      | "appliesTo"
      | "sourceName"
      | "sourceUrl"
      | "citationText"
      | "sourceRetrievedAt"
      | "displayOrder"
      | "isPrimary"
    > & {
      market?: Pick<Market, "code"> | null;
    }
  >;
};

type BrokerFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  item?: BrokerFormItem;
  saved?: boolean;
  mediaAssets: Array<{ id: string; originalFilename: string }>;
  reviewMarkets?: Array<{ id: string; code: string; name: string; locale: string }>;
};

export function BrokerForm({ action, error, item, mediaAssets, reviewMarkets = [], saved }: BrokerFormProps) {
  const isEditing = Boolean(item);
  const factsValue = serializeBrokerFactsForForm(
    item?.factItems?.sort((a, b) => a.displayOrder - b.displayOrder) ?? [],
  );
  const ratingValue = (name: BrokerRatingFieldName) =>
    item?.[name]?.toString() ?? "";

  return (
    <form action={action} className="flex flex-col gap-6">
      <CsrfField />
      {item ? <input name="id" type="hidden" value={item.id} /> : null}

      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Broker Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              {isEditing ? "Edit broker" : "Create broker"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Manage the broker identity reused by reviews, comparisons, and
              affiliate campaigns.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md border border-[#cbd5ce] bg-white px-4 text-sm font-semibold text-[#111827] transition hover:border-[#0f766e]"
            href="/admin/brokers"
          >
            Back to list
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
          Broker saved.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <label className="text-sm font-semibold text-[#111827]" htmlFor="name">
            Name
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.name}
              id="name"
              name="name"
              required
            />
          </label>

          <label
            className="mt-5 block text-sm font-semibold text-[#111827]"
            htmlFor="legalName"
          >
            Legal company name
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.legalName ?? ""}
              id="legalName"
              name="legalName"
            />
          </label>

          <label
            className="mt-5 block text-sm font-semibold text-[#111827]"
            htmlFor="description"
          >
            Short description
            <textarea
              className="mt-2 min-h-28 w-full resize-y rounded-md border border-[#cbd5ce] px-3 py-3 text-sm font-normal leading-6 outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.description ?? ""}
              id="description"
              maxLength={280}
              name="description"
            />
          </label>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Publishing</h2>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="status">
              Status
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.status ?? BrokerStatus.DRAFT}
                id="status"
                name="status"
              >
                {Object.values(BrokerStatus).map((status) => (
                  <option key={status} value={status}>
                    {brokerStatusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="priority">
              Editorial priority
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.priority ?? 100}
                id="priority"
                max={9999}
                min={1}
                name="priority"
                required
                type="number"
              />
              <span className="mt-1 block text-xs font-normal leading-5 text-[#5f6268]">
                Lower numbers appear first in Broker Manager.
              </span>
            </label>
            <button
              className="mt-5 h-11 w-full rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
              type="submit"
            >
              {isEditing ? "Save changes" : "Create broker"}
            </button>
          </div>

          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Identity</h2>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="slug">
              Slug
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.slug}
                id="slug"
                name="slug"
                required
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="logoUrl">
              External logo URL
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.logoUrl ?? ""}
                id="logoUrl"
                name="logoUrl"
                type="url"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="logoMediaId">
              Media library logo
              <select className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal" defaultValue={item?.logoMediaId ?? ""} id="logoMediaId" name="logoMediaId">
                <option value="">Use external URL or no logo</option>
                {mediaAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.originalFilename}</option>)}
              </select>
            </label>
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-[#d9ded7] bg-white p-5">
        <h2 className="text-base font-semibold text-[#111827]">
          Company &amp; contact details
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6268]">
          Store the broker&apos;s official public contact information. Keep
          affiliate destinations in Affiliate Manager.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-[#111827]" htmlFor="websiteUrl">
            Official website
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.websiteUrl ?? ""}
              id="websiteUrl"
              name="websiteUrl"
              placeholder="https://www.example.com/"
              type="url"
            />
          </label>
          <label className="text-sm font-semibold text-[#111827]" htmlFor="contactPageUrl">
            Contact page URL
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.contactPageUrl ?? ""}
              id="contactPageUrl"
              name="contactPageUrl"
              placeholder="https://www.example.com/contact/"
              type="url"
            />
          </label>
          <label className="text-sm font-semibold text-[#111827]" htmlFor="supportEmail">
            Support email
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.supportEmail ?? ""}
              id="supportEmail"
              name="supportEmail"
              placeholder="support@example.com"
              type="email"
            />
          </label>
          <label className="text-sm font-semibold text-[#111827]" htmlFor="supportPhone">
            Support phone / hotline
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.supportPhone ?? ""}
              id="supportPhone"
              name="supportPhone"
              placeholder="+44 20 0000 0000"
              type="tel"
            />
          </label>
          <label className="text-sm font-semibold text-[#111827]" htmlFor="foundedYear">
            Founded year
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.foundedYear ?? ""}
              id="foundedYear"
              max={new Date().getUTCFullYear()}
              min={1800}
              name="foundedYear"
              type="number"
            />
          </label>
          <label className="text-sm font-semibold text-[#111827]" htmlFor="headquartersCountry">
            Headquarters country
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.headquartersCountry ?? ""}
              id="headquartersCountry"
              name="headquartersCountry"
              placeholder="United Kingdom"
            />
          </label>
          <label className="text-sm font-semibold text-[#111827] md:col-span-2" htmlFor="headquartersAddress">
            Headquarters address
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-md border border-[#cbd5ce] px-3 py-3 text-sm font-normal leading-6 outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.headquartersAddress ?? ""}
              id="headquartersAddress"
              maxLength={500}
              name="headquartersAddress"
            />
          </label>
        </div>
      </section>

      {item ? <section className="rounded-lg border border-[#d8e1ec] bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#07162f]">Market review assessments</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#53657c]">
              The public Broker Review v1 scorecard uses one market-specific assessment. Legacy global scores below do not appear on the public review.
            </p>
          </div>
          <span className="rounded-md border border-[#d3e1f5] bg-[#eef4fc] px-3 py-2 text-xs font-semibold text-[#0754cf]">MarketGB v1</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#d8e1ec] text-xs text-[#53657c]"><tr><th className="pb-3 font-semibold">Market</th><th className="pb-3 font-semibold">Assessment</th><th className="pb-3 font-semibold">Reviewed</th><th className="pb-3 font-semibold"></th></tr></thead>
            <tbody className="divide-y divide-[#e8eef5]">
              {reviewMarkets.map((market) => {
                const assessment = item.reviewAssessments?.find((candidate) => candidate.market.code === market.code);
                const summary = getBrokerReviewScoreSummary(assessment);
                return <tr key={market.id}><td className="py-3 font-medium text-[#07162f]">{market.name}<span className="ml-2 text-xs text-[#71839a]">{market.locale}</span></td><td className="py-3 text-[#53657c]">{summary.average === null ? "Not assessed" : `${summary.average.toFixed(1)} / 5 · ${summary.assessedCount}/5 criteria`}</td><td className="py-3 text-[#53657c]">{assessment?.reviewedAt ? assessment.reviewedAt.toLocaleDateString("en-US") : "—"}</td><td className="py-3 text-right"><Link className="font-semibold text-[#0754cf] hover:underline" href={`/admin/brokers/${item.id}/review-assessments/${market.id}`}>{assessment ? "Edit" : "Assess"}</Link></td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </section> : null}

      <section className="rounded-lg border border-[#d9ded7] bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">
              Legacy global editorial scores
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Retained for internal/history use. Public Broker Review v1 uses the market assessment above; these values are not broker-supplied claims.
            </p>
          </div>
          <span className="rounded-md border border-[#f4d28c] bg-[#fffbeb] px-3 py-2 text-xs font-semibold text-[#92400e]">
            Optional · 0–5
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brokerRatingFields.map(({ name, label }) => (
            <label className="text-sm font-semibold text-[#111827]" htmlFor={name} key={name}>
              {label}
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={ratingValue(name)}
                id={name}
                max={5}
                min={0}
                name={name}
                step={0.1}
                type="number"
              />
            </label>
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
          <label className="text-sm font-semibold text-[#111827]" htmlFor="ratingSummary">
            Rating summary
            <textarea
              className="mt-2 min-h-28 w-full resize-y rounded-md border border-[#cbd5ce] px-3 py-3 text-sm font-normal leading-6 outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.ratingSummary ?? ""}
              id="ratingSummary"
              maxLength={1000}
              name="ratingSummary"
              placeholder="Explain the main strengths, weaknesses, and scoring rationale."
            />
          </label>
          <label className="text-sm font-semibold text-[#111827]" htmlFor="ratingReviewedAt">
            Rating review date
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.ratingReviewedAt?.toISOString().slice(0, 10) ?? ""}
              id="ratingReviewedAt"
              name="ratingReviewedAt"
              type="date"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-[#d9ded7] bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">
              Sourced broker facts
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Add one sourced fact per line. Public broker reviews and
              comparisons only show fact rows with source fields.
            </p>
          </div>
          <span className="rounded-md border border-[#b7dfca] bg-[#f0fdf6] px-3 py-2 text-xs font-semibold text-[#166534]">
            Source required
          </span>
        </div>

        <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="facts">
          Facts
          <textarea
            className="mt-2 min-h-48 w-full resize-y rounded-md border border-[#cbd5ce] px-3 py-3 font-mono text-xs font-normal leading-6 outline-none transition focus:border-[#0f766e]"
            defaultValue={factsValue}
            id="facts"
            name="facts"
            placeholder={brokerFactCategoryExamples.REGULATION_LICENSE}
          />
        </label>

        <div className="mt-4 grid gap-3 text-xs leading-5 text-[#5f6268] md:grid-cols-2">
          <div className="rounded-md border border-[#eef1ed] bg-[#fbfcfb] p-3">
            <p className="font-semibold text-[#374151]">Line format</p>
            <p className="mt-1 font-mono">
              CATEGORY | label | value | unit | source name | source URL |
              market | applies to | citation | primary | retrieved YYYY-MM-DD
            </p>
          </div>
          <div className="rounded-md border border-[#eef1ed] bg-[#fbfcfb] p-3">
            <p className="font-semibold text-[#374151]">Categories</p>
            <p className="mt-1">
              {Object.values(BrokerFactCategory)
                .map((category) => brokerFactCategoryLabels[category])
                .join(", ")}
            </p>
          </div>
        </div>
      </section>
    </form>
  );
}
