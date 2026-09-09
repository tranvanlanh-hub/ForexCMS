# Design: Initial Database Schema

## ORM Choice

The project will use Prisma 6.x with PostgreSQL.

Reasons:

- Schema readability is important for a CMS that will evolve across many small Codex sessions.
- Prisma migrations map cleanly to a VPS Linux PostgreSQL deployment.
- Generated TypeScript types help future admin and public rendering work.
- The project does not need Cloudflare D1 or edge-only database constraints for core CMS data.

## Core Modeling

### Market

`Market` represents a public URL and localization scope such as `global`, `us`, `vn`, or `th`. Content, categories, topics, SEO metadata, and affiliate links attach to a market to avoid mixing language/country routing rules.

### Content

`ContentItem` stores the current editable/publishable state. It is scoped by market and template, has a hierarchical URL path, and blocks duplicate slugs within the same market and content type.

`ContentRevision` stores historical snapshots of content fields for editorial recovery and audit workflows.

### Taxonomy

`Category` is the primary navigational taxonomy and supports parent/child hierarchy per market.

`Topic` represents topic clusters and supports parent/child hierarchy per market.

Content can have primary category/topic fields plus many-to-many supporting categories/topics.

### Template

`Template` stores structured template definitions, required blocks, schema behavior, CTA slots, and internal link slots. This keeps key page layouts inside Template Manager boundaries.

### SEO

`SeoMetadata` is separate from content so the SEO Manager can own metadata, canonical paths, robots directives, hreflang maps, and schema JSON-LD. It can attach to content or broker pages.

### Broker and Affiliate

`Broker` stores broker identity and structured facts.

`AffiliateLink` stores destination URLs centrally and is resolved by broker, market, and campaign. Content and templates should reference broker/campaign tokens rather than embedding destination URLs.

## Portability

The schema uses PostgreSQL through `DATABASE_URL`. No Cloudflare D1-specific features are introduced. Media references should remain asset keys or URLs managed through the S3-compatible storage boundary.
