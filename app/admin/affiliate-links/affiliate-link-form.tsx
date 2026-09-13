import {
  AffiliateLinkStatus,
  type AffiliateLink,
  type Broker,
  type Market,
} from "@prisma/client";
import Link from "next/link";
import { CsrfField } from "@/components/admin/csrf-field";
import { affiliateLinkStatusLabels } from "@/lib/affiliate";

type AffiliateLinkFormItem = Pick<
  AffiliateLink,
  | "id"
  | "brokerId"
  | "marketId"
  | "languageCode"
  | "campaign"
  | "destinationUrl"
  | "status"
  | "priority"
>;

type AffiliateLinkFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  brokers: Pick<Broker, "id" | "name" | "slug" | "status">[];
  error?: string;
  item?: AffiliateLinkFormItem;
  markets: Pick<Market, "id" | "code" | "name" | "languageCode" | "locale">[];
  saved?: boolean;
};

export function AffiliateLinkForm({
  action,
  brokers,
  error,
  item,
  markets,
  saved,
}: AffiliateLinkFormProps) {
  const isEditing = Boolean(item);

  return (
    <form action={action} className="flex flex-col gap-6">
      <CsrfField />
      {item ? <input name="id" type="hidden" value={item.id} /> : null}

      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Affiliate Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              {isEditing ? "Edit affiliate link" : "Create affiliate link"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Store destination URLs once and let public CTAs resolve by broker,
              market, language, and campaign.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md border border-[#cbd5ce] bg-white px-4 text-sm font-semibold text-[#111827] transition hover:border-[#0f766e]"
            href="/admin/affiliate-links"
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
          Affiliate link saved.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <label
            className="text-sm font-semibold text-[#111827]"
            htmlFor="destinationUrl"
          >
            Destination URL
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.destinationUrl}
              id="destinationUrl"
              name="destinationUrl"
              required
              type="url"
            />
          </label>

          <div className="mt-5 rounded-md border border-[#d9ded7] bg-[#fbfcfb] px-3 py-3 text-sm leading-6 text-[#374151]">
            Public links rendered from this record use rel=&quot;sponsored
            nofollow&quot;.
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Token</h2>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="brokerId">
              Broker
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.brokerId ?? brokers[0]?.id}
                id="brokerId"
                name="brokerId"
                required
              >
                {brokers.map((broker) => (
                  <option key={broker.id} value={broker.id}>
                    {broker.name} ({broker.slug})
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="marketId">
              Market
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.marketId ?? markets[0]?.id}
                id="marketId"
                name="marketId"
                required
              >
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.code} - {market.name} ({market.locale})
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="languageCode">
              Language
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.languageCode ?? markets[0]?.languageCode ?? "en"}
                id="languageCode"
                name="languageCode"
                required
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="campaign">
              Campaign
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.campaign}
                id="campaign"
                name="campaign"
                placeholder="review_top_cta"
                required
              />
            </label>
          </div>

          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Status</h2>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="status">
              Status
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.status ?? AffiliateLinkStatus.DRAFT}
                id="status"
                name="status"
              >
                {Object.values(AffiliateLinkStatus).map((status) => (
                  <option key={status} value={status}>
                    {affiliateLinkStatusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="priority">
              Priority
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.priority ?? 100}
                id="priority"
                min={1}
                name="priority"
                required
                type="number"
              />
            </label>
            <button
              className="mt-5 h-11 w-full rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
              type="submit"
            >
              {isEditing ? "Save changes" : "Create link"}
            </button>
          </div>
        </aside>
      </section>
    </form>
  );
}
