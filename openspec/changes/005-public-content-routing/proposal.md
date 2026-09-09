# Change: Public content routing

## Goal

Render published CMS content on the public site using the SEO-safe URL pattern:

```text
/{market}/{content-type}/{slug}/
```

## Scope

- Add a dynamic public route for market-scoped content.
- Resolve content by market code, content type path segment, slug, and `PUBLISHED` status.
- Render a basic public page with header, breadcrumb, one H1, main body, footer, and canonical metadata.
- Add minimal Prisma seed data for local/demo verification.
- Keep root slug routing out of scope.

## Out of scope

- Broker profile routes.
- Compare routes.
- Full template-specific block rendering.
- Sitemap and hreflang generation.
