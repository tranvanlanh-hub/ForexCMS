# Design: Init Project Foundation

## App structure

Dự án sẽ dùng Next.js App Router với hai vùng chính:

- Public site: route cho người đọc.
- Admin site: route `/admin` cho CMS.

## Initial pages

Public:

- Trang chủ tạm thời giới thiệu Forex Affiliate CMS.

Admin:

- `/admin` shell tối thiểu với navigation placeholder cho Content, Brokers, Affiliate, SEO, Templates.

## Environment

Tạo `.env.example` gồm:

```text
DATABASE_URL=
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=
APP_URL=
```

## Storage design

Chưa cần upload media ở change này, nhưng cấu trúc thư mục phải dành chỗ cho `lib/storage`.

## Database design

Chưa bắt buộc tạo migration ở change này nếu ORM chưa chọn. Nếu chọn ORM trong cùng change, phải ghi lại quyết định vào `openspec/tech.md` và `docs/CODEX_HANDOFF.md`.
