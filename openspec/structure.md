# Structure

## Cấu trúc thư mục mục tiêu

```text
app/
  (public)/
  admin/
components/
lib/
  db/
  seo/
  affiliate/
  storage/
  routing/
  content/
prisma/ hoặc drizzle/
public/
docs/
openspec/
```

## Quy tắc tổ chức code

- `app/(public)` chứa route public cho người đọc.
- `app/admin` chứa backend admin UI.
- `lib/db` chứa database client và repository/helper liên quan.
- `lib/seo` chứa schema, metadata, sitemap, canonical, hreflang.
- `lib/affiliate` chứa affiliate resolver và tracking helper.
- `lib/storage` chứa adapter S3-compatible.
- `lib/routing` chứa URL pattern và resolver.
- `lib/content` chứa content rendering, block validation và template mapping.

## Quy tắc tài liệu

- `docs/` dùng cho planner, roadmap, handoff.
- `openspec/specs/` dùng cho spec lâu dài của từng capability.
- `openspec/changes/` dùng cho từng thay đổi cụ thể trước khi code.
- Sau khi hoàn thành một change lớn, cập nhật spec liên quan và `docs/CODEX_HANDOFF.md`.
## Database structure decision 2026-09-09

- ORM folder: `prisma/`.
- Initial schema: `prisma/schema.prisma`.
- Initial PostgreSQL migration: `prisma/migrations/202609090001_initial_cms_schema/migration.sql`.
- Shared database entrypoint: `lib/db/index.ts`.
