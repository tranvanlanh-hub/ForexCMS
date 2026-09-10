# Codex Handoff

## Trạng thái mới nhất — checkpoint 36–40, 2026-09-10

**Preview ready cho kiểm thử kỹ thuật; production CHƯA ready.** Kết quả phiên này thay thế các ghi chú trạng thái cũ bên dưới; các mục cũ được giữ làm lịch sử.

Change: [021-post-deploy-launch-checkpoints](../openspec/changes/021-post-deploy-launch-checkpoints/verification.md).

- Checkpoint 36: giữ nguyên thay đổi chưa commit; lưu inventory, bổ sung ignore log/cache/build artifact và đề xuất 4 nhóm commit. Chưa stage/commit/push.
- Checkpoint 37: sửa BOM ở hai file env private và nạp .env.local cho SEO audit. Neon pooled + TLS; 7/7 migration đã áp dụng, checksum khớp. Không cần migration/seed lại. Năm lệnh yêu cầu đều pass; SEO 16 bài, 0 issues; pilot 16 published + 1 draft, 18 affiliate active; batch 50 accepted, 0 rejected, dry-run.
- Checkpoint 38: HTTP preview thật pass cho toàn bộ 16 bài, comparison, sitemap, auth và CTA test. Thiếu/sai auth 401; đúng auth 200 no-store; draft 404. Sửa 12 orphan links và 2 link cũ chưa render: 14 bài pilot có thêm đọc tiếp, có snapshot private/revision; không đổi trạng thái publish hay affiliate URL. Sau TTL cache, 16/16 link đã hiện trên HTML. Chi tiết từng check ở smoke-results.json.
- Checkpoint 39: [Production launch checklist](PRODUCTION_LAUNCH_CHECKLIST.md) đã có. Worker preview không D1; Worker gốc cũ content-hub-cms vẫn có D1 remote và chưa đủ cấu hình Neon production. Không sửa/xóa Worker cũ trong phiên này.
- Checkpoint 40: [Content plan](POST_LAUNCH_CONTENT_PLAN.md): chuẩn bị 50 bài thật, launch 20 + giữ 30 draft; tăng dần 100/250 theo chất lượng/indexing. Dữ liệu hiện tại vẫn là demo, có SampleFX; không đưa nguyên bộ pilot lên production.

Lint/build/typecheck pass; build có warning WASM import pattern của Prisma edge. Rà soát secret không tìm thấy credential đang dùng trong file được scan và 2 commit; có giới hạn phạm vi. Chưa có full Neon backup/restore (pg_dump không có trên PATH); snapshot sửa pilot không thay thế backup.

Owner cần: chốt production Worker và Neon branch, đổi mật khẩu mạnh, domain/APP_URL/APP_ENV production, secret/media configuration, backup+restore, nội dung thật và chính sách không index preview; sau cùng xác nhận rõ production deploy. Phiên này **không deploy preview/production, không commit/push**.

## Đọc file này trước khi làm tiếp

Dự án này là một Forex Affiliate CMS quy mô lớn, không dùng WordPress, hướng tới khoảng 4.000 bài viết hoặc hơn.

Trước khi code, đọc các file OpenSpec-lite trước:

1. `openspec/project.md`
2. `openspec/product.md`
3. `openspec/tech.md`
4. `openspec/structure.md`
5. Spec liên quan trong `openspec/specs/*/spec.md`
6. Change đang làm trong `openspec/changes/*`

Sau đó đọc các file planner/handoff:

1. `docs/PROJECT_BRIEF.md`
2. `docs/ARCHITECTURE.md`
3. `docs/ROADMAP.md`

Nếu user yêu cầu code một tính năng mới, phải kiểm tra đã có change trong `openspec/changes/` chưa. Nếu chưa có, tạo change nhỏ gồm:

- `proposal.md`
- `design.md`
- `tasks.md`

Rồi mới code theo task.

## Nguyên tắc không được phá

- Không đặt toàn bộ bài viết ở root domain dạng `/{slug}`.
- Không hard-code affiliate link trong nội dung.
- Không tạo cấu trúc CMS chỉ có một bảng post đơn giản.
- Không bỏ qua SEO metadata, schema, canonical, hreflang trong thiết kế.
- Không tạo template tùy tiện ngoài hệ thống Template Manager.
- Không thay đổi roadmap lớn mà không cập nhật tài liệu.
- Spec trước, code sau.
- Mỗi phiên code nên làm một change nhỏ trong `openspec/changes/`.

## Trạng thái mới nhất - 2026-09-10

Dự án đã qua các phiên production readiness 31-35 và đã có bản Cloudflare preview chạy thật.

Preview hiện tại:

```text
https://content-hub-cms-preview.content-hub-stack.workers.dev
```

Admin preview:

```text
https://content-hub-cms-preview.content-hub-stack.workers.dev/admin/content/
```

Quyết định đã chốt:

- Database chính là PostgreSQL trên Neon cho giai đoạn public ban đầu.
- Không dùng Cloudflare D1 làm database chính cho core CMS.
- VPS Linux là phương án dự phòng/migration path, chưa phải việc cần làm ngay trước khi public.
- Không cần có đủ 4.000 bài mới public dự án. 4.000 bài là lộ trình SEO/content trong 3-4 năm.
- Mục tiêu thực tế hiện tại là public sớm với CMS chạy được, có bài pilot, đo traffic/doanh thu rồi mở rộng dần.
- Chỉ deploy production khi user xác nhận rõ. Đến thời điểm này mới deploy preview, chưa production deploy.

Cloudflare preview đã được set secrets, không ghi credential vào repo:

- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Smoke test preview gần nhất đã đạt:

- Trang chủ trả `200`.
- `/admin/content/` trả `200` và đọc được Neon, không còn demo mode.
- Public article route trả `200`.
- Broker review route trả `200`.
- Vietnamese article route trả `200`.
- `/sitemap.xml` trả `200` và dùng preview URL thay vì localhost.
- `/sitemaps/content-0.xml` trả `200`.

