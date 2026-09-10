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
    title: "Markets",
    href: "/admin/markets",
    slug: "markets",
    summary: "Manage supported markets and language settings.",
    scope: "Market code, country, language, locale, and status.",
    plannedEntities: ["Market", "ContentTranslationGroup"],
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
    title: "Analytics",
    href: "/admin/analytics",
    slug: "analytics",
    summary: "Track affiliate clicks and content quality issues.",
    scope: "Affiliate click events, top brokers, top content, SEO gaps, broken CTA links, and orphan pages.",
    plannedEntities: ["AffiliateClickEvent", "ContentItem", "AffiliateLink"],
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
    title: "Internal Links",
    href: "/admin/internal-links",
    slug: "internal-links",
    summary: "Review topic cluster driven internal link suggestions.",
    scope: "Topic clusters, anchor text, link rules, suggestions, and approvals.",
    plannedEntities: [
      "TopicCluster",
      "AnchorText",
      "InternalLinkRule",
      "InternalLinkSuggestion",
    ],
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
    title: "Content Scale",
    href: "/admin/content-scale",
    slug: "content-scale",
    summary: "Review AI brief schema, pilot drafts, batch plan, and scale gates.",
    scope: "Checkpoint 16-20 visibility, pilot audit, batch readiness, and operations notes.",
    plannedEntities: ["ContentItem", "Template", "SeoMetadata", "AffiliateLink"],
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
