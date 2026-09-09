import Link from "next/link";

const publicSections = [
  "Broker reviews",
  "Country hubs",
  "Forex education",
  "Comparison pages",
];

const platformSignals = [
  "PostgreSQL-ready content model",
  "Central affiliate resolver planned",
  "S3-compatible media boundary",
  "Portable from Cloudflare to VPS",
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Forex Affiliate CMS
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
              Scalable content foundation for global forex affiliate publishing.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              A custom CMS shell for structured broker pages, education content,
              market-specific hubs, and centralized affiliate operations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                href="/admin"
              >
                Open admin shell
              </Link>
              <Link
                className="inline-flex h-11 items-center rounded-md border border-[var(--border)] px-5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]"
                href="#site-foundation"
              >
                View foundation
              </Link>
            </div>
          </div>

          <div
            aria-label="CMS foundation status"
            className="grid content-start gap-3 rounded-lg border border-[var(--border)] bg-[#fbfaf7] p-5"
          >
            {platformSignals.map((signal) => (
              <div
                className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-3 last:border-b-0"
                key={signal}
              >
                <span className="text-sm font-medium text-[var(--ink)]">
                  {signal}
                </span>
                <span className="rounded-full bg-[#dff3ee] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                  Ready
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="site-foundation" className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--ink)]">
              Public site shell
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              The first public surface is intentionally simple while the CMS
              data model, URL resolver, SEO layer, and affiliate resolver are
              built in later phases.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {publicSections.map((section) => (
            <article
              className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5"
              key={section}
            >
              <h3 className="text-base font-semibold text-[var(--ink)]">
                {section}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Placeholder surface reserved for structured, non-root URL
                content in future OpenSpec changes.
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
