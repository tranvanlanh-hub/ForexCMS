import { BrokerStatus, type Broker } from "@prisma/client";
import Link from "next/link";
import { brokerStatusLabels } from "@/lib/affiliate";

type BrokerFormItem = Pick<
  Broker,
  "id" | "name" | "slug" | "status" | "logoUrl" | "description"
>;

type BrokerFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  item?: BrokerFormItem;
  saved?: boolean;
};

export function BrokerForm({ action, error, item, saved }: BrokerFormProps) {
  const isEditing = Boolean(item);

  return (
    <form action={action} className="flex flex-col gap-6">
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
              Logo / media URL
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.logoUrl ?? ""}
                id="logoUrl"
                name="logoUrl"
                type="url"
              />
            </label>
          </div>
        </aside>
      </section>
    </form>
  );
}
