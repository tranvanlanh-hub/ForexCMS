import { ContentStatus } from "@prisma/client";
import Link from "next/link";
import {
  contentStatusLabels,
  contentTypeLabels,
  getMarkdownBody,
} from "@/lib/content";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type ContentListItem = Awaited<ReturnType<typeof getContentItems>>[number];

async function getContentItems() {
  return prisma.contentItem.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      market: true,
      template: true,
      seoMetadata: true,
    },
    take: 100,
  });
}

function statusClass(status: ContentStatus) {
  if (status === ContentStatus.PUBLISHED) {
    return "border-[#b7dfca] bg-[#f0fdf6] text-[#166534]";
  }

  if (status === ContentStatus.ARCHIVED) {
    return "border-[#d8dadd] bg-[#f4f4f5] text-[#52525b]";
  }

  return "border-[#f4d28c] bg-[#fffbeb] text-[#92400e]";
}

export default async function AdminContentPage() {
  let items: ContentListItem[] = [];
  let isDatabaseReady = true;

  try {
    items = await getContentItems();
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady) {
    return (
      <div className="flex flex-col gap-6">
        <section className="border-b border-[#d9ded7] pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
            Content Manager
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827]">
            Content
          </h1>
        </section>
        <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
          <h2 className="text-base font-semibold text-[#9a3412]">
            Database is not ready
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#9a3412]">
            Connect PostgreSQL and run the Prisma migration before using the
            database-backed Content Manager.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Content Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              Content
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Manage market-scoped content with templates, publishing status,
              canonical paths, and SEO metadata.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
            href="/admin/content/new"
          >
            New content
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Draft", items.filter((item) => item.status === "DRAFT").length],
          [
            "Published",
            items.filter((item) => item.status === "PUBLISHED").length,
          ],
          [
            "Archived",
            items.filter((item) => item.status === "ARCHIVED").length,
          ],
        ].map(([label, value]) => (
          <div
            className="rounded-lg border border-[#d9ded7] bg-white p-4"
            key={label}
          >
            <p className="text-sm font-medium text-[#5f6268]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
        {items.length === 0 ? (
          <div className="p-6">
            <h2 className="text-base font-semibold text-[#111827]">
              No content yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f6268]">
              Create the first draft after market and template seed data are
              available.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Template</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">SEO</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1ed]">
                {items.map((item) => {
                  const hasBody = Boolean(getMarkdownBody(item.body));
                  const hasSeo = Boolean(
                    item.seoMetadata?.title && item.seoMetadata.description,
                  );

                  return (
                    <tr className="align-top" key={item.id}>
                      <td className="px-4 py-4">
                        <Link
                          className="font-semibold text-[#123c3a] hover:underline"
                          href={`/admin/content/${item.id}/edit`}
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-xs text-[#5f6268]">
                          {item.canonicalPath}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-[#374151]">
                        {item.market.code}
                        <span className="block text-xs text-[#5f6268]">
                          {item.market.locale}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#374151]">
                        {contentTypeLabels[item.contentType]}
                      </td>
                      <td className="px-4 py-4 text-[#374151]">
                        {item.template.name}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                            statusClass(item.status),
                          ].join(" ")}
                        >
                          {item.status === ContentStatus.REVIEW
                            ? "Review"
                            : contentStatusLabels[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-[#374151]">
                        {hasSeo && hasBody ? "Ready" : "Missing fields"}
                      </td>
                      <td className="px-4 py-4 text-[#5f6268]">
                        {item.updatedAt.toLocaleDateString("en-US")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
