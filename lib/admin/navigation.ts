export type AdminNavItem = {
  title: string;
  href: string;
  slug: string;
  summary: string;
  scope: string;
  plannedEntities: string[];
};

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    slug: "dashboard",
    summary: "Operational overview for the CMS foundation.",
    scope: "CMS health, publishing queues, and module status.",
    plannedEntities: ["ContentItem", "Template", "Broker", "AffiliateLink"],
  },
  {
    title: "Content",
    href: "/admin/content",
    slug: "content",
    summary: "Manage structured articles, broker reviews, hubs, and revisions.",
    scope: "Drafts, published pages, archived content, revisions, and taxonomy.",
    plannedEntities: ["ContentItem", "ContentRevision", "Category", "Topic"],
  },
  {
    title: "Templates",
    href: "/admin/templates",
    slug: "templates",
    summary: "Control reusable content structures and required blocks.",
    scope: "Article, BrokerReview, and future template definitions.",
    plannedEntities: ["Template"],
  },
  {
    title: "Brokers",
    href: "/admin/brokers",
    slug: "brokers",
    summary: "Maintain broker profiles used by reviews, comparisons, and CTAs.",
    scope: "Broker identity, ratings, facts, and market availability.",
    plannedEntities: ["Broker"],
  },
  {
    title: "Affiliate Links",
    href: "/admin/affiliate-links",
    slug: "affiliate-links",
    summary: "Reserve centralized campaign and destination management.",
    scope: "Broker campaign tokens, market fallback rules, priority, and status.",
    plannedEntities: ["AffiliateLink", "Broker"],
  },
  {
    title: "SEO",
    href: "/admin/seo",
    slug: "seo",
    summary: "Prepare metadata, canonical, schema, and hreflang management.",
    scope: "SEO metadata, robots rules, sitemap readiness, and schema checks.",
    plannedEntities: ["SeoMetadata", "ContentItem"],
  },
  {
    title: "URL Routing",
    href: "/admin/url-routing",
    slug: "url-routing",
    summary: "Reserve controls for market-scoped URL paths and canonical routes.",
    scope: "Slug, market, content type, canonical path, and redirect planning.",
    plannedEntities: ["ContentItem", "SeoMetadata", "Market"],
  },
  {
    title: "AI Import",
    href: "/admin/ai-import",
    slug: "ai-import",
    summary: "Prepare a validation-first import surface for AI generated content.",
    scope: "JSON or Markdown intake, template checks, SEO checks, and preview.",
    plannedEntities: ["ContentItem", "ContentRevision", "Template"],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    slug: "settings",
    summary: "Reserve basic configuration for CMS operations.",
    scope: "Portable app settings, environment readiness, and future permissions.",
    plannedEntities: ["Market"],
  },
];

export const adminModuleItems = adminNavItems.filter(
  (item) => item.slug !== "dashboard",
);

export function getAdminItemBySlug(slug: string) {
  return adminNavItems.find((item) => item.slug === slug);
}
