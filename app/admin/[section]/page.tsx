import { notFound } from "next/navigation";
import { AdminModulePage } from "@/components/admin/admin-module-page";
import { adminModuleItems, getAdminItemBySlug } from "@/lib/admin/navigation";

export function generateStaticParams() {
  return adminModuleItems.map((item) => ({ section: item.slug }));
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const item = getAdminItemBySlug(section);

  if (!item || item.slug === "dashboard") {
    notFound();
  }

  return <AdminModulePage item={item} />;
}
