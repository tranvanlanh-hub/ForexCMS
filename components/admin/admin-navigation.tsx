"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems } from "@/lib/admin/navigation";

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      {adminNavItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-semibold transition",
              isActive
                ? "bg-[#123c3a] text-white"
                : "text-[#374151] hover:bg-[#edf4f1] hover:text-[#123c3a]",
            ].join(" ")}
            href={item.href}
            key={item.href}
          >
            <span>{item.title}</span>
            {isActive ? (
              <span className="h-2 w-2 rounded-full bg-[#7dd3c7]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
