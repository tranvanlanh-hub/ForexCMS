import { notFound } from "next/navigation";
import { ContentForm } from "@/app/admin/content/content-form";
import { updateContentAction } from "@/app/admin/content/actions";
import { prisma } from "@/lib/db";
import { getCsrfToken } from "@/lib/admin/session";
import { isStorageConfigured, MAX_MEDIA_UPLOAD_BYTES } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function getEditContentData(id: string) {
  const item = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      brokers: { select: { id: true, name: true, slug: true } },
      seoMetadata: true,
      translationGroup: true,
      urls: { orderBy: { createdAt: "desc" } },
      categories: { select: { id: true } },
      topics: { select: { id: true } },
    },
  });

  const [markets, templates, brokers, categories, topics, mediaAssets] = await Promise.all([
    prisma.market.findMany({
      where: {
        OR: [{ status: "ACTIVE" }, ...(item ? [{ id: item.marketId }] : [])],
      },
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
      where: {
        OR: [
          { isActive: true },
          ...(item ? [{ id: item.templateId }] : []),
        ],
      },
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
      where: {
        OR: [
          { status: { not: "ARCHIVED" } },
          ...(item ? [{ contentItems: { some: { id } } }] : []),
        ],
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
    prisma.category.findMany({ where: { OR: [{ status: "ACTIVE" }, { contentItems: { some: { id } } }, { primaryContent: { some: { id } } }] }, orderBy: { name: "asc" }, select: { id: true, marketId: true, name: true, parentId: true, status: true } }),
    prisma.topic.findMany({ where: { OR: [{ status: "ACTIVE" }, { contentItems: { some: { id } } }, { primaryContent: { some: { id } } }] }, orderBy: { name: "asc" }, select: { id: true, marketId: true, name: true, status: true, topicCluster: { select: { name: true } } } }),
    prisma.mediaAsset.findMany({ where: { OR: [{ status: "READY" }, { featuredContent: { some: { id } } }, { socialContent: { some: { id } } }] }, orderBy: { createdAt: "desc" }, select: { id: true, originalFilename: true } }),
  ]);

  return { brokers, categories, item, markets, mediaAssets, templates, topics };
}

export default async function EditContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; warning?: string }>;
}) {
  const { id } = await params;
  const { error, saved, warning } = await searchParams;
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
      brokers={data.brokers}
      categories={data.categories}
      csrfToken={await getCsrfToken()}
      error={error}
      item={data.item}
      markets={data.markets}
      maxBytes={MAX_MEDIA_UPLOAD_BYTES}
      mediaAssets={data.mediaAssets}
      saved={saved === "1"}
      storageReady={await isStorageConfigured()}
      warning={warning}
      templates={data.templates}
      topics={data.topics}
    />
  );
}
