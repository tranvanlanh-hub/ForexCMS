import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/admin/login/actions";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { getCsrfToken, requireAdminSession } from "@/lib/admin/session";
export const revalidate = 0;
export default async function AdminLayout({ children }: {
    children: ReactNode;
}) {
    noStore();
    if ((await headers()).get("x-forexcms-auth-page") === "1") return children;
    const { account } = await requireAdminSession();
    const csrfToken = await getCsrfToken();
    return <div className="admin-app"><a className="skip-link" href="#admin-main">Skip to content</a><aside className="admin-sidebar"><Link className="admin-brand" href="/admin"><Image className="admin-brand-logo" src="/brand/marketgb/marketgb-logo-primary-v1.png" alt="MarketGB" width={1200} height={249}/><small>EDITORIAL WORKSPACE</small></Link><details className="mobile-admin-menu"><summary>Workspace navigation</summary><AdminNavigation /></details><div className="desktop-admin-menu"><AdminNavigation /></div><div className="sidebar-bottom"><span className="user-avatar">{account.username.slice(0, 1).toUpperCase()}</span><div>{account.username}<small>administrator</small></div><form action={logoutAction} className="admin-logout-form"><input name="_csrf" type="hidden" value={csrfToken}/><button aria-label="Sign out" title="Sign out" type="submit">↪</button></form></div></aside><div className="admin-workspace"><header className="admin-topbar"><span>MarketGB <span className="topbar-slash">/</span> Content management</span><Link href="/" target="_blank" rel="noopener noreferrer">View website ↗</Link></header><main id="admin-main" className="admin-main">{children}</main></div></div>;
}
