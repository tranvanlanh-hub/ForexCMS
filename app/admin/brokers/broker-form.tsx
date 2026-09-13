import { BrokerFactCategory, BrokerStatus, type Broker, type BrokerFact, type Market } from "@prisma/client";
import Link from "next/link";
import { CsrfField } from "@/components/admin/csrf-field";
import { brokerStatusLabels } from "@/lib/affiliate";
import {
  brokerFactCategoryExamples,
  brokerFactCategoryLabels,
  serializeBrokerFactsForForm,
} from "@/lib/broker-facts";

type BrokerFormItem = Pick<
  Broker,
  "id" | "name" | "slug" | "status" | "logoUrl" | "logoMediaId" | "description"
> & {
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
};

export function BrokerForm({ action, error, item, mediaAssets, saved }: BrokerFormProps) {
  const isEditing = Boolean(item);
  const factsValue = serializeBrokerFactsForForm(
    item?.factItems?.sort((a, b) => a.displayOrder - b.displayOrder) ?? [],
  );

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
              market | applies to | citation | primary
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
