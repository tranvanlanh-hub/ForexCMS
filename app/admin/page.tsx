import Link from "next/link";
import { adminModuleItems } from "@/lib/admin/navigation";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827]">
          CMS operations overview
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
          Navigation is now anchored for each planned CMS area. The dashboard
          remains intentionally lightweight until content workflows, broker
          management, affiliate resolution, and SEO checks are added in their
          own OpenSpec changes.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Content items", "Schema ready"],
          ["Affiliate URLs", "Centralized later"],
          ["Public routes", "Unaffected"],
          ["Admin modules", `${adminModuleItems.length} reserved`],
        ].map(([label, value]) => (
          <article
            className="rounded-lg border border-[#d9ded7] bg-white p-4"
            key={label}
          >
            <p className="text-sm font-medium text-[#5f6268]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#111827]">{value}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              Admin modules
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#5f6268]">
              Each module has a stable route and clear implementation boundary.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminModuleItems.map((item) => (
            <Link
              className="rounded-lg border border-[#d9ded7] bg-white p-4 transition hover:border-[#0f766e] hover:shadow-sm"
              href={item.href}
              key={item.href}
            >
              <h3 className="text-base font-semibold text-[#111827]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#5f6268]">
                {item.summary}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#0f766e]">
                Open module
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
