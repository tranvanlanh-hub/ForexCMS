import type { AdminNavItem } from "@/lib/admin/navigation";

type AdminModulePageProps = {
  item: AdminNavItem;
};

export function AdminModulePage({ item }: AdminModulePageProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Module foundation
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827]">
          {item.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
          {item.summary}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">Reserved scope</h2>
          <p className="mt-3 text-sm leading-6 text-[#5f6268]">{item.scope}</p>
          <div className="mt-5 rounded-md border border-dashed border-[#b7c5bd] bg-[#f6faf8] p-4">
            <p className="text-sm font-semibold text-[#123c3a]">
              CRUD is intentionally not enabled in this change.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5f6268]">
              This page only establishes the route and admin navigation surface
              so later OpenSpec changes can add workflows without reshaping the
              CMS shell.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <h2 className="text-base font-semibold text-[#111827]">
            Planned data boundary
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.plannedEntities.map((entity) => (
              <span
                className="rounded-md border border-[#d9ded7] bg-[#fbfcfb] px-3 py-2 text-sm font-medium text-[#374151]"
                key={entity}
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
