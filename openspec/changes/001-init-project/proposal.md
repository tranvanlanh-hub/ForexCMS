# Change 001: Init Project Foundation

## Mục tiêu

Khởi tạo nền kỹ thuật đầu tiên cho Forex Affiliate CMS theo kiến trúc đã thống nhất.

## Scope

- Khởi tạo Next.js App Router.
- Dùng TypeScript.
- Cài Tailwind CSS.
- Tạo public frontend shell.
- Tạo admin shell tối thiểu.
- Tạo cấu trúc thư mục theo `openspec/structure.md`.
- Tạo `.env.example` cho PostgreSQL và S3-compatible storage.
- Chưa cần kết nối database thật nếu chưa quyết định ORM.

## Không làm trong change này

- Không xây full CMS.
- Không tạo editor phức tạp.
- Không tạo affiliate manager đầy đủ.
- Không tạo AI import pipeline.
- Không deploy production.

## Lý do

Dự án cần nền app chạy được trước, sau đó mới phát triển từng capability theo spec riêng để tránh vòng vo và lỗi dây chuyền.
