import { ContentForm } from "@/app/admin/content/content-form";
import { createContentAction } from "@/app/admin/content/actions";
import { prisma } from "@/lib/db";
import { getCsrfToken } from "@/lib/admin/session";
import { isStorageConfigured, MAX_MEDIA_UPLOAD_BYTES } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function getContentFormOptions() {
  const [markets, templates, brokers, categories, topics, mediaAssets] = await Promise.all([
    prisma.market.findMany({
      where: { status: "ACTIVE" },
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
    prisma.broker.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
    prisma.category.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, marketId: true, name: true, parentId: true, status: true } }),
    prisma.topic.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, marketId: true, name: true, status: true, topicCluster: { select: { name: true } } } }),
    prisma.mediaAsset.findMany({ where: { status: "READY" }, orderBy: { createdAt: "desc" }, select: { id: true, originalFilename: true } }),
  ]);

  return { brokers, categories, markets, mediaAssets, templates, topics };
}

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; warning?: string }>;
}) {
  const { error, warning } = await searchParams;
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
      brokers={options.brokers}
      categories={options.categories}
      csrfToken={await getCsrfToken()}
      error={error}
      markets={options.markets}
      maxBytes={MAX_MEDIA_UPLOAD_BYTES}
      mediaAssets={options.mediaAssets}
      storageReady={await isStorageConfigured()}
      warning={warning}
      templates={options.templates}
      topics={options.topics}
    />
  );
}