Ghi chú kỹ thuật quan trọng:

- Prisma local/scripts vẫn dùng client Node mặc định.
- Cloudflare preview/production dùng Prisma edge client riêng tại `node_modules/.prisma/client-edge` với Neon adapter.
- Không cache global Prisma client trong Cloudflare preview/production vì Worker request context có thể bị lỗi khi tái dùng promise giữa request.
- Trước production cần đổi mật khẩu admin tạm, gắn domain thật, kiểm tra lại media/R2 nếu dùng upload, và xác nhận production deploy.

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

Change đầu tiên đã được tạo tại:

```text
openspec/changes/001-init-project/
```

Khi bắt đầu code nền dự án, làm theo:

- `openspec/changes/001-init-project/proposal.md`
- `openspec/changes/001-init-project/design.md`
- `openspec/changes/001-init-project/tasks.md`

## Cập nhật 2026-09-09 - Giai đoạn 0

Giai đoạn 0 đã được triển khai theo `openspec/changes/001-init-project/`.

Đã hoàn tất:

- Khởi tạo Next.js App Router với TypeScript.
- Cài và cấu hình Tailwind CSS v4 qua PostCSS.
- Tạo public homepage shell tại `/`.
- Tạo admin shell tại `/admin`.
- Tạo cấu trúc nền: `app/(public)`, `app/admin`, `components`, `lib/db`, `lib/seo`, `lib/affiliate`, `lib/storage`, `lib/routing`, `lib/content`, `public`.
- Tạo `.env.example` cho PostgreSQL và S3-compatible storage.
- Chạy `npm.cmd run lint` thành công.
- Chạy `npm.cmd run build` thành công.

Quyết định giữ nguyên:

- Chưa chọn ORM trong Giai đoạn 0 vì change 001 cho phép chưa cần migration nếu ORM chưa được quyết định.
- Database chính vẫn là PostgreSQL, không dùng Cloudflare D1 cho core CMS.
- Storage vẫn đi qua boundary `lib/storage`; chưa gọi trực tiếp Cloudflare R2/S3 trong UI.
- Không hard-code affiliate URL; chỉ có helper token nền trong `lib/affiliate`.

Gợi ý bước tiếp theo:

- Tạo OpenSpec change cho Giai đoạn 1 trước khi chọn ORM và thiết kế schema core CMS.
## Cap nhat 2026-09-09 - Initial database schema

Change rieng cho phien nay:

```text
openspec/changes/002-initial-database-schema/
```

Da hoan tat:

- Chon Prisma 6.x lam ORM cho core CMS.
- Giu PostgreSQL lam database chinh qua `DATABASE_URL`.
- Khong dung Cloudflare D1 va khong dung WordPress.
- Tao `prisma/schema.prisma` va migration PostgreSQL ban dau tai `prisma/migrations/202609090001_initial_cms_schema/migration.sql`.
- Tao model ban dau cho `Market`, `ContentItem`, `ContentRevision`, `Category`, `Topic`, `Template`, `SeoMetadata`, `Broker`, va `AffiliateLink`.
- Affiliate URL duoc luu trong bang `AffiliateLink`, khong hard-code trong content/template.
- Cap nhat `lib/db/index.ts` de export Prisma client dung chung.
- Them script `db:generate` va `db:migrate`.

Ghi chu cho phien sau:

- Chua chay migration vao database that vi workspace chua co PostgreSQL local dang chay/ket noi.
- Khi co database, dung `DATABASE_URL` va chay `npm.cmd run db:migrate`.
- Buoc tiep theo hop ly: seed data toi thieu cho market `global`, template `Article`/`BrokerReview`, sau do bat dau admin CRUD cho Content Manager.

## Cap nhat 2026-09-09 - Admin layout and navigation foundation

Change rieng cho phien nay:

```text
openspec/changes/003-admin-layout-navigation/
```

Da hoan tat:

- Tao admin layout dung chung tai `app/admin/layout.tsx`.
- Tao navigation nen cho Dashboard, Content, Templates, Brokers, Affiliate Links, SEO, URL Routing, AI Import, va Settings.
- Tao route that cho:
  - `/admin`
  - `/admin/content`
  - `/admin/templates`
  - `/admin/brokers`
  - `/admin/affiliate-links`
  - `/admin/seo`
  - `/admin/url-routing`
  - `/admin/ai-import`
  - `/admin/settings`
- Tao `lib/admin/navigation.ts` lam metadata dieu huong dung chung.
- Tao placeholder module page khong doc/ghi database va khong them CRUD ngoai pham vi.
- Giu public homepage khong thay doi trong phien nay.
- Chay `npm.cmd run lint` thanh cong.
- Chay `npm.cmd run build` thanh cong.

Ghi chu cho phien sau:

- Admin hien moi la nen dieu huong va module shell; chua co auth, CRUD, seed data, hay database-backed admin lists.
- Buoc tiep theo hop ly van la seed data toi thieu cho market/template, sau do bat dau Content Manager CRUD theo OpenSpec change rieng.

## Cap nhat 2026-09-09 - Basic admin Content Manager

Change rieng cho phien nay:

```text
openspec/changes/004-admin-content-manager/
```

Da hoan tat:

- Tao Content Manager database-backed tai `/admin/content`.
- Tao form tao moi tai `/admin/content/new`.
- Tao form sua tai `/admin/content/[id]/edit`.
- Form gom: title, slug, market/language, content type, template, status draft/published/archived, body markdown, SEO title, meta description.
- Tao server actions cho create/update, ghi `ContentItem`, `SeoMetadata`, va `ContentRevision`.
- Publish validation chan published neu thieu title, slug, market, content type, template, body, SEO title, hoac meta description.
- Canonical path duoc sinh tu helper theo `/{market}/{content-type}/{slug}/`, khong tao public URL root dang `/{slug}`.
- Body markdown tam thoi khong cho raw `http://`/`https://` link de tranh hard-code affiliate link trong content.
- Trang admin content co fallback neu PostgreSQL/migration chua san sang.
- Chay `npm.cmd run lint` thanh cong.
- Chay `npm.cmd run build` thanh cong.

