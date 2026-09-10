# Roadmap Phát Triển

## FINAL LAUNCH READINESS CHECK — roadmap đã dừng, 2026-09-10

Theo yêu cầu owner, **đóng roadmap nhiều phiên ở đây**. Không tiếp tục phiên 41/42/43, không tạo kế hoạch 20–30 phiên. Mọi giai đoạn/checkpoint và “việc tiếp theo” bên dưới chỉ là lịch sử, không phải backlog được phép tự triển khai.

**Kết luận: chưa launch production nhỏ nguyên trạng.** Build/lint/typecheck, Neon migration/pilot/SEO và phần lớn smoke preview đạt. Còn blocker cụ thể: Worker vượt CPU tại /admin/brokers/; dữ liệu broker/affiliate demo chưa dùng được cho độc giả; cấu hình và credentials production, chính sách index preview, điểm khôi phục dữ liệu chưa xác minh hoàn tất.

Chỉ xử lý các điều kiện launch trong [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md). Không thêm feature/refactor/nâng cấp nhỏ để kéo dài dự án. Không bắt buộc 20/50/4.000 bài, R2 nếu chưa upload, VPS, role system hay kiểm thử tải quy mô lớn để launch nhỏ. Production deploy vẫn cần owner chỉ định target và xác nhận rõ; kiểm tra này không deploy.

## Lịch sử roadmap — đã đóng

## Cập nhật checkpoint 36–40 — 2026-09-10

**Preview kỹ thuật đã xác minh; production chưa sẵn sàng.** Mục này là trạng thái hiện hành; các kết quả cũ phía dưới là lịch sử.

- [x] 36 — Audit repo, giữ thay đổi cũ, ignore artifact, inventory và nhóm commit.
- [x] 37 — Xác minh Neon và 7 migration/checksum; 5 lệnh audit/generate pass sau sửa env và internal link pilot; không reseed.
- [x] 38 — Smoke preview thật toàn bộ pilot, admin auth/private cache, sitemap/canonical, comparison, draft 404 và CTA redirect; xác nhận 16 link render sau cache refresh.
- [x] 39 — Chuẩn bị checklist production, không thực hiện production launch.
- [x] 40 — Kế hoạch 50/100/250 bài theo batch tối đa 50, review và publish thủ công; chưa tạo/publish bộ bài thật.
- [ ] Launch production: owner hoàn tất password/domain/runtime secrets, full Neon backup+restore, nội dung thật, preview indexing policy và xác nhận deploy.

Bằng chứng: [change 021](../openspec/changes/021-post-deploy-launch-checkpoints/verification.md), [launch checklist](PRODUCTION_LAUNCH_CHECKLIST.md), [content plan](POST_LAUNCH_CONTENT_PLAN.md).

Lưu ý: Worker gốc cũ trên Cloudflare còn binding D1; preview Neon không có D1. Phải chốt và cấu hình production target đúng trước deploy, không tái dùng cấu hình cũ. 16 bài pilot không phải nội dung production đã duyệt. Không commit/push/deploy trong phiên này; các mục migration localhost thất bại ở lịch sử đã được kiểm tra lại trên Neon thành công.

## Trạng thái triển khai thực tế - 2026-09-10

Dự án đã có bản Cloudflare preview chạy public với Neon/PostgreSQL:

```text
https://content-hub-cms-preview.content-hub-stack.workers.dev
```

Trạng thái hiện tại:

- Mức độ: MVP đã chạy được trên preview, tiến sát production nhỏ.
- Database public ban đầu: Neon PostgreSQL.
- Cloudflare D1 không được dùng làm core database.
- VPS Linux là phương án dự phòng để migration nếu nền tảng/cloud bị hạn chế, không phải việc cần làm ngay.
- 4.000 bài là mục tiêu scale dài hạn trong 3-4 năm, không phải điều kiện để public.
- Chiến lược đúng là public sớm với số bài pilot hợp lý, đo SEO/doanh thu, rồi mở rộng nội dung theo lộ trình.

Việc còn lại trước production nhỏ:

- Đổi mật khẩu admin tạm sang mật khẩu mạnh.
- Gắn domain thật và cập nhật `APP_URL` production.
- Deploy production chỉ khi user xác nhận rõ.
- Kiểm tra lại các route public, admin content, sitemap, affiliate resolver sau khi gắn domain.
- Chốt media storage/R2 nếu cần upload ảnh thật ngay giai đoạn đầu.
- Tạo backup đầu tiên cho Neon và ghi lại cách restore.

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

