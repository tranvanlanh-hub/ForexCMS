import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  asTemplateStringArray,
  templateKindLabels,
} from "@/lib/templates";

export const dynamic = "force-dynamic";

async function getTemplates() {
  return prisma.template.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { contentItems: true } } },
  });
}

export default async function AdminTemplatesPage() {
  let templates: Awaited<ReturnType<typeof getTemplates>> = [];
  let isDatabaseReady = true;

  try {
    templates = await getTemplates();
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady) {
    return (
      <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
        <h1 className="text-base font-semibold text-[#9a3412]">Database is not ready</h1>
        <p className="mt-2 text-sm leading-6 text-[#9a3412]">
          Connect PostgreSQL and run the Prisma migrations before managing templates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Template Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">Templates</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Manage reusable content structures, publish requirements, schema,
              CTA positions, and internal-link slots.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
            href="/admin/templates/new"
          >
            New template
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total", templates.length],
          ["Active", templates.filter((template) => template.isActive).length],
          ["Content using templates", templates.reduce((sum, template) => sum + template._count.contentItems, 0)],
        ].map(([label, value]) => (
          <div className="rounded-lg border border-[#d9ded7] bg-white p-4" key={label}>
            <p className="text-sm font-medium text-[#5f6268]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#111827]">{value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-[#d9ded7] bg-white">
        {templates.length === 0 ? (
          <div className="p-6">
            <h2 className="text-base font-semibold text-[#111827]">No templates yet</h2>
            <p className="mt-2 text-sm leading-6 text-[#5f6268]">
              Create a template before adding structured content.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#d9ded7] bg-[#fbfcfb] text-xs uppercase tracking-[0.1em] text-[#5f6268]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Template</th>
                  <th className="px-4 py-3 font-semibold">Kind</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Blocks</th>
                  <th className="px-4 py-3 font-semibold">Schema</th>
                  <th className="px-4 py-3 font-semibold">Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1ed]">
                {templates.map((template) => {
                  const allowedBlocks = asTemplateStringArray(template.allowedBlocks);
                  const schemaTypes = asTemplateStringArray(template.schemaTypes);

                  return (
                    <tr className="align-top" key={template.id}>
                      <td className="px-4 py-4">
                        <Link
                          className="font-semibold text-[#123c3a] hover:underline"
                          href={`/admin/templates/${template.id}/edit`}
                        >
                          {template.name}
                        </Link>
                        <p className="mt-1 text-xs text-[#5f6268]">{template.key}</p>
                        {template.description ? (
                          <p className="mt-2 max-w-md text-sm leading-6 text-[#5f6268]">
                            {template.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-[#374151]">{templateKindLabels[template.kind]}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${template.isActive ? "border-[#b7dfca] bg-[#f0fdf6] text-[#166534]" : "border-[#d8dadd] bg-[#f4f4f5] text-[#52525b]"}`}>
                          {template.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#374151]">{allowedBlocks.length}</td>
                      <td className="px-4 py-4 text-[#5f6268]">{schemaTypes.join(", ") || "—"}</td>
                      <td className="px-4 py-4 text-[#374151]">{template._count.contentItems}</td>
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
