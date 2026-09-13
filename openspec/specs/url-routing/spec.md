# Spec: URL Routing

## Mục tiêu

Quản lý cấu trúc URL rõ ràng, phân tầng, thân thiện SEO và tránh root domain slug lộn xộn.

## Requirements

- Public URL phải theo pattern phân tầng.
- Pattern ưu tiên:

```text
/{market}/{content-type}/{slug}/
/{market}/brokers/{broker-slug}/
/{market}/compare/{broker-a}-vs-{broker-b}/
```

- URL manager phải kiểm soát slug, market, content type.
- Hệ thống phải hỗ trợ canonical URL.
- Hệ thống phải tránh duplicate URL cho cùng nội dung.

## Acceptance criteria

- Không có route mặc định kiểu `/{slug}` cho mọi bài.
- Content publish tạo được URL rõ ràng.
- Slug trùng trong cùng scope bị chặn.

## Constraints

- Không đổi URL đã publish nếu không có redirect strategy.
- Không để market/language lẫn lộn trong route.
## Implementation note 2026-09-09

The initial Prisma schema stores market-scoped content URLs in `ContentItem.canonicalPath` and `SeoMetadata.canonicalPath`. Root-only article routing is not introduced.
## Implementation note 2026-09-09 - Public content route

The app now has a public route at:

```text
app/(public)/[market]/[contentType]/[slug]/page.tsx
```

This route resolves content using the canonical pattern `/{market}/{content-type}/{slug}/` and does not introduce a catch-all or root `/{slug}` article route.

Next.js `trailingSlash` is enabled so the trailing slash canonical pattern remains the served URL instead of redirecting to the no-slash variant.

## Implementation note 2026-09-09 - Canonical guard

Public content metadata and sitemap generation now resolve canonical URLs through a market-scoped guard. If saved SEO metadata contains a canonical path outside the content market prefix, the renderer falls back to `ContentItem.canonicalPath`.

## Implementation note 2026-09-09 - Market activation

Change `openspec/changes/011-multi-market-language/` keeps public content routing on `/{market}/{content-type}/{slug}/` and does not add any root `/{slug}` route.

Public content routes and sitemap entries now require the related market to be `ACTIVE`.

## Implementation note 2026-09-09 - Internal link targets

Internal link suggestions introduced in `openspec/changes/012-internal-link-automation/` point to `ContentItem.canonicalPath`.

The suggestion engine and public renderer require target content to stay in the same market/language scope as the source content, so internal links do not cross locale-specific routes accidentally.

## Implementation note 2026-09-09 - Duplicate and canonical hardening

Change `openspec/changes/018-system-audit-admin-workflow-hardening/` adds a pre-write duplicate check in the Content Manager for `(market, content type, slug)` and `canonicalPath`. Canonical paths continue to be generated from the established `/{market}/{content-type}/{slug}/` helper instead of being entered manually.

## Implementation note 2026-09-13 - URL Redirect Manager

Change `openspec/changes/025-url-redirect-manager/` adds a database-backed URL
registry. Every canonical path is owned by one ContentItem. When a published URL
changes, the old path remains owned by the same item and permanently redirects
to its current canonical path.

The admin URL Routing screen lists canonical and historical paths, supports safe
manual aliases, and can enable or disable aliases. Redirect destinations must be
published in an active market; aliases never expose draft or archived content.