Ghi chu cho phien sau:

- Chua co seed data. Can tao market `global` va template active toi thieu truoc khi tao content that.
- Chua co public renderer cho published content theo canonical path.
- Chua co search/filter/pagination cho danh sach content.
- Chua co auth/permission cho admin.

## Cap nhat 2026-09-09 - Public content renderer

Change rieng cho phien nay:

```text
openspec/changes/005-public-content-routing/
```

Da hoan tat:

- Tao public route dong tai `app/(public)/[market]/[contentType]/[slug]/page.tsx`.
- Route render theo URL pattern `/{market}/{content-type}/{slug}/`.
- Resolver chi tra ve content co `ContentStatus.PUBLISHED`.
- Draft, review, va archived content khong hien thi public.
- Render layout co header, breadcrumb, main article content, footer.
- Sinh metadata co title, description, robots, va canonical URL co ban.
- Page chi co mot H1 tu `ContentItem.title`; markdown H1 trong body duoc ha xuong H2.
- Them BreadcrumbList JSON-LD co ban.
- Khong tao root route `/{slug}`.
- Bat `trailingSlash: true` trong Next config de giu URL canonical co dau `/` cuoi.
- Them seed demo tai `prisma/seed.mjs` va script `npm.cmd run db:seed`.
- Chay `npm.cmd run lint` thanh cong.
- Chay `npm.cmd run build` thanh cong.

Ghi chu cho phien sau:

- Chua chay `npm.cmd run db:seed` vi can PostgreSQL local/thuc te va migration san sang.
- Khi co database, chay `npm.cmd run db:migrate` roi `npm.cmd run db:seed` de co demo URL `/global/articles/forex-trading-basics/`.
- Public renderer hien la markdown co ban; template-specific block rendering van nen lam trong change rieng.
- Buoc tiep theo hop ly: Broker Manager hoac nang cap Template Manager/block renderer.

## Cap nhat 2026-09-09 - Basic Broker and Affiliate Manager

Change rieng cho phien nay:

```text
openspec/changes/006-basic-broker-affiliate-manager/
```

Da hoan tat:

- Cap nhat Prisma schema va migration `202609090006_basic_broker_affiliate_manager`.
- Them `Broker.logoUrl`, `Broker.description`, va `AffiliateLink.languageCode`.
- Tao Broker Manager database-backed tai `/admin/brokers`.
- Tao form tao broker tai `/admin/brokers/new`.
- Tao form sua broker tai `/admin/brokers/[id]/edit`.
- Form broker gom name, slug, status, logo/media URL, short description.
- Tao Affiliate Link Manager database-backed tai `/admin/affiliate-links`.
- Tao form tao affiliate link tai `/admin/affiliate-links/new`.
- Tao form sua affiliate link tai `/admin/affiliate-links/[id]/edit`.
- Form affiliate link gom broker, market, language, campaign, destinationUrl, status, priority.
- Tao resolver tap trung trong `lib/affiliate` theo broker + market + language + campaign.
- Tao `components/public/affiliate-cta.tsx` chi nhan token va render `rel="sponsored nofollow"`.
- Public content renderer co the render CTA cho broker gan voi content ma khong hard-code URL trong body bai viet.
- Cap nhat seed demo broker `exness` va campaign `review_top_cta`.
- Chay `npm.cmd run db:generate` thanh cong sau khi dung dev server dang giu Prisma DLL.
- Chay `npm.cmd run lint` thanh cong.
- Chay `npm.cmd run build` thanh cong.

Ghi chu cho phien sau:

- Chua chay migration/seed vao PostgreSQL that trong phien nay.
- Khi co database, chay `npm.cmd run db:migrate` roi `npm.cmd run db:seed`.
- Content Manager chua co UI gan broker vao content; hien seed demo gan broker bang script.
- Click tracking moi o muc chuan bi `data-affiliate-link-id`, chua co bang analytics/dashboard.

## Cap nhat 2026-09-09 - SEO/AEO/GEO foundation

Change rieng cho phien nay:

```text
openspec/changes/007-seo-aeo-geo-foundation/
```

Da hoan tat:

- Mo rong `lib/seo` thanh helper dung chung cho app URL, absolute URL, robots metadata, canonical guard, language alternates, breadcrumb, Article schema, FAQPage schema, va JSON-LD output.
- Public content page render SEO title, meta description, canonical, robots metadata, visible breadcrumb, Article JSON-LD, BreadcrumbList JSON-LD, va FAQPage JSON-LD neu markdown co section FAQ.
- Canonical public page va sitemap duoc guard theo market path; khong tin blindly vao `SeoMetadata.canonicalPath` neu path sai market.
- Language duoc dua vao metadata qua `alternates.languages` tu `Market.locale`/`Market.languageCode`; canonical van bam URL pattern co market.
- Tao sitemap index tai `/sitemap.xml`.
- Tao sitemap content segment tai `/sitemaps/content-N.xml`, voi chunk size 4.000 URL trong `SITEMAP_URL_LIMIT` de sau nay chia sitemap lon.
- Tao robots.txt tai `/robots.txt`, allow public, disallow `/admin/`, va tro toi sitemap index.
- Giu hanh vi chi mot H1 tren public page; markdown H1 van bi ha xuong H2 trong renderer.
- Chay `npm.cmd run lint` thanh cong.
- Chay `npm.cmd run build` thanh cong.

Ghi chu cho phien sau:

- FAQPage hien duoc suy ra tu markdown section `## FAQ`, `## FAQs`, hoac `## Frequently Asked Questions`; FAQ block chinh thuc nen lam trong Template System change rieng.
- Sitemap hien doc truc tiep published content tu database; khi co hang nghin URL co the them cache/background job ma khong doi route `/sitemaps/content-N.xml`.
- Hreflang hien moi self-reference theo market locale; can model quan he ban dich/cross-market de tao hreflang map day du.

## Cap nhat 2026-09-09 - Cloudflare preview deploy prep

