import { getCsrfToken } from "@/lib/admin/session";

export async function CsrfField() {
  const token = await getCsrfToken();
  return <input name="_csrf" type="hidden" value={token} />;
}
