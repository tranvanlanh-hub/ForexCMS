# Codex Handoff

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