Change rieng cho phien nay:

```text
openspec/changes/008-cloudflare-preview-deploy-prep/
```

Da hoan tat:

- Doc toan bo OpenSpec va docs handoff truoc khi chinh cau hinh.
- Tao `DEPLOYMENT.md` lam checklist deploy preview.
- Cap nhat `docs/CLOUDFLARE_DEPLOY.md` de uu tien preview dry-run va preview deploy rieng.
- Them script `npm.cmd run preview:check` de chay `vinext build` va `vinext-cloudflare deploy --env preview --dry-run`.
- Them script `npm.cmd run deploy:preview` cho preview deploy that khi user xac nhan.
- Them `env.preview` trong `wrangler.jsonc` voi Worker name `content-hub-cms-preview`.
- Mo rong `.env.cloudflare.example` voi checklist runtime vars cho Cloudflare preview.
- Giu PostgreSQL la database chinh qua Prisma `DATABASE_URL`.
- Khong them Cloudflare D1 binding.
- Giu media storage theo bien `S3_*` va boundary `lib/storage`.

Can lam truoc khi preview deploy that:

- Set `CLOUDFLARE_API_TOKEN` va `CLOUDFLARE_ACCOUNT_ID` neu token co nhieu account.
- Set Cloudflare secrets cho `DATABASE_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
- Set non-secret runtime vars cho `APP_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_PUBLIC_BASE_URL`.
- Dung PostgreSQL connection path tuong thich Cloudflare Workers, vi du Prisma Accelerate hoac pool/proxy phu hop.
- Chi chay deploy preview khi user xac nhan; khong production deploy khi chua duoc xac nhan.

## Cap nhat 2026-09-09 - Security and deployment verification

Change rieng cho phien nay:

```text
openspec/changes/009-security-deployment-verification/
```

Da hoan tat:

- Tao OpenSpec change cho security + deployment verification.
- Bao ve `/admin` bang `proxy.ts` voi HTTP Basic Authentication toi thieu.
- Neu thieu `ADMIN_USERNAME` hoac `ADMIN_PASSWORD`, `/admin` tra ve `503` va khong render backend CMS public.
- Neu co credentials nhung request khong co Basic Auth hop le, `/admin` tra ve `401`.
- Public routes khong nam trong matcher admin, giu `/`, `/sitemap.xml`, `/robots.txt`, va content route public hoat dong rieng.
- Doi Prisma datasource ve PostgreSQL qua `DATABASE_URL`.
- Go `@prisma/adapter-d1`, xoa D1 binding trong `wrangler.jsonc`, xoa artifact `prisma/d1`, va xoa type binding `DB`.
- Xac nhan generated `dist/server/wrangler.json` co `d1_databases: []`.
- Cap nhat `.env.example`, `.env.cloudflare.example`, `DEPLOYMENT.md`, va `docs/CLOUDFLARE_DEPLOY.md` voi `ADMIN_USERNAME`/`ADMIN_PASSWORD`.
- Seed demo khong con hard-code affiliate destination fallback; `AffiliateLink` demo chi tao khi co `DEMO_AFFILIATE_DESTINATION_URL`.
- Xac nhan Cloudflare production Worker `content-hub-cms` co deployments, latest observed deployment `2026-09-09T14:29:59.809Z` serving version `61921371-c388-4d55-9282-4958bcb298aa` at 100%.
- Xac nhan Cloudflare preview Worker `content-hub-cms-preview` chua ton tai trong account hien tai.
- Xac nhan Cloudflare production Worker secret list dang rong, nen chua co `DATABASE_URL`, admin credentials, hay S3 secrets tren Worker.

Kiem tra da chay:

- `npx.cmd prisma validate` voi PostgreSQL `DATABASE_URL` tam trong process.
- `npm.cmd run db:generate`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run preview:check`
- Local production smoke test:
  - `/` tra ve `200`
  - `/admin/` khong auth tra ve `401`
  - `/admin/` co Basic Auth dung tra ve `200`
  - `/admin/` khi thieu admin env vars tra ve `503`
  - `/sitemap.xml` tra ve `200`
  - `/robots.txt` tra ve `200`
  - `/global/articles/forex-trading-basics/` tra ve `404` vi chua co PostgreSQL data/migration/seed local trong phien nay

Viec can lam truoc deploy/verify remote tiep:

