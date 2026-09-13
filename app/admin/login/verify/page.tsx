import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { VerifyForm } from "@/app/admin/login/verify/verify-form";
import { getLoginChallenge, sanitizeAdminReturnTo } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export default async function AdminVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  if (!(await getLoginChallenge())) redirect("/admin/login/");
  const returnTo = sanitizeAdminReturnTo((await searchParams).returnTo);
  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <Image className="admin-login-mark" src="/brand/marketgb/marketgb-icon-180-v1.png" alt="" width={180} height={180} priority />
        <p className="admin-login-eyebrow">TWO-FACTOR VERIFICATION</p>
        <h1>Confirm it’s you</h1>
        <p className="admin-login-copy">Enter the current six-digit code, or one unused recovery code.</p>
        <VerifyForm returnTo={returnTo} />
        <Link className="admin-login-back" href="/admin/login/">← Start over</Link>
      </section>
    </main>
  );
}
