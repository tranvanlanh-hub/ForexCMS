import { ContentForm } from "@/app/admin/content/content-form";
import { createContentAction } from "@/app/admin/content/actions";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getContentFormOptions() {
  const [markets, templates] = await Promise.all([
    prisma.market.findMany({
      orderBy: [{ isGlobal: "desc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        languageCode: true,
        locale: true,
        isGlobal: true,
      },
    }),
    prisma.template.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        key: true,
        name: true,
        kind: true,
        isActive: true,
      },
    }),
  ]);

  return { markets, templates };
}

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  let options: Awaited<ReturnType<typeof getContentFormOptions>> | null = null;
  let isDatabaseReady = true;

  try {
    options = await getContentFormOptions();
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady || !options) {
    return (
      <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
        <h1 className="text-base font-semibold text-[#9a3412]">
          Database is not ready
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#9a3412]">
          Connect PostgreSQL and run the Prisma migration before creating
          content.
        </p>
      </div>
    );
  }

  if (options.markets.length === 0 || options.templates.length === 0) {
    return (
      <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
        <h1 className="text-base font-semibold text-[#9a3412]">
          Seed data needed
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#9a3412]">
          Create at least one market and one active template before adding
          content.
        </p>
      </div>
    );
  }

  return (
    <ContentForm
      action={createContentAction}
      error={error}
      markets={options.markets}
      templates={options.templates}
    />
  );
}
