# Roadmap Phát Triển

## Giai đoạn 0 - Nền dự án

Trạng thái 2026-09-09: Hoàn tất nền app theo `openspec/changes/001-init-project/`.

Mục tiêu: tạo nền kỹ thuật ổn định để phát triển dài hạn.

OpenSpec change tương ứng:

```text
openspec/changes/001-init-project/
```

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
- Chưa tạo database schema ban đầu trong Giai đoạn 0; ORM sẽ được chọn trong change tiếp theo.
- Có `.env.example` thể hiện rõ `DATABASE_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.

Kiểm tra đã chạy:

- `npm.cmd run lint`
- `npm.cmd run build`

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

Trạng thái 2026-09-09: Đã có nền SEO/AEO/GEO cơ bản theo `openspec/changes/007-seo-aeo-geo-foundation/`.

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

Kết quả ban đầu:

- Public content page dùng helper SEO chung cho title, description, canonical, robots, và language alternates.
- Canonical được guard theo market path; nếu SEO metadata sai scope thì fallback về `ContentItem.canonicalPath`.
- Public page render Article JSON-LD, BreadcrumbList JSON-LD, và FAQPage JSON-LD khi markdown có section FAQ.
- `/sitemap.xml` là sitemap index.
- `/sitemaps/content-N.xml` là sitemap content chia theo chunk 4.000 URL.
- `/robots.txt` đã có rule public cơ bản và disallow `/admin/`.

Còn lại của Giai đoạn 4:

- SEO Manager UI chuyên sâu.
- Hreflang map giữa các bản dịch/liên thị trường.
- Table of contents, summary/key takeaways block, và FAQ block chính thức trong template system.
- Schema riêng cho BrokerReview, BestBrokerList, HowTo, ItemList, Organization, Person.

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

## Cap nhat 2026-09-09 - Initial database schema

Giai doan 1 da co nen schema dau tien theo:

```text
openspec/changes/002-initial-database-schema/
```

Da hoan thanh:

- Chon Prisma 6.x cho ORM.
- Tao schema va migration PostgreSQL ban dau cho core CMS.
- Tao model `Market`, `ContentItem`, `ContentRevision`, `Category`, `Topic`, `Template`, `SeoMetadata`, `Broker`, `AffiliateLink`.
- Giu affiliate link quan ly tap trung qua `AffiliateLink`; content/template chi nen dung broker/market/campaign token.

Con lai cua Giai doan 1:

- Seed data toi thieu.
- Admin CRUD cho Content Manager.
- Public render tu database theo URL phan tang.

## Cap nhat 2026-09-09 - Admin layout and navigation foundation

Change da hoan thanh:

```text
openspec/changes/003-admin-layout-navigation/
```

Ket qua:

- `/admin` da co layout rieng cho backend CMS.
- Navigation admin da co day du muc nen: Dashboard, Content, Templates, Brokers, Affiliate Links, SEO, URL Routing, AI Import, Settings.
- Cac route module da co placeholder ro pham vi nhung chua them CRUD.
- Public frontend khong bi thay doi trong phien nay.

Kiem tra da chay:

- `npm.cmd run lint`
- `npm.cmd run build`

Con lai cua Giai doan 1:

- Seed data toi thieu cho `Market` va template dau tien.
- Admin CRUD cho Content Manager.
- Public render tu database theo URL phan tang.

## Cap nhat 2026-09-09 - Basic admin Content Manager

Change da hoan thanh:

```text
openspec/changes/004-admin-content-manager/
```

Ket qua:

- `/admin/content` da co danh sach content doc tu database, gom title, market/language, content type, template, status, SEO readiness, canonical path, va ngay cap nhat.
- `/admin/content/new` da co form tao content co ban.
- `/admin/content/[id]/edit` da co form sua content co ban.
- Form ho tro title, slug, market/language, content type, template, status draft/published/archived, body markdown, SEO title, va meta description.
- Server action tao/sua ghi `ContentItem`, `SeoMetadata`, va `ContentRevision`.
- Published content bi chan neu thieu field quan trong.
- Canonical path duoc sinh theo `/{market}/{content-type}/{slug}/`, khong tao URL root dang `/{slug}`.
- Body markdown tam thoi chan raw `http://`/`https://` link de tranh hard-code affiliate link truoc khi co Affiliate Manager token resolver.
- Admin Content Manager co fallback thong bao khi PostgreSQL/migration chua san sang.

Kiem tra da chay:

- `npm.cmd run lint`
- `npm.cmd run build`

Con lai cua Giai doan 1:

- Seed data toi thieu cho `Market` va template dau tien.
- Public render tu database theo URL phan tang.
- Loc/tim kiem/pagination cho danh sach content khi du lieu lon hon.

## Cap nhat 2026-09-09 - Public content renderer

Change da hoan thanh:

```text
openspec/changes/005-public-content-routing/
```

Ket qua:

- Them public route dong `/{market}/{content-type}/{slug}/`.
- Published content duoc render tu database voi header, breadcrumb, main content, footer, canonical metadata, va mot H1 duy nhat.
- Draft, review, va archived content khong render public vi resolver chi lay `ContentStatus.PUBLISHED`.
- Khong tao route root `/{slug}` cho bai viet.
- Bat `trailingSlash: true` trong Next config de giu URL canonical co dau `/` cuoi.
- Them seed demo Prisma tai `prisma/seed.mjs` va script `npm.cmd run db:seed`.
- Seed demo tao market `global`, template `Article`/`BrokerReview`, mot published article tai `/global/articles/forex-trading-basics/`, va mot draft de kiem tra chan public.

Kiem tra da chay:

- `npm.cmd run lint`
- `npm.cmd run build`

Con lai cua Giai doan 1:

- Ket noi PostgreSQL local/thuc te va chay migration + seed neu can test end-to-end voi data that.
- Loc/tim kiem/pagination cho danh sach content khi du lieu lon hon.

## Cap nhat 2026-09-09 - Basic Broker and Affiliate Manager

Change da hoan thanh:

```text
openspec/changes/006-basic-broker-affiliate-manager/
```

Ket qua:

- `/admin/brokers` da co danh sach broker doc tu database.
- `/admin/brokers/new` va `/admin/brokers/[id]/edit` da co form tao/sua broker co ban.
- Broker ho tro name, slug, status, logo/media URL, va short description.
- `/admin/affiliate-links` da co danh sach affiliate link doc tu database.
- `/admin/affiliate-links/new` va `/admin/affiliate-links/[id]/edit` da co form tao/sua affiliate link co ban.
- AffiliateLink ho tro broker, market, language, campaign, destinationUrl, status, priority, sponsored, va nofollow.
- `lib/affiliate` da co resolver tap trung theo broker + market + language + campaign.
- Public CTA component chi nhan broker/market/language/campaign token va render link voi `rel="sponsored nofollow"`.
- Public content renderer co the hien CTA cho broker duoc gan voi content ma khong hard-code URL trong body bai viet.
- Seed demo tao broker `exness`, link campaign `review_top_cta`, va gan broker vao bai demo.

Kiem tra da chay:

- `npm.cmd run db:generate`
- `npm.cmd run lint`
- `npm.cmd run build`

Con lai cua Giai doan 3:

- BrokerFact va du lieu broker co cau truc.
- Gan broker vao Content Manager bang UI rieng.
- Fallback rule nang cao theo market/language.
- Click tracking va dashboard analytics sau khi resolver on dinh.

## Cap nhat 2026-09-09 - Cloudflare preview deploy prep

Change rieng cho phien nay:

```text
openspec/changes/008-cloudflare-preview-deploy-prep/
```

Ket qua:

- Them tai lieu trien khai preview tai `DEPLOYMENT.md`.
- Cap nhat `docs/CLOUDFLARE_DEPLOY.md` theo luong preview, khong production deploy.
- Them `preview:check` de build Vinext va chay Vinext Cloudflare dry-run cho moi truong `preview`.
- Them `deploy:preview` cho preview deploy rieng khi user xac nhan.
- Them `env.preview` trong `wrangler.jsonc` voi Worker rieng `content-hub-cms-preview`.
- Xac nhan `wrangler.jsonc` va output hien khong co D1 binding.
- Xac nhan Prisma van dung PostgreSQL qua `DATABASE_URL`.
- Xac nhan storage van o muc S3-compatible config qua `lib/storage`.

Viec can lam truoc preview deploy that:

- Cung cap Cloudflare API token/account id.
- Set Cloudflare secrets cho `DATABASE_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
- Set non-secret runtime vars cho `APP_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_PUBLIC_BASE_URL`.
- Dung PostgreSQL connection path tuong thich Workers, vi du Prisma Accelerate hoac pool/proxy phu hop.
- Chi deploy preview sau khi user xac nhan; khong production deploy khi chua duoc xac nhan.