## Cap nhat 2026-09-09 - Security and deployment verification

Change da hoan thanh:

```text
openspec/changes/009-security-deployment-verification/
```

Ket qua:

- `/admin` da duoc bao ve bang HTTP Basic Authentication toi thieu trong `proxy.ts`.
- Neu deploy thieu `ADMIN_USERNAME` hoac `ADMIN_PASSWORD`, admin CMS bi khoa bang response `503` thay vi public.
- Neu request vao `/admin` khong co Basic Auth hop le, response la `401`.
- Public routes `/`, `/sitemap.xml`, `/robots.txt`, va content route dong khong bi middleware admin chan.
- Prisma schema da can chinh ve PostgreSQL qua `DATABASE_URL`.
- D1 adapter, D1 binding, D1 type binding, va artifact `prisma/d1` da duoc go/xoa khoi active app config.
- Cloudflare generated config sau dry-run co `d1_databases: []`.
- `.env.example`, `.env.cloudflare.example`, `DEPLOYMENT.md`, va `docs/CLOUDFLARE_DEPLOY.md` da cap nhat admin auth vars va secret checklist.
- Seed demo chi tao affiliate destination khi co `DEMO_AFFILIATE_DESTINATION_URL`, tiep tuc giu affiliate link o bang `AffiliateLink` tap trung.

Kiem tra da chay:

- `npx.cmd prisma validate`
- `npm.cmd run db:generate`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run preview:check`
- Local smoke test route chinh.

Trang thai deploy quan sat:

- Worker goc `content-hub-cms` co deployment tren Cloudflare, latest observed deployment `2026-09-09T14:29:59.809Z` serving version `61921371-c388-4d55-9282-4958bcb298aa` at 100%.
- Worker preview `content-hub-cms-preview` chua ton tai trong account hien tai.
- Secret list cua Worker goc dang rong, can set `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, va S3 secrets truoc khi dung CMS backend/data routes tren remote.

## Cap nhat 2026-09-09 - Template block renderer foundation

Change da hoan thanh:

```text
openspec/changes/010-template-block-renderer/
```

Ket qua:

- Article va BrokerReview templates da duoc nang cap voi allowed/required blocks, schema types, CTA slots, va internal link slots.
- Them block system co ban tren nen markdown cho intro, summary/key takeaways, table of contents, FAQ, pros/cons, body, va CTA slot.
- Content moi luu `ContentItem.body` dang markdown kem `blocks`; content cu van duoc derive blocks khi render.
- Public content page render qua `TemplateBlockRenderer` theo selected template.
- CTA block van di qua affiliate resolver tap trung, khong hard-code affiliate URL trong body.
- FAQPage JSON-LD doc FAQ tu block.
- Article JSON-LD them `articleSection` tu TOC headings va key takeaways neu co.
- Published content duoc validate required template blocks truoc khi save.

Con lai cua Giai doan 2:

- Template Manager UI day du.
- Gan broker vao content tu admin UI.
- Nhieu template nang cao hon nhu Guide, BestBrokerList, CountryHub.
- Rating/broker fact blocks rieng cho review sau khi BrokerFact on dinh.

## Cap nhat 2026-09-09 - Multi-market and multi-language foundation

Change da hoan thanh:

```text
openspec/changes/011-multi-market-language/
```

Ket qua:

- Giai doan 5 da co nen dau tien cho multi-market/multi-language.
- `Market` tiep tuc la model chinh cho market + locale; chua can tach `SiteLocale`.
- Ho tro danh sach market chuan: `global`, `us`, `uk`, `au`, `vn`, `th`.
- Seed du market voi `code`, `name`, `languageCode`, `locale`, optional `countryCode`, `isGlobal`, va `status`.
- Them `ContentTranslationGroup` de gom cac ban cung chu de/bien dich.
- Content Manager co the gan `translationGroupKey`.
- Public metadata sinh hreflang tu published siblings trong cung group va guard canonical theo dung market.
- Public route va sitemap chi dung market `ACTIVE`.
- Them Market Manager co ban trong admin tai `/admin/markets`.
- Khong tao route root `/{slug}`.

Kiem tra da chay:

- `npx.cmd prisma validate`
- `npm.cmd run db:generate`
- `npm.cmd run lint`
- `npm.cmd run build`

