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
