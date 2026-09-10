# Spec: Content CMS

## Mục tiêu

Quản lý nội dung động cho website forex affiliate ở quy mô 4.000+ bài.

## Requirements

- CMS phải quản lý được ContentItem với trạng thái `draft`, `published`, `archived`.
- Mỗi content item phải gắn market/language hoặc global scope.
- Mỗi content item phải gắn template.
- Mỗi content item phải có URL path phân tầng, không dùng root slug mặc định.
- CMS phải lưu revision hoặc chuẩn bị model cho revision.
- CMS phải hỗ trợ metadata SEO cơ bản.
- CMS phải hỗ trợ import nội dung AI ở các giai đoạn sau.

## Acceptance criteria

- Admin có thể tạo/sửa/xem danh sách nội dung.
- Public frontend render được nội dung đã publish theo URL pattern.
- Draft không hiển thị public.
- Slug trùng trong cùng market/content-type phải bị chặn.

## Constraints

- Không thiết kế chỉ một bảng `posts` đơn giản làm toàn bộ hệ thống.
- Không để content tự nhúng affiliate link trực tiếp.
## Implementation note 2026-09-09

Initial Prisma models have been added for `Market`, `ContentItem`, `ContentRevision`, `Category`, `Topic`, `Template`, `SeoMetadata`, `Broker`, and `AffiliateLink`.

`ContentItem` is scoped by market and content type, with a unique `(marketId, contentType, slug)` constraint and a unique `canonicalPath` to prevent duplicate public URLs.
## Implementation note 2026-09-09 - Public renderer

Published `ContentItem` records now render on the public frontend through the dynamic route `/{market}/{content-type}/{slug}/`.

The resolver requires `ContentStatus.PUBLISHED`; draft, review, and archived content do not render publicly.

Minimal local/demo seed data is available through `npm.cmd run db:seed` after PostgreSQL is connected and migrations are applied.

## Implementation note 2026-09-09 - FAQ schema extraction

The public renderer can infer FAQPage schema from markdown content when an FAQ section exists. This is a foundation behavior only; richer FAQ blocks should be added through the template/block system in a later change.

## Implementation note 2026-09-09 - Translation grouping

Change `openspec/changes/011-multi-market-language/` adds `ContentTranslationGroup` and optional `ContentItem.translationGroupId`.

Content items remain scoped by market, content type, and slug. Translation groups only connect related localized versions so hreflang can be built without changing canonical URL ownership.

## Implementation note 2026-09-09 - Internal link suggestions

Change `openspec/changes/012-internal-link-automation/` adds internal link suggestions that reference source and target `ContentItem` records.

Suggestions are generated only for same-market, same-language published content. Accepted suggestions can be rendered publicly without mutating the stored content body.

## Implementation note 2026-09-09 - Analytics quality dashboard

Change `openspec/changes/015-analytics-click-quality-dashboard/` adds `/admin/analytics` as the first content quality dashboard. It reports missing SEO metadata, missing affiliate CTA resolutions for published broker content, inactive or empty affiliate links, and orphan published content based on accepted incoming internal link suggestions.

## Implementation note 2026-09-09 - Workflow and admin operations hardening

Change `openspec/changes/018-system-audit-admin-workflow-hardening/` hardens the editorial workflow and content list operations.

`ContentStatus.REVIEW` is now available in the admin form and list alongside draft, published, and archived. Publishing remains guarded by validation, while AI import continues to save drafts only.

The Content Manager now exposes author and reviewer metadata, preserves `publishedAt` when editing already-published content, and provides search, market/status/template/content-type filters, pagination, and safe bulk moves to draft, review, or archived. Bulk publish remains disabled so each publish transition uses the full single-content validation path.

Publish validation now checks duplicate slug/canonical path before writing, validates active market/template, validates inline affiliate tokens, and blocks CTA templates from publishing unless attached brokers have active matching affiliate links.

## Implementation note 2026-09-10 - Public cache and lookup indexes

Change `openspec/changes/020-production-readiness-scale/` adds targeted indexes for published content lookup and sitemap ordering:

- `idx_content_public_lookup` on `ContentItem(marketId, contentType, status, slug)`
- `idx_content_sitemap_market` on `ContentItem(marketId, status, publishedAt, createdAt)`
- `idx_content_sitemap_status` on `ContentItem(status, publishedAt, createdAt)`

Public content lookups now use a tag-based cache for published/active data. Content mutations revalidate the public content and sitemap cache tags. Admin content routes remain dynamic/private and are not public-cached.