Con lai cua Giai doan 5:

- UI rieng de xem/sua translation groups va phat hien market/locale con thieu.
- Country hub template va routing noi dung theo tung market.
- Fallback affiliate rule nang cao theo market/language.
- SEO Manager UI chuyen sau cho hreflang map, canonical audit, va missing alternate checks.

## Cap nhat 2026-09-09 - Basic Internal Link Automation

Change da hoan thanh:

```text
openspec/changes/012-internal-link-automation/
```

Ket qua:

- Giai doan 6 da co nen internal link automation dau tien.
- Them model `TopicCluster`, `AnchorText`, `InternalLinkRule`, va `InternalLinkSuggestion`.
- `Topic` co the gan vao topic cluster.
- Admin co man hinh `/admin/internal-links` de xem/generate/duyet suggestion co ban.
- Suggestion engine chi noi cac bai published cung market va cung language.
- Public renderer chi hien link da accepted hoac rule active auto-approve ro rang.
- Internal link duoc chen luc render, khong sua markdown body.
- Link density duoc cap va co spacing toi thieu.

Kiem tra da chay:

- `npx.cmd prisma validate`
- `npm.cmd run db:generate`
- `npm.cmd run lint`
- `npm.cmd run build`

Con lai cua Giai doan 6:

- Form tao/sua topic cluster, anchor text, va internal link rule.
- Bulk generate suggestion cho nhieu bai.
- Dashboard orphan pages.
- Dashboard pages can them link.
- Bao cao link density va broken internal link.

## Cap nhat 2026-09-09 - Basic AI Content Import Pipeline

Change da hoan thanh:

```text
openspec/changes/013-basic-ai-content-import-pipeline/
```

Ket qua:

- Giai doan 7 da co MVP cho AI content import.
- `/admin/ai-import` da co form paste JSON hoac Markdown frontmatter.
- Validator kiem tra required fields, active market/template, language khop market, duplicate slug/canonical, SEO metadata, broker mention, affiliate token, va hard-coded URL trong body.
- Import chi luu draft, khong publish thang.
- Preview hien canonical path, metadata, broker/token checks, warning, va body truoc khi save.

Con lai cua Giai doan 7:

- Bulk import.
- Bulk update.
- Upload file `.md`/`.json`.
- Import history/log va bang review nhieu item.
- Mapping nang cao tu AI schema sang template blocks.

## Cap nhat 2026-09-09 - Broker data, review, and comparison foundation

Change da hoan thanh:

```text
openspec/changes/014-broker-data-review-comparison/
```

Ket qua:

- Giai doan 3 da co model `BrokerFact` rieng thay vi chi dua vao JSON `Broker.facts`.
- Broker facts duoc phan loai theo regulation/license, minimum deposit, spread, leverage, platforms, account types, deposit/withdrawal methods, support languages, restricted countries, va other.
- Moi fact can co source name va source URL, giup tranh public financial/legal claim khong co citation.
- Broker Manager ho tro nhap/sua facts co nguon trong form broker.
- BrokerReview template render bang facts co citation khi content co broker gan kem.
- SEO helper co Review JSON-LD cho BrokerReview, chua co rating cho den khi co rating model.
- Them route comparison nen `/{market}/compare/{broker-a}-vs-{broker-b}/` voi bang so sanh fact co source va ItemList JSON-LD.
- Seed them `broker-comparison` template va broker demo hu cau de kiem tra route comparison.

Kiem tra da chay:

- `npx.cmd prisma validate`
- `npm.cmd run db:generate`
- `npm.cmd run lint`
- `npm.cmd run build`

Con lai cua Giai doan 3:

- UI BrokerFact chuyen dung thay cho textarea MVP.
- Gan broker vao Content Manager bang UI rieng.
- Broker profile route `/{market}/brokers/{broker-slug}/`.
- Rating/scoring model neu muon hien Review `reviewRating`.
- Click tracking va dashboard analytics sau khi resolver on dinh.

## Cap nhat 2026-09-09 - Analytics, click tracking, and quality dashboard

Change da hoan thanh:

```text
openspec/changes/015-analytics-click-quality-dashboard/
```

Ket qua:

