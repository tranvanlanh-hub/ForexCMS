import { notFound } from "next/navigation";
import { ContentForm } from "@/app/admin/content/content-form";
import { updateContentAction } from "@/app/admin/content/actions";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getEditContentData(id: string) {
  const [item, markets, templates] = await Promise.all([
    prisma.contentItem.findUnique({
      where: { id },
      include: { seoMetadata: true },
    }),
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

  return { item, markets, templates };
}

export default async function EditContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  let data: Awaited<ReturnType<typeof getEditContentData>> | null = null;
  let isDatabaseReady = true;

  try {
    data = await getEditContentData(id);
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady || !data) {
    return (
      <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
        <h1 className="text-base font-semibold text-[#9a3412]">
          Database is not ready
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#9a3412]">
          Connect PostgreSQL and run the Prisma migration before editing
          content.
        </p>
      </div>
    );
  }

  if (!data.item) {
    notFound();
  }

  return (
    <ContentForm
      action={updateContentAction}
      error={error}
      item={data.item}
      markets={data.markets}
      saved={saved === "1"}
      templates={data.templates}
    />
  );
}
