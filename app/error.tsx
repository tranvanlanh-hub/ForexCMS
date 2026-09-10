"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-16 text-[#111827]">
      <section className="mx-auto max-w-2xl rounded-md border border-[#d9ded7] bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Runtime error
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-[#5f6268]">
          The page could not finish loading. Try again, or check runtime logs if
          this keeps happening.
        </p>
        <button
          className="mt-6 rounded-md bg-[#123c3a] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => reset()}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
