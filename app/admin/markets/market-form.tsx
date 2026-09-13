import { MarketStatus, type Market } from "@prisma/client";
import Link from "next/link";
import { CsrfField } from "@/components/admin/csrf-field";
import {
  marketStatusLabels,
  supportedMarkets,
} from "@/lib/market";

type MarketFormItem = Pick<
  Market,
  | "id"
  | "code"
  | "name"
  | "languageCode"
  | "locale"
  | "countryCode"
  | "status"
>;

type MarketFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  item?: MarketFormItem;
  saved?: boolean;
};

export function MarketForm({ action, error, item, saved }: MarketFormProps) {
  const isEditing = Boolean(item);
  const selectedDefinition = supportedMarkets.find(
    (market) => market.code === item?.code,
  );
  const defaultMarket = selectedDefinition ?? supportedMarkets[0];

  return (
    <form action={action} className="flex flex-col gap-6">
      <CsrfField />
      {item ? <input name="id" type="hidden" value={item.id} /> : null}

      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Market Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              {isEditing ? "Edit market" : "Create market"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Manage the market and language records used by content routing,
              affiliate links, canonical URLs, and hreflang.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md border border-[#cbd5ce] bg-white px-4 text-sm font-semibold text-[#111827] transition hover:border-[#0f766e]"
            href="/admin/markets"
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
          Market saved.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <label className="text-sm font-semibold text-[#111827]" htmlFor="name">
            Name
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.name ?? defaultMarket.name}
              id="name"
              name="name"
              required
            />
          </label>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-semibold text-[#111827]" htmlFor="languageCode">
              Language
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.languageCode ?? defaultMarket.languageCode}
                id="languageCode"
                name="languageCode"
                required
              />
            </label>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="locale">
              Locale
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.locale ?? defaultMarket.locale}
                id="locale"
                name="locale"
                required
              />
            </label>
            <label className="text-sm font-semibold text-[#111827]" htmlFor="countryCode">
              Country
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.countryCode ?? defaultMarket.countryCode ?? ""}
                id="countryCode"
                maxLength={2}
                name="countryCode"
              />
            </label>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Publishing</h2>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="status">
              Status
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.status ?? MarketStatus.ACTIVE}
                id="status"
                name="status"
              >
                {Object.values(MarketStatus).map((status) => (
                  <option key={status} value={status}>
                    {marketStatusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="mt-5 h-11 w-full rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
              type="submit"
            >
              {isEditing ? "Save changes" : "Create market"}
            </button>
          </div>

          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Scope</h2>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="code">
              Code
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.code ?? defaultMarket.code}
                id="code"
                name="code"
                required
              >
                {supportedMarkets.map((market) => (
                  <option key={market.code} value={market.code}>
                    {market.code} - {market.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </aside>
      </section>
    </form>
  );
}
