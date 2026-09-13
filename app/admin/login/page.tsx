import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/login/login-form";
import { readAdminSession, sanitizeAdminReturnTo } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  if (await readAdminSession()) redirect("/admin/");
  const returnTo = sanitizeAdminReturnTo((await searchParams).returnTo);
  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <Image className="admin-login-mark" src="/brand/marketgb/marketgb-icon-180-v1.png" alt="" width={180} height={180} priority />
        <p className="admin-login-eyebrow">MARKETGB · PRIVATE ADMIN</p>
        <h1>Welcome back</h1>
        <p className="admin-login-copy">Sign in to your protected editorial workspace.</p>
        <LoginForm returnTo={returnTo} />
        <p className="admin-login-note">Protected by password hashing, two-factor authentication, and short-lived server sessions.</p>
      </section>
    </main>
  );
}
