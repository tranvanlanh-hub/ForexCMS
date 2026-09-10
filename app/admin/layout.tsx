import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { normalizeAdminRole } from "@/lib/admin/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const adminRole = normalizeAdminRole(
    (await headers()).get("x-forexcms-admin-role"),
  );

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-[#111827]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[#d9ded7] pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
              ForexCMS
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#111827]">
              Admin
            </h1>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md border border-[#cbd5ce] bg-white px-4 text-sm font-semibold text-[#111827] transition hover:border-[#0f766e]"
            href="/"
          >
            View public site - {adminRole}
          </Link>
        </header>

        <div className="grid flex-1 gap-5 py-5 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-lg border border-[#d9ded7] bg-white p-3 lg:sticky lg:top-4">
            <AdminNavigation />
          </aside>
          <section className="min-w-0 py-1">{children}</section>
        </div>
      </div>
    </main>
  );
}
