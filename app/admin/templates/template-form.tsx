import { TemplateKind, type Template } from "@prisma/client";
import Link from "next/link";
import { CsrfField } from "@/components/admin/csrf-field";
import {
  asTemplateStringArray,
  templateBlockOptions,
  templateCtaSlotOptions,
  templateKindLabels,
  templateSchemaOptions,
} from "@/lib/templates";

type TemplateFormItem = Pick<
  Template,
  | "id"
  | "key"
  | "name"
  | "kind"
  | "description"
  | "requiredBlocks"
  | "allowedBlocks"
  | "schemaTypes"
  | "ctaSlots"
  | "internalLinkSlots"
  | "isActive"
>;

type TemplateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  item?: TemplateFormItem;
  saved?: boolean;
};

const defaultAllowedBlocks = [
  "intro",
  "summary",
  "table_of_contents",
  "body",
  "faq",
];
const defaultRequiredBlocks = ["intro", "body"];
const defaultSchemas = ["Article", "BreadcrumbList", "FAQPage"];

function CheckboxOption({
  checked,
  label,
  name,
  value,
}: {
  checked: boolean;
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-[#e4e8e3] bg-[#fbfcfb] px-3 py-3 text-sm font-medium text-[#374151]">
      <input defaultChecked={checked} name={name} type="checkbox" value={value} />
      {label}
    </label>
  );
}

export function TemplateForm({ action, error, item, saved }: TemplateFormProps) {
  const isEditing = Boolean(item);
  const allowedBlocks = item
    ? asTemplateStringArray(item.allowedBlocks)
    : defaultAllowedBlocks;
  const requiredBlocks = item
    ? asTemplateStringArray(item.requiredBlocks)
    : defaultRequiredBlocks;
  const schemaTypes = item
    ? asTemplateStringArray(item.schemaTypes)
    : defaultSchemas;
  const ctaSlots = item ? asTemplateStringArray(item.ctaSlots) : [];
  const internalLinkSlots = item
    ? asTemplateStringArray(item.internalLinkSlots).join(", ")
    : "contextual_body, related_articles";

  return (
    <form action={action} className="flex flex-col gap-6">
      <CsrfField />
      {item ? <input name="id" type="hidden" value={item.id} /> : null}

      <section className="border-b border-[#d9ded7] pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          Template Manager
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold leading-tight text-[#111827]">
              {isEditing ? "Edit template" : "Create template"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6268]">
              Control the structure, validation, schema, CTA positions, and
              internal-link slots used by content.
            </p>
          </div>
          <Link
            className="inline-flex h-10 w-fit items-center rounded-md border border-[#cbd5ce] bg-white px-4 text-sm font-semibold text-[#111827] transition hover:border-[#0f766e]"
            href="/admin/templates"
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
          Template saved.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <label className="text-sm font-semibold text-[#111827]" htmlFor="name">
            Name
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.name}
              id="name"
              name="name"
              required
            />
          </label>
          <label className="mt-5 block text-sm font-semibold text-[#111827]" htmlFor="description">
            Description
            <textarea
              className="mt-2 min-h-28 w-full resize-y rounded-md border border-[#cbd5ce] px-3 py-3 text-sm font-normal leading-6 outline-none transition focus:border-[#0f766e]"
              defaultValue={item?.description ?? ""}
              id="description"
              maxLength={500}
              name="description"
            />
          </label>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Availability</h2>
            <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-[#111827]">
              <input
                defaultChecked={item?.isActive ?? true}
                name="isActive"
                type="checkbox"
              />
              Active for content publishing
            </label>
            <button
              className="mt-5 h-11 w-full rounded-md bg-[#123c3a] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4f49]"
              type="submit"
            >
              {isEditing ? "Save changes" : "Create template"}
            </button>
          </div>
          <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#111827]">Identity</h2>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="key">
              Key
              <input
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.key}
                id="key"
                name="key"
                placeholder="broker-review"
                required
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-[#111827]" htmlFor="kind">
              Kind
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#cbd5ce] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#0f766e]"
                defaultValue={item?.kind ?? TemplateKind.ARTICLE}
                id="kind"
                name="kind"
              >
                {Object.values(TemplateKind).map((kind) => (
                  <option key={kind} value={kind}>
                    {templateKindLabels[kind]}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-xs leading-5 text-[#5f6268]">
              Kind cannot change after content starts using this template.
            </p>
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-[#d9ded7] bg-white p-5">
        <h2 className="text-base font-semibold text-[#111827]">Content blocks</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f6268]">
          Allowed blocks can be rendered. Required blocks must be present before
          content using this template can be published.
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <fieldset>
            <legend className="text-sm font-semibold text-[#111827]">Allowed blocks</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {templateBlockOptions.map((option) => (
                <CheckboxOption
                  checked={allowedBlocks.includes(option.value)}
                  key={option.value}
                  label={option.label}
                  name="allowedBlocks"
                  value={option.value}
                />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold text-[#111827]">Required to publish</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {templateBlockOptions.map((option) => (
                <CheckboxOption
                  checked={requiredBlocks.includes(option.value)}
                  key={option.value}
                  label={option.label}
                  name="requiredBlocks"
                  value={option.value}
                />
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <fieldset className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <legend className="px-1 text-base font-semibold text-[#111827]">Schema types</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {templateSchemaOptions.map((schema) => (
              <CheckboxOption
                checked={schemaTypes.includes(schema)}
                key={schema}
                label={schema}
                name="schemaTypes"
                value={schema}
              />
            ))}
          </div>
        </fieldset>
        <div className="rounded-lg border border-[#d9ded7] bg-white p-5">
          <fieldset>
            <legend className="text-base font-semibold text-[#111827]">CTA positions</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {templateCtaSlotOptions.map((slot) => (
                <CheckboxOption
                  checked={ctaSlots.includes(slot)}
                  key={slot}
                  label={slot[0].toUpperCase() + slot.slice(1)}
                  name="ctaSlots"
                  value={slot}
                />
              ))}
            </div>
          </fieldset>
          <label className="mt-5 block text-sm font-semibold text-[#111827]" htmlFor="internalLinkSlots">
            Internal-link slots
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-md border border-[#cbd5ce] px-3 py-3 font-mono text-sm font-normal leading-6 outline-none transition focus:border-[#0f766e]"
              defaultValue={internalLinkSlots}
              id="internalLinkSlots"
              name="internalLinkSlots"
              placeholder="contextual_body, related_articles"
            />
          </label>
        </div>
      </section>
    </form>
  );
}
