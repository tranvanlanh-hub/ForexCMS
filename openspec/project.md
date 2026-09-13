# Project

## Tên dự án

MarketGB

## Mục tiêu

Xây dựng một CMS affiliate forex quy mô lớn, không dùng WordPress, phục vụ global audience tiếng Anh và nhiều thị trường/ngôn ngữ địa phương.

Hệ thống phải quản lý được khoảng 4.000 bài viết hoặc hơn, gồm nội dung giáo dục forex, hướng dẫn mở tài khoản, review broker, so sánh broker, country hub và landing page affiliate.

## Nguồn sự thật

Các tài liệu trong `openspec/` là nguồn sự thật chính khi triển khai tính năng.

Các tài liệu trong `docs/` là planner/handoff hỗ trợ:

- `docs/PROJECT_BRIEF.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/CODEX_HANDOFF.md`

Nếu có xung đột, ưu tiên theo thứ tự:

1. Yêu cầu mới nhất của user.
2. `openspec/changes/*` đang active.
3. `openspec/specs/*/spec.md`.
4. `openspec/product.md`, `openspec/tech.md`, `openspec/structure.md`.
5. `docs/*.md`.

## Nguyên tắc phát triển

- Spec trước, code sau.
- Mỗi phiên code nên làm một change nhỏ, có task rõ.
- Không đổi kiến trúc lớn nếu chưa cập nhật spec và được user đồng ý.
- Sau khi code xong, cập nhật handoff và trạng thái roadmap/spec liên quan.
