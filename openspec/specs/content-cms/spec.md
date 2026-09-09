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
