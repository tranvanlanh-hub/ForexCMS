# Forex Affiliate CMS - Project Brief

## Mục tiêu

Xây dựng một website affiliate mảng forex quy mô lớn, có thể vận hành khoảng 4.000 bài viết hoặc hơn, cấu trúc giống một CMS chuyên nghiệp tương tự WordPress nhưng không dùng WordPress.

Website cần có frontend public cho người đọc và backend CMS để quản lý nội dung, template, cấu trúc URL, broker, affiliate link, internal link và dữ liệu SEO.

## Đối tượng độc giả

1. Global audience bằng tiếng Anh:
   - Nội dung chung về forex.
   - Review sàn forex.
   - Hướng dẫn giao dịch.
   - Giáo dục, thuật ngữ, chiến lược, quản trị rủi ro.
   - Bài so sánh broker và hướng dẫn mở tài khoản.

2. Audience theo từng quốc gia:
   - Nội dung theo ngôn ngữ địa phương.
   - Chủ đề forex và broker phù hợp riêng với quốc gia đó.
   - Có thể có luật, phương thức thanh toán, loại tài khoản, spread, bonus, giấy phép, hỗ trợ khách hàng, và hành vi tìm kiếm riêng theo quốc gia.

## Mục tiêu kinh doanh

- Thu hút organic traffic từ Google và các AI answer engine.
- Điều hướng người đọc tới các trang có khả năng chuyển đổi cao.
- Tập trung click affiliate qua các broker được quản lý tập trung.
- Khi thay đổi link affiliate của một broker, toàn bộ website tự cập nhật.
- Có khả năng mở rộng nội dung bằng AI/vibe coding mà vẫn giữ cấu trúc, chất lượng và kiểm soát SEO.

## Yêu cầu chính

### Frontend

- Header, main content, footer.
- Layout tĩnh dùng chung cho toàn site.
- Nội dung động lấy từ CMS/database.
- Hỗ trợ nhiều loại page template.
- Hỗ trợ đa quốc gia, đa ngôn ngữ.
- Tốc độ tải nhanh, thân thiện SEO.
- Schema markup đầy đủ theo loại nội dung.

### Backend CMS

- Quản lý bài viết, page, category, topic cluster.
- Quản lý template giao diện.
- Quản lý URL pattern.
- Quản lý broker.
- Quản lý affiliate link tập trung.
- Quản lý internal link tự động.
- Quản lý SEO metadata, schema, canonical, hreflang.
- Quản lý content workflow: draft, review, published, archived.
- Có thể import nội dung AI bằng HTML/Markdown/JSON.

### SEO - AEO - GEO

- SEO: cấu trúc URL rõ ràng, on-page tốt, internal link, metadata, schema, sitemap, robots, canonical, hreflang.
- AEO: nội dung dạng câu hỏi-trả lời, đoạn trả lời ngắn, FAQ, định nghĩa, bảng so sánh, summary box.
- GEO: tối ưu để AI search/LLM dễ hiểu, có entity rõ ràng, citation/source fields, structured facts, author/reviewer, ngày cập nhật.

## Nguyên tắc quan trọng

- Không dùng URL dạng `domain.com/slug-url` cho toàn bộ nội dung.
- Phải có cấu trúc URL phân tầng rõ ràng.
- Không hard-code affiliate link trong bài viết.
- Không để mỗi bài tự tạo cấu trúc riêng gây khó quản trị.
- Kiến trúc phải portable, có thể chạy ban đầu trên Cloudflare và chuyển sang VPS Linux riêng trong tương lai.
- Database chính ưu tiên PostgreSQL, tránh phụ thuộc cứng vào Cloudflare D1 cho core CMS.
- Media/image storage phải đi qua adapter S3-compatible để có thể dùng Cloudflare R2 ban đầu và chuyển sang MinIO/S3-compatible storage khác sau này.
- Mọi quyết định kiến trúc lớn phải được ghi lại trong `docs/`.
- Codex phiên sau phải đọc `docs/CODEX_HANDOFF.md` trước khi tiếp tục.
