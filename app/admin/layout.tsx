import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { normalizeAdminRole } from "@/lib/admin/auth";
export default async function AdminLayout({ children }: {
    children: ReactNode;
}) {
    const adminRole = normalizeAdminRole((await headers()).get("x-forexcms-admin-role"));
    return <div className="admin-app"><a className="skip-link" href="#admin-main">Skip to content</a><aside className="admin-sidebar"><Link className="admin-brand" href="/admin"><span className="brand-symbol">F<span>↗</span></span><span>ForexCMS<small>EDITORIAL WORKSPACE</small></span></Link><details className="mobile-admin-menu"><summary>Workspace navigation</summary><AdminNavigation /></details><div className="desktop-admin-menu"><AdminNavigation /></div><div className="sidebar-bottom"><span className="user-avatar">E</span><div>Editorial workspace<small>{adminRole}</small></div><span className="online-dot" aria-label="Authenticated"/></div></aside><div className="admin-workspace"><header className="admin-topbar"><span>Workspace <span className="topbar-slash">/</span> Content management</span><Link href="/" target="_blank" rel="noopener noreferrer">View website ↗</Link></header><main id="admin-main" className="admin-main">{children}</main></div></div>;
}