- Giai doan 3 da co click tracking co ban cho affiliate CTA.
- Giai doan 8 da co nen analytics va quality dashboard dau tien.
- Them `AffiliateClickEvent` de luu click context toi thieu: affiliate link, optional broker/content, market, campaign, referrer da sanitize, va timestamp.
- Public CTA redirect qua `/affiliate/click/{affiliateLinkId}` truoc khi den destination URL tap trung trong `AffiliateLink`.
- Click tracking MVP khong luu IP, user agent, cookies, visitor/session id, fingerprint, hay du lieu nhay cam khong can thiet.
- `/admin/analytics` hien total affiliate clicks, top brokers, top content, missing SEO metadata, affiliate link issues, missing CTA resolution, va orphan published content.

Kiem tra da chay:

- `npx.cmd prisma validate`
- `npm.cmd run db:generate`
- `npm.cmd run lint`
- `npm.cmd run build`

Con lai cua Giai doan 8:

- Date range filter va campaign/market filter.
- Cached analytics rollup khi click volume lon.
- External broken link crawler cho affiliate destination.
- Content health score tong hop.
- Export/reporting va performance monitoring.

## Cap nhat 2026-09-09 - Small content production pilot

Change da tao:

```text
openspec/changes/016-small-content-production-pilot/
```

Ket qua:

- Da them bo seed pilot san xuat noi dung nho trong `prisma/seed.mjs`.
- Seed gom 17 content items, trong do 16 published va 1 draft.
- Noi dung published phu 2 market `global` va `vn`.
- Da co du nhom noi dung can test truoc khi scale: article giao duc forex, guide mo tai khoan, broker review, best broker list, va FAQ-style content.
- Da them template seed cho `guide` va `best-broker-list`.
- Da them broker facts co source, affiliate link seed co dieu kien theo `DEMO_AFFILIATE_DESTINATION_URL`, va accepted internal link suggestions cung market/language.
- Them script `npm.cmd run pilot:check` de kiem tra data pilot sau khi co PostgreSQL.

Kiem tra da chay:

- `node --check prisma/seed.mjs`
- `node --check scripts/check-content-pilot.mjs`
- `npx.cmd prisma validate`
- `npm.cmd run lint`
- `npm.cmd run build`

Con lai de hoan tat smoke test pipeline:

- Cau hinh `DATABASE_URL` toi PostgreSQL that.
- Chay `npm.cmd run db:migrate`.
- Chay `npm.cmd run db:seed`.
- Chay `npm.cmd run pilot:check`.
- Hien phien nay da thu `db:seed` va `pilot:check`; ca hai bi chan vi chua co PostgreSQL server reachable.
- Mo cac URL pilot de kiem tra canonical, sitemap, schema JSON-LD, affiliate CTA, internal link rendering, admin edit flow, va AI import preview/save draft.
- Sau khi smoke test xanh moi can nhac batch content lon hon; van khong tao 4.000 bai cho den khi pilot duoc xac nhan.

## Cap nhat 2026-09-09 - Content scale operations checkpoints 16-20

Change da tao:

```text
openspec/changes/017-content-scale-operations/
```

Ket qua:

- Da co schema brief AI tai `docs/AI_CONTENT_BRIEF_SCHEMA.md` cho Article, Guide, BrokerReview, BestBrokerList, va CountryHub.
- Da co 50 draft pilot generated tai `data/ai-content/pilot-50-drafts.json`.
- Da co audit script `npm.cmd run content:audit`; audit 50 draft hien 0 error va 0 warning.
- Da co batch planner `npm.cmd run content:batch:plan`, tao `data/ai-content/batch-250-plan.json` o trang thai planned-only.
- Da co tai lieu van hanh scale tai `docs/CONTENT_SCALE_OPERATIONS.md`.
- Sitemap index va sitemap chunk co cache header rieng; affiliate click route co `no-store`.

Quyet dinh an toan:

- Chua tao 200-500 bai that vi PostgreSQL smoke test va AI Import Manager save draft tren DB that chua san sang.
- Batch lon chi duoc tao/import sau khi `db:migrate`, `db:seed`, `pilot:check`, `content:audit`, affiliate validation va internal link validation deu xanh.

## Cap nhat 2026-09-09 - System audit, admin workflow, and hardening

Change da tao:

```text
openspec/changes/018-system-audit-admin-workflow-hardening/
```

Ket qua:

