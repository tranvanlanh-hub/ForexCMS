# Tech

## Stack đã thống nhất

- Framework: Next.js App Router.
- Language: TypeScript.
- Database: PostgreSQL.
- ORM: Prisma hoặc Drizzle, chọn một khi khởi tạo.
- Styling: Tailwind CSS.
- CMS: custom admin trong cùng codebase.
- Media storage: S3-compatible adapter.
- Initial infrastructure: GitHub + Cloudflare có thể dùng để deploy/CDN/R2.
- Future infrastructure: VPS Linux với Node.js, PostgreSQL, Nginx, Docker hoặc PM2.

## Quyết định bắt buộc

- Không dùng WordPress.
- Không dùng Cloudflare D1 làm database chính cho core CMS.
- Không gọi trực tiếp Cloudflare R2 rải rác trong code; phải đi qua storage adapter.
- Không hard-code affiliate URL trong content.
- Không đặt toàn bộ bài viết ở root URL dạng `/{slug}`.

## Portability requirements

Hệ thống phải chuyển được từ Cloudflare sang VPS Linux bằng cách đổi cấu hình triển khai và biến môi trường.

Các biến môi trường dự kiến:

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

## Verification baseline

Mỗi change có code phải cố gắng chạy:

- Type check.
- Lint nếu đã cấu hình.
- Build nếu app đã có build script.
- Test nếu module có test.
## ORM decision 2026-09-09

- ORM chinh thuc cho core CMS: Prisma 6.x.
- Database chinh: PostgreSQL qua `DATABASE_URL`.
- Khong dung Cloudflare D1 cho core CMS.
- Ly do chon Prisma: schema quan he de doc, migration ro rang, TypeScript client huu ich cho admin CMS va public renderer trong cac phien sau, van portable sang VPS Linux.
