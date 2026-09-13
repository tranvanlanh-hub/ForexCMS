import { createTemplateAction } from "@/app/admin/templates/actions";
import { TemplateForm } from "@/app/admin/templates/template-form";

export default async function NewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <TemplateForm action={createTemplateAction} error={error} />;
}