- Set Cloudflare secrets cho `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
- Set non-secret runtime vars cho `APP_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_PUBLIC_BASE_URL`.
- Tao/deploy preview Worker `content-hub-cms-preview` neu muon smoke-test preview rieng.
- Chay migration va seed vao PostgreSQL that neu can test URL demo `/global/articles/forex-trading-basics/`.

## Cap nhat 2026-09-09 - Template block renderer foundation

Change rieng cho phien nay:

```text
openspec/changes/010-template-block-renderer/
```

Da hoan tat:

- Doc OpenSpec lien quan truoc khi code.
- Tao block parser/normalizer tai `lib/content/blocks.ts`.
- Admin Content Manager van nhap markdown, nhung content moi luu them `blocks` trong `ContentItem.body`.
- Content cu dang markdown-only van duoc derive blocks luc render.
- Article template ho tro intro, summary/key takeaways, table of contents, body, FAQ, va CTA slot.
- BrokerReview template ho tro intro, summary/key takeaways, table of contents, pros/cons, body, FAQ, va CTA slot.
- Public route dung `components/public/template-block-renderer.tsx` de render block theo template.
- CTA slot tiep tuc dung broker/market/language/campaign token qua affiliate resolver.
- FAQPage schema lay tu FAQ block.
- Article schema them `articleSection` tu TOC headings va key takeaway items.
- Publish validation canh bao neu thieu required template blocks.

Ghi chu cho phien sau:

- Chua co Template Manager UI day du; template registry hien duoc seed qua `prisma/seed.mjs`.
- Chua co UI gan broker vao content; CTA slot chi hien khi content co broker relation.
- BrokerReview schema hien van dung Article JSON-LD co section + FAQ; Review/FinancialProduct schema nen lam sau khi co BrokerFact/rating model.

## Cap nhat 2026-09-09 - Multi-market and multi-language foundation

Change rieng cho phien nay:

```text
openspec/changes/011-multi-market-language/
```

Da hoan tat:

- Tao OpenSpec change cho nen multi-market/multi-language.
- Kiem tra model hien tai: `Market` da co `code`, `name`, `languageCode`, `locale`, `countryCode`, `status`, va `isGlobal`; chua can tao model `SiteLocale` rieng trong pham vi nay.
- Them registry market chuan tai `lib/market` cho `global`, `us`, `uk`, `au`, `vn`, va `th`.
- Seed tao/cap nhat du 6 market:
  - `global`: English global, locale `en`, khong country.
  - `us`: English United States, locale `en-US`, country `US`.
  - `uk`: English United Kingdom, locale `en-GB`, country `GB`.
  - `au`: English Australia, locale `en-AU`, country `AU`.
  - `vn`: Vietnamese Vietnam, locale `vi-VN`, country `VN`.
  - `th`: Thai Thailand, locale `th-TH`, country `TH`.
- Them model `ContentTranslationGroup` va `ContentItem.translationGroupId` de gom cac ban cung chu de/bien dich cho hreflang sau nay.
- Them migration PostgreSQL `prisma/migrations/202609090011_multi_market_language/migration.sql`.
- Public route chi render content published trong market `ACTIVE`.
- Sitemap chi lay published content trong market `ACTIVE`.
- Hreflang/language alternates sinh tu published translation siblings, bo qua sibling sai canonical market path, va dung ban `global` lam `x-default` neu co.
- Content Manager co truong `translationGroupKey` de gan cac ban cung chu de.
- Admin co Market Manager co ban tai `/admin/markets`, `/admin/markets/new`, va `/admin/markets/[id]/edit`.
- Affiliate Link Manager va Content Manager chi hien market `ACTIVE` trong dropdown tao/sua.
- Sua lint nho trong `TemplateBlockRenderer` de khong truyen `children` nhu prop.

Kiem tra da chay:

- `npx.cmd prisma validate` voi PostgreSQL `DATABASE_URL` tam trong process.
- `npm.cmd run db:generate`
- `npm.cmd run lint`
- `npm.cmd run build`

Ghi chu cho phien sau:

- Chua chay migration/seed vao PostgreSQL that trong phien nay.
- Khi co database, chay `npm.cmd run db:migrate` roi `npm.cmd run db:seed`.
- `ContentTranslationGroup` hien quan ly qua key trong Content Manager; chua co UI rieng de xem toan bo group va map cac market.
- Hreflang hien duoc sinh tu published sibling trong cung group; SEO Manager UI chuyen sau co the them man hinh kiem tra missing locale/market.

## Cap nhat 2026-09-09 - Basic Internal Link Automation

Change rieng cho phien nay:

```text
openspec/changes/012-internal-link-automation/
```

Da hoan tat:

- Tao spec dai han moi tai `openspec/specs/internal-link-automation/spec.md`.
- Mo rong Prisma schema va migration `202609090012_internal_link_automation`.
- Them model `TopicCluster`, `AnchorText`, `InternalLinkRule`, va `InternalLinkSuggestion`.
- Nang cap `Topic` voi optional `topicClusterId`.
- Tao deterministic suggestion engine tai `lib/internal-links`.
- Engine chi tao suggestion cho published content cung `marketId` va cung `languageCode`.
- Engine cham diem theo topic cluster, rule, priority page, anchor priority, source/target content type.
- Gioi han suggestion dau tien toi da 8 link/bai; UI va constants giu muc muc tieu 3-8 link/bai.
- Them admin screen `/admin/internal-links` de xem cluster, anchor, rule, suggestion, generate suggestion cho mot source article, va accept/reject suggestion.
- Public renderer chi render internal links da `ACCEPTED` hoac den tu rule `ACTIVE` co mode `AUTO_APPROVE`.
- Public renderer chen link luc render, khong ghi de `ContentItem.body`, va co spacing toi thieu de tranh link qua day.
- Seed demo them cluster `forex-education`, topic `forex-basics`, article target `Template Blocks for Forex Articles`, anchor `Template blocks`, va rule suggest-only.

Kiem tra da chay:

- `npx.cmd prisma validate` voi PostgreSQL `DATABASE_URL` tam trong process.
- `npm.cmd run db:generate`
- `npm.cmd run lint`
- `npm.cmd run build`

Ghi chu cho phien sau:

- Chua chay migration/seed vao PostgreSQL that trong phien nay.
- Khi co database, chay `npm.cmd run db:migrate` roi `npm.cmd run db:seed`.
- UI hien moi review/generate/accept/reject; chua co form tao/sua TopicCluster, AnchorText, hoac Rule.
- Nen them bulk generation, orphan pages dashboard, va pages-can-use-more-links dashboard trong change rieng.

## Cap nhat 2026-09-09 - Basic AI Content Import Pipeline

Change rieng cho phien nay:

```text
openspec/changes/013-basic-ai-content-import-pipeline/
```

Da hoan tat:

- Tao AI Import Manager co ban tai `/admin/ai-import`.
- Ho tro paste mot draft tu JSON hoac Markdown frontmatter.
- Them parser/normalizer/validator tai `lib/ai-import`.
- Validate title, slug, market, language, content type, template, body/content, SEO title, meta description, affiliate token, va broker mention.
- Market phai active, template phai active, language phai khop market.
- Duplicate slug/canonical path bi chan truoc khi save.
- Body Markdown/HTML co `http://` hoac `https://` bi chan de tranh hard-code affiliate URL.
- Affiliate token phai resolve den AffiliateLink active qua broker/market/language/campaign.
- Broker mention phai resolve den broker co trong Broker Manager.
- Trang admin co Validate preview va Save draft; Save draft chi bat khi khong co blocking error.
- Import luon tao `ContentStatus.DRAFT`, khong publish thang.
- Save draft tao `ContentItem`, `SeoMetadata`, `ContentRevision`, optional translation group, va connect broker hop le.

