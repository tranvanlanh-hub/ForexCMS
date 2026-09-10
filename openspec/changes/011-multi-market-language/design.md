# Design

## Market registry

The application uses a small explicit registry of supported markets. Admin writes validate against this registry so editors cannot accidentally create arbitrary market prefixes that would leak into canonical paths.

Supported markets:

- `global`: English global scope, no country code.
- `us`: United States English.
- `uk`: United Kingdom English.
- `au`: Australia English.
- `vn`: Vietnam Vietnamese.
- `th`: Thailand Thai.

The existing `Market` model already stores the required fields. This change keeps that model and adds seed data plus admin validation.

## Translation grouping

`ContentTranslationGroup` groups content items that cover the same subject across markets/languages. A content item may belong to one group. A group should have at most one content item per market.

This is intentionally separate from slug and canonical URL ownership. Each translated or localized item still owns its own slug, content type, template, SEO metadata, and canonical path.

## Hreflang generation

Public content routes include the content item's translation group. Language alternates are derived from published group siblings only.

Rules:

- Use each sibling's market locale as the hreflang key.
- Use the sibling's market-scoped canonical path.
- Skip alternates whose canonical path does not start with the sibling market prefix.
- Use the global sibling as `x-default` when present.
- If no siblings exist, keep the current self-reference behavior.

This prevents canonical or hreflang links from pointing to the wrong market.

## Admin

Add a basic `/admin/markets` manager with list, create, and edit screens for supported market records. The content form gets an optional translation group key field so editors can connect related localized versions without changing URL routing.
