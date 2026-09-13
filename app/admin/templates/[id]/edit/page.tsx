import { notFound } from "next/navigation";
import { updateTemplateAction } from "@/app/admin/templates/actions";
import { TemplateForm } from "@/app/admin/templates/template-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  let template: Awaited<ReturnType<typeof prisma.template.findUnique>> | null = null;
  let isDatabaseReady = true;

  try {
    template = await prisma.template.findUnique({ where: { id } });
  } catch {
    isDatabaseReady = false;
  }

  if (!isDatabaseReady) {
    return (
      <div className="rounded-lg border border-[#f0b8a8] bg-[#fff7f4] p-5">
        <h1 className="text-base font-semibold text-[#9a3412]">Database is not ready</h1>
        <p className="mt-2 text-sm leading-6 text-[#9a3412]">
          Connect PostgreSQL and run the Prisma migrations before editing templates.
        </p>
      </div>
    );
  }

  if (!template) notFound();

  return (
    <TemplateForm
      action={updateTemplateAction}
      error={error}
      item={template}
      saved={saved === "1"}
    />
  );
}