- Giai doan 1 va Giai doan 8 duoc harden sau content scale operations.
- `/admin` khong con local-dev bypass khi thieu credentials; thieu `ADMIN_USERNAME` hoac `ADMIN_PASSWORD` thi fail-closed bang `503`.
- Them nen role don gian `ADMIN_ROLE=admin|editor`, chua tao user/permission system phuc tap.
- Content Manager ho tro workflow `Draft`, `Review`, `Published`, va `Archived` trong UI.
- Them author/reviewer metadata cho content.
- `publishedAt` duoc set khi publish lan dau va duoc giu khi sua bai da published.
- Danh sach content co search, market/status/template/content-type filters, pagination, va safe bulk move sang draft/review/archive.
- Bulk publish khong duoc bat vi phai di qua validation tung bai.
- Publish validation chan duplicate slug/canonical, inactive market/template, affiliate token sai, va CTA template thieu broker/affiliate link active.

Kiem tra da chay:

- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`
- `npx.cmd prisma validate`
- `npm.cmd run db:generate`
- `npm.cmd run content:pilot:generate`
- `npm.cmd run content:audit`
- `npm.cmd run content:batch:plan`
- Node syntax checks cho seed/pilot/import batch scripts
- Local production smoke test admin auth va robots route

Con lai:

- Can PostgreSQL reachable de chay `npm.cmd run db:migrate`, `npm.cmd run db:seed`, va `npm.cmd run pilot:check`.
- Sau khi co DB, can smoke test pilot public URLs, sitemap co data, JSON-LD, affiliate CTA redirect, admin edit flow, va AI Import save draft.

## Cap nhat 2026-09-10 - Checkpoints 26-30 quality and safety

Change da tao:

```text
openspec/changes/019-seo-broker-affiliate-link-ai-safety/
```

Ket qua:

- Giai doan 4 co SEO/AEO/GEO audit dashboard that tai `/admin/seo` va script `npm.cmd run seo:audit`.
- Audit phu missing SEO title/meta, multiple H1 risk, missing FAQ, missing schema readiness, canonical mismatch, hreflang gap, orphan content, va sitemap exclusion.
- Giai doan 3 BrokerReview/BrokerComparison duoc nang cap de hien structured broker facts co source, gom regulation, rating/score neu sourced, spread/fees, deposit/withdrawal, platform, account type, va sourced pros/cons.
- Giai doan 3 affiliate analytics duoc nang cap theo broker, campaign, market, content, va date ma khong them personal tracking fields.
- Giai doan 6 Internal Link Manager co form tao rule theo market/language/topic cluster/priority page/content type/mode/max links/spacing.
- Giai doan 7 co AI batch safety dry-run bang `npm.cmd run ai:batch:validate`, default max 50 items, reject report, draft-only gate, va khong bulk publish.

Kiem tra da chay:

- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`
- `npx.cmd prisma validate`
- `npm.cmd run db:generate`
- `npm.cmd run content:audit`
- `npm.cmd run ai:batch:validate`
- Node syntax checks cho script SEO audit va batch validation.

Con lai:

- Can PostgreSQL reachable de chay `npm.cmd run db:migrate`, `npm.cmd run db:seed`, `npm.cmd run pilot:check`, va `npm.cmd run seo:audit` tren du lieu that.
- Can browser smoke test dashboard admin voi data that sau khi DB san sang.
- Chua production deploy va chua tao/publish noi dung hang loat.

## Cap nhat 2026-09-10 - Checkpoints 31-35 production readiness and scale

Change da tao:

```text
openspec/changes/020-production-readiness-scale/
```

Ket qua:

- Giai doan 8 co them nen production operations trong `openspec/specs/production-operations/spec.md`.
- Database co them index cho published content lookup, sitemap ordering, va affiliate resolver.
- Public content, sitemap, va affiliate resolver co tag-based cache; mutation content/broker/affiliate co revalidation tag.
- Sitemap tiep tuc chia chunk va san sang pattern cho 4.000+ URL.
- Them backup/restore va Cloudflare-to-VPS Linux checklist tai `docs/BACKUP_RESTORE_VPS.md`.
- Them production readiness checklist tai `docs/PRODUCTION_READINESS.md`.
- Them scripts `backup:postgres`, `restore:postgres`, va `backup:media`.
- Them structured logging helper va error fallback cho public/admin.

Con lai truoc production lon:

- Can PostgreSQL reachable de chay migration/seed/pilot/SEO audit tren data that.
- Can restore drill PostgreSQL va media trong moi truong non-production.
- Can browser smoke test public/admin/affiliate/sitemap voi data that.
- Can load/performance test truoc khi tao va index 4.000 bai that.
