"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-md border border-[#f5c2c7] bg-[#fff5f5] p-5 text-[#111827]">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b42318]">
        Admin error
      </p>
      <h1 className="mt-2 text-2xl font-semibold">This admin view failed</h1>
      <p className="mt-3 text-sm leading-6 text-[#5f6268]">
        The public site is separate from this fallback. Retry after checking the
        database connection, environment variables, and runtime logs.
      </p>
      <button
        className="mt-5 rounded-md bg-[#123c3a] px-4 py-2 text-sm font-semibold text-white"
        onClick={() => reset()}
        type="button"
      >
        Retry
      </button>
    </section>
  );
}
