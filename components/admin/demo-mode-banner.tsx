import Link from "next/link";

export function DemoModeBanner({ module }: { module: string }) {
  return (
    <div className="rounded-lg border border-[#f0d38a] bg-[#fff8e6] p-5">
      <h2 className="text-base font-semibold text-[#7a4d00]">
        Demo mode: {module}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#7a4d00]">
        PostgreSQL is not reachable, so this screen is showing file-backed pilot
        data instead of database records.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          className="rounded-md border border-[#d6b25c] bg-white px-4 py-2 text-sm font-semibold text-[#7a4d00] hover:border-[#9a6b00]"
          href="/demo/content-scale/"
        >
          Open frontend demo
        </Link>
        <Link
          className="rounded-md border border-[#d6b25c] bg-white px-4 py-2 text-sm font-semibold text-[#7a4d00] hover:border-[#9a6b00]"
          href="/admin/content-scale"
        >
          Open scale overview
        </Link>
      </div>
    </div>
  );
}
