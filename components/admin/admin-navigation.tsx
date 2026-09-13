"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems } from "@/lib/admin/navigation";
const groups = [
    { title: "WORKSPACE", slugs: ["dashboard", "content", "ai-import", "content-scale"] },
    { title: "MANAGE", slugs: ["brokers", "affiliate-links", "markets", "templates", "taxonomy", "media"] },
    { title: "INSIGHTS & SETTINGS", slugs: ["analytics", "seo", "internal-links", "url-routing", "settings"] },
];
const icons: Record<string, string> = { dashboard: "▦", content: "▤", "ai-import": "↓", "content-scale": "▥", brokers: "◈", "affiliate-links": "↗", markets: "◎", templates: "▧", taxonomy: "⌘", media: "▣", analytics: "▥", seo: "⌕", "internal-links": "⇄", "url-routing": "⌁", settings: "⚙" };
export function AdminNavigation() {
    const pathname = usePathname().replace(/\/$/, "");
    return <nav aria-label="Admin navigation" className="admin-nav">{groups.map(group => <div className="nav-group" key={group.title}><p>{group.title}</p>{group.slugs.map(slug => { const item = adminNavItems.find(item => item.slug === slug); if (!item)
        return null; const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(item.href + "/"); return <Link key={slug} href={item.href} aria-current={active ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{icons[slug]}</span><span>{item.title}</span>{active && <span className="nav-active-dot"/>}</Link>; })}</div>)}</nav>;
}