Kiem tra da chay:

- `npm.cmd run lint`
- `npm.cmd run build`

Ghi chu cho phien sau:

- Chua co bulk import.
- Chua co upload file `.md`/`.json`; hien la paste input.
- Required template blocks hien la warning o import draft, con publish validation van chan trong Content Manager.
- Nen them history/log import va bulk validation table trong change rieng.

## Cap nhat 2026-09-09 - Broker data, review, and comparison foundation

Change rieng cho phien nay:

```text
openspec/changes/014-broker-data-review-comparison/
```

Da hoan tat:

- Them enum `BrokerFactCategory` va model `BrokerFact` trong Prisma.
- Them migration PostgreSQL `202609090014_broker_data_review_comparison`.
- `BrokerFact` ho tro regulation/license, minimum deposit, spread, leverage, platforms, account types, deposit/withdrawal methods, support languages, restricted countries, va `OTHER`.
- Moi `BrokerFact` bat buoc co `sourceName` va `sourceUrl`; public review/comparison chi hien fact co source fields.
- Broker Manager co the nhap sourced facts trong form tao/sua broker theo tung dong co cau truc.
- Danh sach broker hien them so luong facts.
- BrokerReview public renderer hien bang facts co citation cho broker dau tien gan voi bai review.
- Them Review JSON-LD cho BrokerReview, khong emit rating vi chua co rating model.
- Them route comparison nen `/{market}/compare/{broker-a}-vs-{broker-b}/`.
- Comparison route load 2 broker active, loc facts global/current-market, render bang so sanh co source va ItemList JSON-LD.
- Seed them template `broker-comparison` va 2 broker demo hu cau co sourced facts de test comparison.
- Khong hard-code affiliate URL; CTA comparison van dung broker/market/language/campaign token qua resolver.

Kiem tra da chay:

- `npx.cmd prisma validate`
- `npm.cmd run db:generate`
- `npm.cmd run lint`
- `npm.cmd run build`

Ghi chu cho phien sau:

- Chua chay migration/seed vao PostgreSQL that trong phien nay.
- Khi co database, chay `npm.cmd run db:migrate` roi `npm.cmd run db:seed`.
- BrokerFact admin hien la textarea structured-line MVP; co the tach thanh CRUD/table UI sau.
- Chua co rating/scoring model, nen Review schema chua co `reviewRating`.
- Chua co public broker profile route `/{market}/brokers/{broker-slug}/`.

## Cap nhat 2026-09-09 - Analytics, click tracking, and quality dashboard

Change rieng cho phien nay:

```text
openspec/changes/015-analytics-click-quality-dashboard/
```

Da hoan tat:

- Tao spec dai han moi tai `openspec/specs/analytics-quality-dashboard/spec.md`.
- Them model `AffiliateClickEvent` trong Prisma va migration `202609090015_analytics_click_quality_dashboard`.
- Public affiliate CTA khong link truc tiep den destination nua; CTA di qua `/affiliate/click/{affiliateLinkId}` roi redirect.
- Click tracking luu `affiliateLinkId`, optional `brokerId`, optional `contentItemId`, `market`, `campaign`, optional `referrer`, va `clickedAt`.
- Referrer duoc sanitize bo query/hash va truncate; khong luu IP address, user agent, cookie id, visitor id, session id, fingerprint, hay du lieu nhay cam khong can thiet.
- Tracking insert loi khong chan redirect neu affiliate link van hop le.
- Them helper analytics tai `lib/analytics`.
- Them admin dashboard tai `/admin/analytics`.
- Dashboard hien total affiliate clicks, top broker theo click, top content theo click, content thieu SEO metadata, inactive/empty affiliate links, missing CTA resolution cho published broker content, va orphan published content.
- Them Analytics vao admin navigation.

Kiem tra da chay:

- `npx.cmd prisma validate` voi PostgreSQL `DATABASE_URL` tam trong process.
- `npm.cmd run db:generate` sau khi dung dev server dang khoa Prisma DLL.
- `npm.cmd run lint`
- `npm.cmd run build`

Ghi chu cho phien sau:

- Chua chay migration vao PostgreSQL that trong phien nay.
- Khi co database, chay `npm.cmd run db:migrate` de tao `AffiliateClickEvent`.
- Dashboard hien chua co date filter, export, campaign filter, hay cached rollup.
- Broken external destination checker chua crawl URL that; hien dashboard chi flag link inactive hoac destination rong va CTA khong resolve duoc.

## Cap nhat 2026-09-09 - Small content production pilot

Change rieng cho phien nay:

```text
openspec/changes/016-small-content-production-pilot/
```

Da hoan tat:

- Tao OpenSpec change cho pilot san xuat noi dung quy mo nho truoc khi scale.
- Thay `prisma/seed.mjs` bang seed pilot idempotent voi 17 content items:
  - 16 published items.
  - 1 draft item de kiem tra public route khong render draft.
  - Market `global` va `vn`.
  - Education article, account-opening guide, broker review, best broker list, FAQ-style content.
- Them active template seed cho `guide` va `best-broker-list` ben canh `article`, `broker-review`, va `broker-comparison`.
- Them broker demo `exness`, `samplefx`, va `example-markets` voi sourced `BrokerFact` rows.
- Affiliate CTA tiep tuc qua `AffiliateLink`; body content khong chua raw URL.
- Seed affiliate links cho `review_top_cta`, `review_middle_cta`, va `review_bottom_cta` neu co `DEMO_AFFILIATE_DESTINATION_URL`.
- Them accepted internal link suggestions mau trong cung market/language cho global va vn.
- Them script `npm.cmd run pilot:check` tai `scripts/check-content-pilot.mjs` de kiem tra data pilot sau khi migrate/seed.
- Seed/check scripts tu nap `.env.local` hoac `.env` neu co.

Kiem tra da chay:

- `node --check prisma/seed.mjs`
- `node --check scripts/check-content-pilot.mjs`
- `npx.cmd prisma validate` voi PostgreSQL `DATABASE_URL` tam trong process.
- `npm.cmd run lint`
- `npm.cmd run build`

