import {
  ContentStatus,
  ContentType,
  type Market,
  type Prisma,
  type SeoMetadata,
  type Template,
} from "@prisma/client";
import Link from "next/link";
import {
  contentStatusLabels,
  contentTypeLabels,
  getMarkdownBody,
} from "@/lib/content";

type ContentFormItem = {
  id: string;
  title: string;
  slug: string;
  marketId: string;
  templateId: string;
  contentType: ContentType;
  status: ContentStatus;
  body: Prisma.JsonValue;
  canonicalPath: string;
  seoMetadata: SeoMetadata | null;
};

type ContentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  item?: ContentFormItem;
  markets: Pick<
    Market,
    "id" | "code" | "name" | "languageCode" | "locale" | "isGlobal"
  >[];
  saved?: boolean;
  templates: Pick<Template, "id" | "key" | "name" | "kind" | "isActive">[];
};

const editableStatuses = [
  ContentStatus.DRAFT,
  ContentStatus.PUBLISHED,
  ContentStatus.ARCHIVED,
] as const;

export function ContentForm({
  action,
  error,
  item,
  markets,
  saved,
  templates,
}: ContentFormProps) {
  const isEditing = Boolean(item);
  const selectedStatus = item?.status ?? ContentStatus.DRAFT;

  return (
    <form action={action} className="flex flex-col gap-6">
      {item ? <input name="id" type="hidden" value={item.id} /> : null}

      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Content Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              {isEditing ? "Edit content" : "Create content"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Drafts can be incomplete. Published content must include routing,
              body, template, and SEO fields.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md border border-[#cbd5ce] bg-white px-4 text-sm font-semibold text-[#111827] transition hover:border-[#0f766e]"
            href="/admin/content"
          >
            Back to list
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-[#f0b8a8] bg-[#fff7f4] px-4 py-3 text-sm font-medium leading-6 text-[#9a3412]">
          {error}
        </div>
      ) : null}

      {saved ? (
        <div className="rounded-md border border-[#b7dfca] bg-[#f0fdf6] px-4 py-3 text-sm font-medium leading-6 text-[#166534]">
          Content saved.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <label className="text-sm font-semibold text-[#111827]" htmlFor="title">
              Title
            </label>
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.title}
              id="title"
              name="title"
              required
            />

            <label
              className="mt-5 block text-sm font-semibold text-[#111827]"
              htmlFor="body"
            >
              Body / content
            </label>
            <textarea
              className="mt-2 min-h-[360px] w-full resize-y rounded-md border border-[#cbd5ce] px-3 py-3 font-mono text-sm leading-6 outline-none transition focus:border-[#0f766e]"
              defaultValue={getMarkdownBody(item?.body)}
              id="body"
              name="body"
              placeholder="Write markdown content here. Use broker/campaign tokens later instead of raw affiliate links."
            />
          </div>

          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">SEO</h2>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-semibold text-[#111827]" htmlFor="seoTitle">
                SEO title
                <input
                  className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                  defaultValue={item?.seoMetadata?.title}
                  id="seoTitle"
                  name="seoTitle"
                />
              </label>
              <label
                className="text-sm font-semibold text-[#111827]"
                htmlFor="metaDescription"
              >
                Meta description
                <textarea
                  className="mt-2 min-h-24 w-full resize-y rounded-md border border-[#cbd5ce] px-3 py-3 text-sm font-normal leading-6 outline-none transition focus:border-[#0f766e]"
                  defaultValue={item?.seoMetadata?.description}
                  id="metaDescription"
                  name="metaDescription"
                />
              </label>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Publishing</h2>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-semibold text-[#111827]" htmlFor="status">
                Status
                <select
                  className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                  defaultValue={selectedStatus}
                  id="status"
                  name="status"
                >
                  {editableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {contentStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="h-11 rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
                type="submit"
              >
                {isEditing ? "Save changes" : "Create content"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Route</h2>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-semibold text-[#111827]" htmlFor="slug">
                Slug
                <input
                  className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                  defaultValue={item?.slug}
                  id="slug"
                  name="slug"
                  required
                />
              </label>

              <label className="text-sm font-semibold text-[#111827]" htmlFor="marketId">
                Market / language
                <select
                  className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                  defaultValue={item?.marketId ?? markets[0]?.id}
                  id="marketId"
                  name="marketId"
                  required
                >
                  {markets.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.code} - {market.name} ({market.locale})
                    </option>
                  ))}
                </select>
              </label>

              <label
                className="text-sm font-semibold text-[#111827]"
                htmlFor="contentType"
              >
                Content type
                <select
                  className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                  defaultValue={item?.contentType ?? ContentType.ARTICLE}
                  id="contentType"
                  name="contentType"
                  required
                >
                  {Object.values(ContentType).map((type) => (
                    <option key={type} value={type}>
                      {contentTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>

              {item?.canonicalPath ? (
                <p className="rounded-md border border-[#d9ded7] bg-[#fbfcfb] px-3 py-2 text-xs font-semibold text-[#374151]">
                  {item.canonicalPath}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Template</h2>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="templateId">
              Template
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.templateId ?? templates[0]?.id}
                id="templateId"
                name="templateId"
                required
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.kind.toLowerCase()})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </aside>
      </section>
    </form>
  );
}
