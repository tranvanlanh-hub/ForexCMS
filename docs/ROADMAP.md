# Roadmap Phát Triển

## Giai đoạn 0 - Nền dự án

Mục tiêu: tạo nền kỹ thuật ổn định để phát triển dài hạn.

Việc cần làm:

- Chọn stack cuối cùng.
- Khởi tạo Next.js + TypeScript.
- Cấu hình lint, format, test.
- Cấu hình database.
- Quyết định database chính là PostgreSQL.
- Tạo storage abstraction cho media theo chuẩn S3-compatible.
- Chuẩn bị cấu hình deploy portable: Cloudflare giai đoạn đầu, VPS Linux giai đoạn sau.
- Tạo cấu trúc thư mục chuẩn.
- Tạo tài liệu handoff cho Codex.
- Tạo file môi trường mẫu.

Kết quả:

- Dự án chạy local được.
- Có trang frontend tối thiểu.
- Có admin shell tối thiểu.
- Có database schema ban đầu.
- Có `.env.example` thể hiện rõ `DATABASE_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.

## Giai đoạn 1 - Core CMS

Mục tiêu: quản lý được nội dung động.

Việc cần làm:

- Tạo model ContentItem, ContentRevision, Category, Topic, Template.
- Tạo admin đăng nhập cơ bản.
- Tạo màn hình danh sách bài viết.
- Tạo màn hình tạo/sửa bài.
- Hỗ trợ trạng thái draft/published/archived.
- Render public page từ database.
- Tạo route động theo URL pattern.

Kết quả:

- Có thể tạo bài trong admin và xem ngoài frontend.
- URL không bị root slug lộn xộn.

## Giai đoạn 2 - Template system

Mục tiêu: mỗi loại nội dung có cấu trúc riêng.

Việc cần làm:

- Tạo Template Manager.
- Tạo các template đầu tiên: Article, Guide, BrokerReview, BestBrokerList, CountryHub.
- Tạo block system: intro, table, CTA, FAQ, pros/cons, rating, quote, key takeaways.
- Validate required fields theo template.

Kết quả:

- Nội dung có cấu trúc nhất quán.
- AI import dễ bám form.

## Giai đoạn 3 - Broker và affiliate

Mục tiêu: quản lý broker và link affiliate tập trung.

Việc cần làm:

- Tạo Broker Manager.
- Tạo BrokerFact.
- Tạo Affiliate Manager.
- Tạo affiliate resolver.
- Tạo CTA component dùng token broker/campaign.
- Gắn `rel="sponsored nofollow"` cho link affiliate.
- Tạo click tracking cơ bản.

Kết quả:

- Đổi affiliate link một chỗ áp dụng toàn site.
- Bài viết không hard-code link affiliate.

## Giai đoạn 4 - SEO/AEO/GEO foundation

Mục tiêu: chuẩn hóa on-page và cấu trúc máy đọc được.

Việc cần làm:

- SEO metadata manager.
- Schema JSON-LD generator.
- Breadcrumb.
- Table of contents.
- FAQ block.
- Summary/key takeaways block.
- Canonical.
- Hreflang.
- Sitemap index và sitemap chia nhỏ.
- Robots.txt.

Kết quả:

- Mỗi page có SEO metadata và schema hợp lệ.
- Website sẵn sàng index ở quy mô lớn.

## Giai đoạn 5 - Multi-market, multi-language

Mục tiêu: triển khai global và từng quốc gia.

Việc cần làm:

- Tạo SiteLocale/Market model.
- Gắn market/language cho content, broker, affiliate link.
- Tạo country hub.
- Tạo hreflang map.
- Tạo rule fallback affiliate link theo market/language.
- Tạo cấu trúc URL theo country.

Kết quả:

- Website phục vụ global và nhiều quốc gia.
- Nội dung địa phương hóa nhưng vẫn quản lý tập trung.

## Giai đoạn 6 - Internal link automation

Mục tiêu: tạo internal link tự động nhưng có kiểm soát.

Việc cần làm:

- Topic cluster model.
- Anchor text dictionary.
- InternalLinkRule.
- Link suggestion engine.
- Auto insert hoặc semi-auto approval.
- Dashboard orphan pages.
- Dashboard pages cần thêm link.

Kết quả:

- Internal link nhất quán.
- Giảm bài mồ côi.
- Tăng sức mạnh topic cluster.

## Giai đoạn 7 - AI content import pipeline

Mục tiêu: đưa nội dung từ AI vào CMS nhanh và có kiểm tra.

Việc cần làm:

- Định nghĩa JSON/Markdown schema cho AI output.
- Tạo Import Manager.
- Validate slug, metadata, heading, affiliate token, broker mention.
- Preview trước khi publish.
- Bulk import.
- Bulk update.

Kết quả:

- Có thể sản xuất hàng trăm đến hàng nghìn bài bằng AI mà vẫn giữ format.

## Giai đoạn 8 - Quality, analytics, scale

Mục tiêu: vận hành website lớn.

Việc cần làm:

- Content health score.
- SEO issue dashboard.
- Broken link checker.
- Affiliate link checker.
- Search/filter admin nâng cao.
- Page performance monitoring.
- Cache strategy.
- Backup database.
- Backup media storage.
- Tài liệu quy trình migrate từ Cloudflare sang VPS Linux.
- Role/permission cho editor/admin.

Kết quả:

- Website đủ khả năng vận hành lâu dài với 4.000+ bài.

## Ưu tiên MVP

MVP nên gồm:

1. Next.js project.
2. Database schema.
3. Admin quản lý bài.
4. Public render bài theo URL pattern.
5. Broker manager.
6. Affiliate link resolver.
7. SEO metadata + sitemap + schema cơ bản.
8. Một template Article và một template BrokerReview.

Không nên làm ngay:

- Editor quá phức tạp như WordPress Gutenberg.
- AI agent tự publish hàng loạt không qua validation.
- Quá nhiều template trước khi có content model ổn định.
- Tracking phức tạp trước khi affiliate resolver ổn.