Bi chan trong phien nay:

- Chua chay duoc `npm.cmd run db:seed` hoac `npm.cmd run pilot:check` tren database that. Khi khong set env thi thieu `DATABASE_URL`; khi dung PostgreSQL URL tam thi khong co server reachable tai `localhost:5432`.
- `psql` va Docker khong co trong PATH, nen phien nay khong tu start duoc PostgreSQL local.
- Chua smoke test public URL/canonical/sitemap/schema/CTA/admin edit/AI import bang browser voi data that vi thieu PostgreSQL connection.

Khi co database, chay:

```text
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run pilot:check
```

Sau do smoke test cac URL dai dien:

```text
/global/articles/forex-trading-basics/
/global/guides/how-to-open-a-forex-trading-account/
/global/broker-reviews/exness-review/
/global/best-brokers/best-forex-brokers-for-beginners/
/vn/articles/forex-la-gi/
/vn/guides/cach-mo-tai-khoan-forex/
/vn/broker-reviews/exness-review-vietnam/
/vn/best-brokers/san-forex-uy-tin-cho-nguoi-moi/
/sitemap.xml
/sitemaps/content-0.xml
```

## Cap nhat 2026-09-09 - Content scale operations checkpoints 16-20

Change rieng cho phien nay:

```text
openspec/changes/017-content-scale-operations/
```

Da hoan tat theo thu tu checkpoint:

- Checkpoint 16: Them `docs/AI_CONTENT_BRIEF_SCHEMA.md` lam contract output AI cho Article, Guide, BrokerReview, BestBrokerList, va CountryHub.
- Checkpoint 17: Them generator `scripts/generate-content-pilot.mjs` va sinh `data/ai-content/pilot-50-drafts.json` gom dung 50 draft items, chia theo topic cluster va market.
- Checkpoint 18: Them `scripts/audit-content-batch.mjs` de audit SEO title/meta, duplicate slug/canonical, internal link targets, affiliate token, canonical, FAQ/schema, va orphan risk. Audit tren 50 draft da xanh voi 0 error va 0 warning sau khi sua generator.
- Checkpoint 19: Khong tao 200-500 bai that vi DB-backed AI import/SEO/internal link/affiliate validation chua duoc smoke test voi PostgreSQL that. Them `scripts/prepare-content-batch.mjs` de tao `data/ai-content/batch-250-plan.json` o trang thai planned-only.
- Checkpoint 20: Them `docs/CONTENT_SCALE_OPERATIONS.md` cho sitemap chunk, cache strategy, query/index baseline, backup database/media checklist, va deploy notes Cloudflare/VPS Linux. Them cache headers cho sitemap index/chunks va `no-store` cho affiliate click route.

Lenh da chay:

- `node --check scripts/generate-content-pilot.mjs`
- `node --check scripts/audit-content-batch.mjs`
- `node --check scripts/prepare-content-batch.mjs`
- `npm.cmd run content:pilot:generate`
- `npm.cmd run content:audit`
- `npm.cmd run content:batch:plan`
- `npx.cmd prisma validate` voi PostgreSQL-shaped `DATABASE_URL` tam trong process
- `npm.cmd run lint`
- `npm.cmd run build`

Con bi chan:

- Chua chay duoc DB-backed `db:seed`, `pilot:check`, browser smoke test, hay AI Import Manager save draft vi workspace van chua co PostgreSQL reachable.
- Chua tao 200-500 draft article that; hien moi co batch plan 250 dong. Chi tao batch lon sau khi DB-backed AI import, SEO validation, internal link validation va affiliate validation deu xanh.

## Cap nhat 2026-09-09 - System audit, admin workflow, and hardening checkpoints 21-25

Change rieng cho phien nay:

```text
openspec/changes/018-system-audit-admin-workflow-hardening/
```

Da hoan tat theo thu tu checkpoint:

- Checkpoint 21: Audit sau phien 16-20. Lint, typecheck, build, Prisma validate, script syntax, content pilot generate/audit, batch plan, sitemap/robots/admin smoke checks deu duoc chay. Khong thay D1 dependency/binding trong active config. Loi Prisma generate do Next dev server giu DLL da duoc xu ly bang cach dung server dev roi chay lai thanh cong.
- Checkpoint 22: `/admin` fail-closed khi thieu `ADMIN_USERNAME`/`ADMIN_PASSWORD`; local dev khong con bypass auth khi thieu credentials. Basic Auth dung thi vao duoc, sai/thieu auth bi `401`. Them role foundation nho qua `ADMIN_ROLE=admin|editor`.
- Checkpoint 23: Content workflow admin ho tro day du `DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED`. Them author/reviewer metadata trong Content Manager. `publishedAt` duoc giu lai khi sua bai da published. AI Import tiep tuc save draft-only.
- Checkpoint 24: Content list co search theo title/slug/canonical, filter theo market/status/template/content type, pagination 25 item/page, va bulk action an toan chi cho move to draft/review/archive. Khong bulk publish.
- Checkpoint 25: Publish/save validation duoc harden cho duplicate slug/canonical, active market/template, inline affiliate token, CTA template phai co active broker va active affiliate link dung campaign/market/language. Admin fallback khi thieu env/db tiep tuc ro rang.

Lenh da chay:

- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`
- `npx.cmd prisma validate` voi PostgreSQL-shaped `DATABASE_URL` tam trong process
- `npm.cmd run db:generate`
- `node --check prisma/seed.mjs`
- `node --check scripts/check-content-pilot.mjs`
- `node --check scripts/generate-content-pilot.mjs`
- `node --check scripts/audit-content-batch.mjs`
- `node --check scripts/prepare-content-batch.mjs`
- `npm.cmd run content:pilot:generate`
- `npm.cmd run content:audit`
- `npm.cmd run content:batch:plan`

Smoke test local production:

- `/admin/content/` khi thieu admin credentials tra ve `503`.
- `/admin/` khi thieu/sai Basic Auth tra ve `401`.
- `/admin/` voi Basic Auth dung vao duoc.
- `/robots.txt` tra ve `200`.
- `/global/articles/forex-trading-basics/` van `404` khi chua co PostgreSQL data local.

Con bi chan:

- `npm.cmd run db:migrate`, `npm.cmd run db:seed`, va `npm.cmd run pilot:check` van bi chan vi khong co PostgreSQL reachable tai `localhost:5432`.
- Chua smoke test duoc public URL pilot, sitemap co data, schema JSON-LD tren data that, affiliate CTA render, admin edit backed by DB, hoac AI Import save draft backed by DB.
- Khong production deploy trong phien nay.

## Cap nhat 2026-09-10 - SEO, broker, affiliate, internal link, and AI safety checkpoints 26-30

Change rieng cho phien nay:

```text
openspec/changes/019-seo-broker-affiliate-link-ai-safety/
```

Da hoan tat theo thu tu checkpoint:

- Checkpoint 26: Them SEO/AEO/GEO audit layer tai `lib/seo/audit.ts`, admin dashboard that tai `/admin/seo`, va script `npm.cmd run seo:audit`. Audit kiem tra missing title/meta, multiple H1 risk, missing FAQ, missing schema readiness, canonical mismatch, hreflang gap, orphan published content, va sitemap exclusion.
- Checkpoint 27: Nang BrokerReview va BrokerComparison theo sourced facts. Public review hien sourced snapshot cho regulation, rating/score neu co fact co source, spread/fees, minimum deposit, deposit/withdrawal, platform, account type, va sourced pros/cons. Unsourced markdown pros/cons khong render tren BrokerReview. Review JSON-LD chi them `reviewRating` khi co sourced rating/score fact.
- Checkpoint 28: Nang `/admin/analytics` voi click aggregation theo broker, campaign, market, content, va date. Data model tracking khong them IP, user agent, cookie, visitor/session id, hay fingerprint.
- Checkpoint 29: Nang `/admin/internal-links` voi form tao rule theo market, language, optional topic cluster, optional priority target page, source/target content type, mode suggest-only/auto-approve, status, max links/page, min word spacing, va priority. Server action validate rule khong duoc sai market/language.
- Checkpoint 30: Them `scripts/validate-ai-batch.mjs` va script `npm.cmd run ai:batch:validate`. Batch validation dry-run mac dinh, gioi han 50 item, tao reject report tai `data/ai-content/last-batch-reject-report.json`, va khong publish/khong ghi DB trong dry-run.

Lenh da chay:

- `node --check scripts/seo-audit.mjs`
- `node --check scripts/validate-ai-batch.mjs`
- `npm.cmd run ai:batch:validate` - pass, 50 accepted, 0 rejected, dry-run.
- `npm.cmd run content:audit` - pass, 0 errors, 0 warnings.
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`
- `npx.cmd prisma validate` voi PostgreSQL-shaped `DATABASE_URL` tam trong process.
- `npm.cmd run db:generate` - pass sau mot lan retry vi Windows khoa Prisma DLL tam thoi.

Con bi chan:

- `npm.cmd run seo:audit` can PostgreSQL that va hien fail vi khong reach duoc `localhost:5432`.
- `npm.cmd run db:migrate` van bi chan vi khong co PostgreSQL reachable.
- Chua production deploy va khong tao/publish noi dung hang loat.

## Cap nhat 2026-09-10 - Production readiness and scale checkpoints 31-35

Change rieng cho phien nay:

```text
openspec/changes/020-production-readiness-scale/
```

Da hoan tat theo thu tu checkpoint:

- Checkpoint 31: Them index PostgreSQL co ly do cho public content lookup, sitemap published content ordering, va affiliate resolver. Khong dung Cloudflare D1.
- Checkpoint 32: Them tag-based cache cho public content, sitemap count/chunks, va affiliate resolver. Admin/private routes va affiliate click redirect khong public-cache. Content/broker/affiliate mutations co revalidation tag.
- Checkpoint 33: Them `docs/BACKUP_RESTORE_VPS.md`, `docs/PRODUCTION_READINESS.md`, va scripts backup/restore PostgreSQL, backup media S3-compatible. Khong hard-code credential.
- Checkpoint 34: Them structured logging helper, public error boundary, va admin error fallback. Logging redact cac key nhay cam.
- Checkpoint 35: Cap nhat OpenSpec, roadmap, handoff, va production readiness checklist truoc khi tao 4.000 bai that.

Ghi chu quan trong:

- He thong van portable: Next.js + Prisma + PostgreSQL + S3-compatible storage.
- Khong production deploy trong phien nay.
- Van can PostgreSQL reachable de chay migration/seed/seo audit/pilot check tren data that.

Kiem tra da chay:

- `node --check scripts/backup-postgres.mjs`
- `node --check scripts/restore-postgres.mjs`
- `node --check scripts/backup-media.mjs`
- `node --check scripts/seo-audit.mjs`
- `node --check scripts/validate-ai-batch.mjs`
- `npm.cmd run content:audit` - pass, 0 errors, 0 warnings.
- `npm.cmd run ai:batch:validate` - pass, 50 accepted, 0 rejected, dry-run.
- `npx.cmd prisma validate` voi PostgreSQL-shaped `DATABASE_URL` tam trong process - pass.
- `npm.cmd run db:generate` - pass.
- `npm.cmd run lint` - pass.
- `npm.cmd run build` - pass; sitemap routes van dynamic nen build khong can `DATABASE_URL`.
- `npm.cmd run typecheck` - pass khi chay rieng sau build.

Con bi chan:

- `npm.cmd run db:migrate` fail vi khong reach duoc PostgreSQL tai `localhost:5432`.
- `npm.cmd run seo:audit` fail vi khong reach duoc PostgreSQL tai `localhost:5432`.
- `npm.cmd run pilot:check` fail vi khong reach duoc PostgreSQL tai `localhost:5432`.
- Chua restore drill PostgreSQL/media tren VPS hoac staging.
