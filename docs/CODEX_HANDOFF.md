# Codex Handoff

## Đọc file này trước khi làm tiếp

Dự án này là một Forex Affiliate CMS quy mô lớn, không dùng WordPress, hướng tới khoảng 4.000 bài viết hoặc hơn.

Trước khi code, đọc các file:

1. `docs/PROJECT_BRIEF.md`
2. `docs/ARCHITECTURE.md`
3. `docs/ROADMAP.md`

## Nguyên tắc không được phá

- Không đặt toàn bộ bài viết ở root domain dạng `/{slug}`.
- Không hard-code affiliate link trong nội dung.
- Không tạo cấu trúc CMS chỉ có một bảng post đơn giản.
- Không bỏ qua SEO metadata, schema, canonical, hreflang trong thiết kế.
- Không tạo template tùy tiện ngoài hệ thống Template Manager.
- Không thay đổi roadmap lớn mà không cập nhật tài liệu.

## Kiến trúc ưu tiên

- Next.js App Router.
- TypeScript.
- PostgreSQL.
- Prisma hoặc Drizzle.
- Admin CMS custom trong cùng repo.
- Public frontend render từ database.
- Deploy ban đầu có thể dùng Cloudflare, nhưng code phải portable sang VPS Linux.
- Media dùng S3-compatible adapter, ban đầu có thể là Cloudflare R2, sau này có thể là MinIO/S3-compatible storage khác.
- Không dùng Cloudflare D1 làm database chính cho core CMS nếu mục tiêu là dễ chuyển sang VPS Linux.

## Các module phải có

- Content Manager.
- Template Manager.
- URL Manager.
- Broker Manager.
- Affiliate Manager.
- SEO Manager.
- Internal Link Manager.
- AI Import Manager.

## URL pattern ưu tiên

```text
/{market}/{content-type}/{slug}/
/{market}/brokers/{broker-slug}/
/{market}/compare/{broker-a}-vs-{broker-b}/
```

Ví dụ:

```text
/global/forex-brokers/best-forex-brokers/
/us/forex-brokers/best-forex-brokers-in-usa/
/vn/san-forex/san-forex-uy-tin/
```

## Affiliate link

Affiliate link phải quản lý tập trung qua Broker/Affiliate Manager.

Bài viết hoặc template chỉ được gọi broker/campaign token, ví dụ:

```text
broker="exness", market="vn", campaign="review_top_cta"
```

Resolver sẽ lấy link cuối cùng từ database.

## Trạng thái hiện tại

Tại thời điểm tạo tài liệu này, workspace đang trống và chưa có code app.

Việc tiếp theo hợp lý nhất:

1. Khởi tạo Next.js + TypeScript.
2. Cài Tailwind CSS.
3. Chọn ORM.
4. Tạo database schema ban đầu.
5. Tạo frontend shell và admin shell.
6. Tạo `.env.example` có cấu hình PostgreSQL và S3-compatible storage.
