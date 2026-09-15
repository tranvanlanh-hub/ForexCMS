# Codex Handoff

## Broker Manager documentation — 2026-09-15

- Added `docs/BROKER_MANAGER.md` as the focused long-term guide for Broker data
  ownership, editable fields, 36-broker import behavior, editorial workflow,
  frontend-link rules and production verification.
- Updated `docs/ARCHITECTURE.md` with the current VPS/PostgreSQL deployment and
  Broker/ContentItem boundary; updated `docs/ROADMAP.md` with completed Broker
  production work and the remaining public-review/profile-route distinction.
- Documentation-only update; no code, database, migration or deployment change.

## Broker list Frontend column — 2026-09-15

- Deployed source commit `c1263b8f` as active release
  `/var/www/marketgb/releases/20260915152450`.
- Broker Manager now has a `Frontend` column. It opens the newest linked,
  published `BROKER_REVIEW` in a new tab and shows `No page` when none exists.
  It never constructs a guessed URL, links to a draft, or exposes content based
  only on Broker status.
- Production currently has 36 brokers but zero linked published broker reviews,
  so all 36 rows correctly show `No page` until review content is created,
  linked and published.
- Verified local lint (0 errors), typecheck, production build and diff check;
  production root/login/public HTTP checks pass, broker route retains its 307
  unauthenticated redirect, deployed bundle contains the new state, and recent
  service journal has no errors. No database or migration change was made.

## Broker Manager production deploy + 36 draft brokers — 2026-09-15

**Đây là trạng thái production hiện hành.** Broker profile/review inputs đã được
deploy lên VPS và 36 broker nghiên cứu đã được chèn trực tiếp vào PostgreSQL để
owner tiếp tục cập nhật trong admin.

- Release active: `/var/www/marketgb/releases/20260915151204`, corresponding to
  source commit `f3d6324b` on `main`/`origin/main`.
- Migration `202609150900_broker_profile_review_fields` đã apply; production có
  12 migration hoàn tất.
- Dataset nguồn: `data/brokers/research-20260915.json`. Lệnh import:
  `npm run brokers:import -- --apply`; mặc định không có `--apply` chỉ lập kế
  hoạch. Import chỉ tạo slug còn thiếu và chỉ điền ô trống/demo trên row đã có,
  không ghi đè dữ liệu thật mà editor đã sửa.
- Production hiện có đúng 36 broker, priority 1–36 và 36 giá trị priority khác
  nhau. Cả 36 ở trạng thái `DRAFT`; không có rating nào được tự điền.
- Trước thay đổi đã tạo backup
  `/var/backups/marketgb/forex_cms-before-broker-import-20260915.dump` trên VPS
  và tải bản tương ứng về `backups/postgres/` (ignored). SHA-256 hai bản khớp.
- Đã verify Prisma validate/generate, JSON/script syntax, typecheck, ESLint
  (0 error; warning cũ), Next production build và `git diff --check`.
- Smoke production: loopback `/` 200, `/admin/login/` 200, broker list/create
  không session redirect 307 về login, `https://marketgb.com/` 200. Bundle deploy
  có label field mới và journal không có error mới trong cửa sổ kiểm tra.
- Chưa publish broker, chưa tạo affiliate link/BrokerFact mới và chưa chấm điểm.
  Rollback app có thể trỏ lại release `20260915080105`; migration chỉ thêm cột
  nullable/default nên tương thích với release trước. Khôi phục dữ liệu chỉ dùng
  backup nếu có yêu cầu riêng và phải theo quy trình restore đã duyệt.

## Broker research workbook — 2026-09-15 (local editorial artifact)

- Created `outputs/broker-research-20260915/marketgb-broker-research-36.xlsx`
  for all 36 prioritized brokers. It maps the new English Broker Manager fields
  to official-source findings and clearly labelled reference data.
- Each broker row includes priority/tier, identity and contact fields, founded
  year/headquarters where available, jurisdiction/editorial notes, two source
  URL slots, retrieval date, and the complete set of rating fields.
- Rating fields remain intentionally blank until a reproducible editorial
  scoring methodology is approved. The workbook includes a `Field Guide` sheet
  explaining field purpose, validation and publication risks.
- Verified by re-opening/inspecting the generated workbook, scanning for common
  formula errors, and rendering both sheets to PNG for visual review. No
  database seed, migration or production deployment was performed.

## Broker profile and review fields — 2026-09-15 (local only)

**Đây là thay đổi source hiện hành nhưng chưa deploy hoặc migrate production.**
Change `openspec/changes/028-broker-profile-review-fields/` mở rộng Broker
Manager để quản lý dữ liệu review bằng label tiếng Anh.

- `Broker` có thêm editorial `priority`; founded year; headquarters country và
  address; support email, phone/hotline, contact page; đồng thời form giờ expose
  cả `legalName` và `websiteUrl` đã có từ trước.
- Có 10 score tùy chọn theo thang 0–5: overall, trust & safety, commissions &
  fees, research & education, trading tools, trading platforms, customer
  support, account types, special features và account opening. Có thêm rating
  summary và review date để ghi rationale/thời điểm đánh giá.
- Server action kiểm tra URL, email, phone, priority, founded year, date, độ dài
  và score; migration cũng có database check constraints cho priority/year/range
  score. Broker list sort theo priority và hiện overall rating/contact
  completeness.
- Factual/legal/trading claims vẫn là sourced `BrokerFact`; affiliate destination
  vẫn chỉ nằm trong `AffiliateLink`. Change này chưa đổi public review renderer.
- Migration mới: `202609150900_broker_profile_review_fields`. Chưa apply lên VPS;
  production vẫn ở 11 migration và database trống như mục verification bên dưới.
- Đã pass Prisma validate/generate, typecheck, full-repo ESLint, targeted ESLint
  cho toàn bộ file Broker thay đổi, production build và `git diff --check`.
  ESLint có override hẹp cho `*.cjs` vì hai script vận hành CommonJS bắt buộc
  dùng `require()`; warning ảnh/unused cũ và build warning dynamic filesystem còn.

## VPS production verification — 2026-09-15

**Đây là trạng thái hiện hành và bổ sung cho mục cutover 2026-09-14 bên dưới.**
Đã kết nối SSH thành công tới `45.77.32.116` bằng key do owner cung cấp, với
user `root`; không lưu key hoặc credential vào repo/tài liệu/log. Tệp key gốc ở
máy Windows có ACL quá rộng nên OpenSSH từ chối; phiên kiểm tra dùng một bản tạm
có ACL chỉ cho owner và không sửa tệp gốc.

### Trạng thái đã xác minh trên VPS

- Hostname `vultr`, Ubuntu 24.04, kernel `6.8.0-139-generic`; thời điểm kiểm tra
  uptime khoảng 1 ngày 2 giờ.
- Node `v22.23.2`, Caddy `v2.8.4`, PostgreSQL `16.15`. Ba service
  `marketgb-web`, `caddy`, `postgresql` đều `active`; không thấy log mức error
  của `marketgb-web` kể từ lần restart release hiện tại.
- Release active là `/var/www/marketgb/releases/20260915080105`, được systemd
  đưa vào trạng thái active lúc `2026-09-15 08:48:53 UTC`. VPS đang giữ 5
  release. Release này tương ứng với source sửa Prisma connection leak được
  commit ngay sau deploy thành `d3083866` trên `main`/`origin/main`.
- Fix `d3083866` thay Prisma client theo request bằng singleton process-level.
  Trong lần xác minh này, số connection của role app giữ nguyên 4 trước và sau
  10 request liên tiếp (PostgreSQL `max_connections=100`), không tái hiện tăng
  connection theo request.
- Tài nguyên: RAM 1.9 GiB, available khoảng 1.4 GiB; swap 2.0 GiB gần như chưa
  dùng; filesystem root 52 GiB, dùng 12 GiB (25%), còn 37 GiB.
- Database `forex_cms` có 11 migration hoàn tất. Hiện có 0 `ContentItem`, 0 bài
  published và 0 `MediaAsset`; đây là production database trống, không phải bộ
  16 bài pilot trước đây ở Neon/preview.
- HTTP từ app loopback `127.0.0.1:3000`, qua Caddy, và HTTPS public đều trả
  `200` cho `/`. Public HTTPS cũng trả `200` cho `/admin/login/`, `/robots.txt`
  và `/sitemap.xml`. `/admin/` không có session trả `307` về trang login.

### Trạng thái local đã đối chiếu

- Workspace sạch tại `d3083866`; `main`, `origin/main` và `origin/HEAD` cùng trỏ
  commit này.
- Không migration/data/config/secret nào bị thay đổi trên VPS trong lần kiểm tra.
  Thay đổi duy nhất ở workspace là cập nhật handoff này bằng dữ kiện read-only.

## VPS production cutover — 2026-09-14

**Đây là trạng thái hiện hành. Mục này thay thế các ghi chú cũ nói rằng production
chưa được deploy, admin còn dùng Basic Auth, hay production còn chạy trên
Cloudflare Worker.**

### Kiến trúc hiện tại

- `https://marketgb.com` và `https://www.marketgb.com` được Cloudflare proxy tới
  Vultr VPS tại Singapore (Ubuntu 24.04, 1 vCPU, 2 GB RAM, 55 GB SSD, 2 GB swap).
  Caddy 2.8.4 terminate TLS bằng Cloudflare Origin CA cert và reverse_proxy sang
  Next.js `node start` trên `127.0.0.1:3000`. Cloudflare SSL/TLS mode phải để
  **Full (strict)** để verify Origin CA chain.
- Runtime source đã được refactor từ Cloudflare Workers + Neon adapter + S3 về
  Node native: Prisma Node client, schema `binaryTargets = ["native",
  "debian-openssl-3.0.x"]`, media lưu local filesystem dưới
  `/var/www/marketgb/shared/uploads/yyyymm/...`. Upload đi qua PUT tới
  `/api/admin/media/upload` với HMAC-signed URL (`MEDIA_UPLOAD_SIGNING_SECRET`,
  TTL mặc định 300s, max 8 MiB).
- DB là PostgreSQL 16 local, không còn Neon. Schema, migrations, seed và admin
  account được tái tạo qua `prisma migrate deploy` + `scripts/setup-admin-env.cjs`.
  Auth secrets mới (PEPPER + ENCRYPTION_KEY) do owner tạo; account cũ của Neon
  không tồn tại trên VPS DB.
- Cloudflare Worker `content-hub-cms` (Workers Free, version cũ) vẫn còn, không
  còn custom domain và không nhận traffic. Giữ nguyên ít nhất 1 tuần làm rollback
  target.

### File trên VPS (tham chiếu, không commit secret)

| Path                                      | Vai trò                                                |
|-------------------------------------------|--------------------------------------------------------|
| `/etc/marketgb/app.env`                   | Env runtime (DB URL, PEPPER, ENCRYPTION_KEY, signing), `0640 root:marketgb` |
| `/etc/caddy/Caddyfile`                    | `:80` reverse_proxy + `/uploads/*` file_server, `:443` TLS với Origin CA |
| `/etc/caddy/ssl/origin.pem`               | Origin certificate (`0640 root:caddy`)                 |
| `/etc/caddy/ssl/origin.key`               | Origin private key (`0640 root:caddy`)                 |
| `/etc/systemd/system/marketgb-web.service`| Systemd unit (User=marketgb, `ProtectSystem=strict`)    |
| `/var/www/marketgb/releases/<ts>/`        | Bản build; symlink `/var/www/marketgb/current` trỏ vào release mới nhất |
| `/var/www/marketgb/shared/`               | Uploads + `resolve-prisma-hook.cjs` load qua `node --require` |
| `/var/www/marketgb/shared/uploads/`       | Media theo tháng `yyyymm/assetId/...`                  |
| `/var/www/marketgb/logs/`                 | Log Next.js, xem qua `journalctl -u marketgb-web`      |

`scripts/marketgb-web.service`, `scripts/marketgb.caddy`,
`scripts/resolve-prisma-hook.cjs`, `scripts/setup-admin-env.cjs` đã được lưu
trong repo (không chứa secret).

### Build + deploy flow

1. Local `npm run build` (Turbopack). Bundle đã thử `output: "standalone"` nhưng
   revert vì Turbopack externalize Prisma với id `@prisma/client-<hash>`, runtime
   không resolve được — workaround là `scripts/resolve-prisma-hook.cjs` loaded
   qua `node --require` trong unit systemd.
2. Rsync artifact từ local lên `/var/www/marketgb/releases/<ts>/` (Node modules,
   `.next/standalone`, `.next/static`, `public/`, `prisma/`). Không push `.env`
   hay `.env.local`; secrets ở `/etc/marketgb/app.env`.
3. `prisma migrate deploy` chạy trong release mới (nếu có migration mới).
4. Symlink `/var/www/marketgb/current` → release mới; `systemctl restart
   marketgb-web`.
5. `systemctl reload caddy` (chỉ khi Caddyfile đổi).

Rollback: `ln -sfn /var/www/marketgb/releases/<previous-ts> /var/www/marketgb/current
&& systemctl restart marketgb-web`. Giữ ít nhất 2 release gần nhất.

### Smoke test đã chạy sau cutover

- `https://marketgb.com/` → `200` (qua Cloudflare → Caddy → Next)
- `https://www.marketgb.com/` → `200`
- `/admin/login/` → `200`
- `/admin/` (no session) → `303` → `/admin/login/`
- `/robots.txt` → `200`
- `/sitemap.xml` → `200`
- Direct VPS `http://45.77.32.116/` → `200`
- Direct VPS `https://45.77.32.116/` → `200` (Origin CA)
- DB-backed admin đăng nhập + TOTP thành công (account tạo qua
  `setup-admin-env.cjs`, recovery codes lưu tại owner local).
- `pg_dump` đầu tiên từ VPS về `backups/forex_cms-20260914.dump` (ignored).
- Worker `content-hub-cms` vẫn nhận `*.workers.dev`; domain `marketgb.com` đã bỏ
  custom domain binding trong dashboard → Cloudflare DNS A record là nguồn
  truth, đã trỏ `45.77.32.116` proxied cho cả `marketgb.com` và `www`.

### Việc cần làm tiếp (không liên quan code, không commit)

- Trong Cloudflare dashboard: set **SSL/TLS → Full (strict)**, bật
  **Always Use HTTPS**, bật **HTTP/2 to Origin**, bật HSTS sau khi confirm
  strict ổn. API token hiện thiếu `Zone Settings:Edit` nên phải làm thủ công.
- Owner cần thay demo data thật (broker facts, affiliate URLs, content) trước
  khi tính traffic. Không tính 16 bài pilot là production content.
- Lên lịch backup Postgres định kỳ (`scripts/backup-postgres.mjs` đã có sẵn
  trong repo, hỗ trợ custom output).
- Sau 1 tuần ổn định: xóa Cloudflare Worker `content-hub-cms` và route custom
  domain cũ trong account.

### Ghi chú kỹ thuật cần giữ khi build/deploy tiếp

- Không quay lại `output: "standalone"` cho tới khi đã giải quyết xong Turbopack
  Prisma hash. Hook hiện đang là cách chính xác nhất để giữ runtime resolve.
- Không commit `/etc/marketgb/app.env`, `/etc/caddy/ssl/*`, hay
  `/var/www/marketgb/shared/uploads/`.
- Worker `content-hub-cms` không được tự redeploy/xóa trong tuần đầu; nó là
  fallback nếu rollback toàn bộ sang Cloudflare.
- Không đổi PBKDF2 vòng lặp (100.000) — cả runtime và setup phải khớp.

## Production handoff — marketgb.com — 2026-09-14 (VPS)

**Mục này tóm tắt thay đổi runtime + content + admin từ lúc còn chạy trên
Worker cho tới khi cắt sang VPS.**
- Nhánh phát hành là `main`. Commit production gần nhất: `337e85a` (docs VPS
  architecture), `2702989` (production content publishing), `9fdae76` (form
  Cloudflare — không còn dùng), `7e9e5fb` (content tối thiểu + SEO tùy chọn),
  `4880c23` (production editor fix).
- Admin production dùng account database-backed PBKDF2 SHA-256 (100.000 vòng) +
  AES-GCM encrypted TOTP + 10 recovery codes. Account được tạo lại trên VPS qua
  `scripts/setup-admin-env.cjs` (env `ADMIN_USERNAME`/`ADMIN_PASSWORD` do owner
  cung cấp qua kênh riêng; secret không có trong repo/log).
- Lỗi `/admin/content/` với `This admin view failed` trước đây do mỗi Prisma
  operation tạo một Neon client riêng trên Worker. Runtime hiện tại (Node native)
  chỉ có một `NodePrismaClient` được wrap bằng React `cache()` cho mỗi request,
  Proxy pattern giữ call sites không đổi. Không còn giới hạn I/O chéo request vì
  đã chuyển khỏi Workers.
- Content create/update chỉ bắt buộc `title` và `body`. Slug tự sinh (có hỗ trợ
  bỏ dấu tiếng Việt và hậu tố khi trùng); market/content type/template lấy mặc
  định tương thích; SEO title lấy title và meta description lấy đoạn văn bản từ
  body khi để trống. Taxonomy, ảnh, author/reviewer, translation group và broker
  đều tùy chọn, kể cả khi publish.
- URL Redirect Manager, Taxonomy Manager (Category cha-con tối đa 3 cấp, Topic,
  Topic Cluster và gắn taxonomy vào content) và Media Manager đều đã chạy trên
  VPS DB. Media Manager giờ dùng filesystem local thay vì S3/R2 — không cần
  bucket, CORS hay lifecycle.
- Upload media chạy qua `POST /api/admin/media/upload-intent` (HMAC-signed URL)
  → `PUT /api/admin/media/upload?key=&exp=&sig=` với raw body. Body ≤
  `MEDIA_MAX_UPLOAD_BYTES` (mặc định 8 MiB). File ghi vào
  `<MEDIA_LOCAL_ROOT>/pending/<assetId>` rồi finalize move sang
  `<MEDIA_LOCAL_ROOT>/yyyymm/<assetId>/original.<ext>`.
- Content/broker editor chỉ chọn asset `READY`. Public article render featured
  image + OG/Twitter image metadata.
- `.env.local` và `.env.cloudflare` là file private/ignored. Không commit, không
  in token/credential vào log hoặc handoff. Token Cloudflare hiện đủ edit
  DNS zone nhưng thiếu `Zone Settings:Edit` (SSL mode) và `Origin CA:Edit`
  (tạo cert qua API). Cả hai đều làm thủ công trong dashboard hoặc cấp thêm
  scope cho token.
- Worker `content-hub-cms` không còn custom domain; nó vẫn nhận
  `content-hub-cms.content-hub-stack.workers.dev` với bundle cũ. Không tự
  redeploy/xóa trong tuần đầu — dùng làm fallback khi rollback toàn bộ.

### Việc cần kiểm tra trước go-live nội dung thật

- Thay dữ liệu broker/affiliate/demo còn placeholder bằng dữ liệu đã duyệt;
  không coi pilot là nội dung tài chính đã sẵn sàng xuất bản.
- Xác nhận backup/restore Postgres trên VPS (`scripts/backup-postgres.mjs` và
  `scripts/restore-postgres.mjs` đã có trong repo).
- Sau mỗi deploy, kiểm tra login, `/admin/content/`, public article, redirect
  308, sitemap, `/uploads/...` cache HIT, và `journalctl -u marketgb-web` xem có
  lỗi I/O.

## Taxonomy Manager — 2026-09-13

- Change 026 adds `/admin/taxonomy` for three-level Category trees, Topics and
  Topic Clusters. It supports create/edit/status, safe deletion when unused,
  market filtering, usage counts and dependency-aware controls.
- Content create/edit now stores primary and related category/topic relations in
  the existing content transaction. New publish transitions require an active
  primary category. Existing 16 published records are grandfathered so editorial
  edits remain possible; the editor shows a taxonomy warning until backfilled.
- AI Import accepts existing category/topic slugs in the draft market and never
  auto-creates taxonomy. Internal-link cluster loading now requires ACTIVE status.
- Audit before migration: 0 categories, 6 topics, 4 clusters, 17 content items;
  16 published items lack primary category and none lack primary topic.
- Migration `202609130300_taxonomy_manager` was applied to configured Neon.
  Prisma validate/generate, lint, typecheck, Next build and safe Vinext build pass.
  Transactional DB smoke created a three-level tree and content assignments, then
  rolled back cleanly (0 smoke rows). Authenticated browser checks passed for all
  three manager views and the taxonomy panel in the content editor.

## URL Redirect Manager — 2026-09-13

- Change 025 adds `ContentUrl`, claims every canonical path, and keeps published
  historical paths as permanent redirects to the latest canonical URL. Redirects
  do not expose draft/archived content or inactive markets.
- `/admin/url-routing` lists URL ownership, supports search/filter/pagination,
  same-market/type manual aliases, and enable/disable controls with auth/CSRF.
  The content editor shows redirect history and explains automatic redirects.
- Migration `202609130200_url_redirect_manager` was applied to the configured Neon
  database and backfilled 17 current paths (16 marked published).
- Prisma validation/generation, lint, typecheck, Next build and safe Vinext build
  pass. Local HTTP smoke passed: old alias 308 with the exact canonical Location,
  canonical 200, disabled/draft aliases 404, and unauthenticated admin 307. All
  temporary smoke records were removed; the registry remains at 17 rows.

## MarketGB official identity — 2026-09-13

- The owner approved MarketGB as the official brand and `MarketGB.com` as the
  primary domain. English is the canonical brand and public-product language.
- Official tagline: `Insights for a brighter tomorrow.` Brand values: clarity,
  independence, progress, and responsibility.
- Canonical guidelines live in `docs/BRAND_GUIDELINES.md`; approved web assets
  live in `public/brand/marketgb/`. Earlier rejected design explorations were
  removed.
- Public header/footer, homepage messaging, root metadata, Open Graph/Twitter
  image, favicon, SEO site name, admin shell, login screens, seed editorial names,
  and package identity were updated to MarketGB.
- The approved logo source is raster PNG. Obtain the designer's SVG/AI/EPS master
  before professional print production or trademark filing.

## Single-admin password + TOTP login — 2026-09-13

- Current source replaces browser Basic Auth with one database-backed admin
  account, PBKDF2 password hashing, AES-GCM encrypted TOTP, one-time recovery
  codes, revocable 30-minute-idle/8-hour-absolute sessions, throttling, security
  events, same-origin checks, and session-bound CSRF tokens on every admin mutation.
- Added `/admin/login` and `/admin/login/verify`; unauthenticated `/admin/**`
  redirects to login. Proxy strips spoofable auth headers, while the layout and
  actions perform secure database checks. Admin responses include CSP/frame and
  Cloudflare CDN no-store protections.
- Operator workflow is in `docs/ADMIN_AUTH.md`: generate independent secrets,
  apply migration `202609130100_admin_authentication`, then run interactive
  `npm run admin:setup` to scan a QR and save offline recovery codes.
- Added a safe Vinext build wrapper after detecting that raw Vinext automatically
  loaded `.env.local`. The wrapper hides it during build, restores it on failure,
  and scans `dist` for known local secret values. Rebuilt output contains none of
  the checked local database/admin secrets.
- Prisma validate/generate, lint, typecheck, Next build, Vinext build, npm audit,
  script syntax, diff whitespace, login page HTTP 200, unauthenticated admin 307,
  CSP/frame denial, and CDN no-store checks pass. Existing Prisma broad-pattern
  warning remains. Browser Cache-Control in Next dev is `no-cache,
  must-revalidate`; CDN headers explicitly use `no-store`.
- No migration was applied, no admin account/secret was created, and nothing was
  deployed. Existing uncommitted Template Manager/Content Manager work was preserved.

## Product completeness audit + Template Manager — 2026-09-13

- Owner làm rõ rằng cần rà phần sản phẩm chưa hoàn thiện và phát triển tiếp,
  không chỉ xử lý launch checklist. Đã gỡ toàn bộ change noindex làm lệch ý trước
  đó; không deploy hoặc thay dữ liệu.
- Inventory hiện hành nằm ở đầu `docs/ROADMAP.md`. Các khoảng trống lớn còn lại:
  taxonomy/content assignment, revision UI/restore, URL redirects, dashboard
  thật, bulk AI import, media manager, template-specific public pages, settings
  và multi-user roles.
- Hoàn tất `openspec/changes/023-template-manager/`: `/admin/templates` có danh
  sách database-backed, số content đang dùng, create/edit, active state, kind,
  allowed/required blocks, schema, CTA và internal-link slots.
- Validation chặn block/schema/CTA không hỗ trợ, required block nằm ngoài
  allowed blocks, CTA slot thiếu CTA block, và đổi kind của template đang được
  content sử dụng. Content save cũng chặn template kind không khớp content type;
  edit content vẫn giữ được template hiện tại nếu template đã inactive.
- Route list/new/edit có auth trả 200 với dữ liệu Neon; thiếu auth trả 401. Không
  ghi hoặc thay template khi kiểm tra. Lint, typecheck, Next build và Vinext
  build đều đạt; warning Prisma WASM broad-pattern cũ còn.
- Localhost tiếp tục chạy tại `http://localhost:3000`. Không commit/push/deploy.

## Cloudflare preview UI deploy — 2026-09-10

- Commit `9dead2d` deploy lên `content-hub-cms-preview` thành công, version
  `4d1c601e-c446-497a-ac75-0fec4c994d1c` tại
  `https://content-hub-cms-preview.content-hub-stack.workers.dev`.
- Bundle được build khi tách `.env.local` và đã quét lại: không có giá trị local
  bị nhúng. Preview vẫn có `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
  trong Cloudflare secret store.
- Smoke đạt: homepage/robots/sitemap/chunk 200, 16/16 URL sitemap 200,
  canonical đúng preview origin, admin không auth 401/có auth 200, affiliate
  redirect cuối 302 có Location.
- Chưa có custom domain nên chưa launch production SEO. Worker legacy
  `content-hub-cms` đã được trả về version
  `61921371-c388-4d55-9282-4958bcb298aa`; version build nhầm có local env đã
  bị xóa. Version sạch `9fc85adb-6f6d-4116-a464-cea638927169` chỉ là inactive,
  không nhận traffic.

## Localhost 404/cache fix — 2026-09-10

- Fixed the reported false 404 on published content routes. The old local dev
  process could not reach Neon and cached the resulting null lookup.
- Public data caches are now bypassed in development so edits and recovered DB
  connections appear immediately. Preview/production caching is unchanged.
- Database lookup failures now throw instead of being converted to a cacheable
  not-found result; genuinely missing or draft content still returns 404.
- Restarted localhost with Neon access. Verified all 16 sitemap content URLs,
  comparison, sitemap, and authenticated admin routes return 200. The pilot
  draft still returns the expected 404; unauthenticated admin still returns 401.
- Lint, typecheck, and production build pass. The existing Prisma WASM build
  warning remains. No data, migration, secret, or deployment was changed.
- Suppressed root hydration warnings caused by browser extensions injecting
  attributes into `html`/`body`; the local dev error badge is no longer shown.

## UI/UX RESCUE — 2026-09-10

- Hoàn tất sprint UI theo yêu cầu mới: homepage Forex Journal với header/nav/hero/broker/education/guide sections; bỏ copy kỹ thuật. Link tới các bài hiện có, không tạo bài hoặc backend mới.
- Public article: typography và chiều rộng đọc mới, byline/thời gian đọc, mục lục sidebar desktop và inline mobile, FAQ/CTA/facts rõ hơn; header/footer đồng bộ cả comparison. Ngày updated được chuẩn hóa từ Date/string để render đúng cả khi đọc cache.
- Admin: sidebar chia nhóm, active state rõ, menu mobile; content editor có body 680px, publishing/SEO/route/editorial/template/broker panels, checkbox broker và pending save. Giữ nguyên tất cả field names, server actions, auth và validation.
- Đã chạy lint/build/typecheck thành công; warning Prisma WASM cũ còn. Đã chụp/kiểm tra homepage, article và editor có dữ liệu Neon ở desktop/mobile 390px; không tràn ngang, anchor TOC đúng, body 680px. Article HTTP 200 ở hai lần đọc liên tiếp sau sửa Date/string. Không thử lưu/publish nội dung Neon trong sprint.
- Đã commit và deploy lên preview theo mục trạng thái ở đầu tài liệu; không mở roadmap mới. Các blocker launch production về dữ liệu demo, domain, backup và credentials production chưa được sprint UI này giải quyết. Nhận xét homepage shell trong báo cáo readiness trước đây đã được thay thế bởi giao diện mới trên preview.
- Code sửa/thêm: app/(public)/page.tsx; app/(public)/[market]/[contentType]/[slug]/page.tsx; app/(public)/[market]/compare/[pair]/page.tsx; app/admin/content/content-form.tsx; app/admin/layout.tsx; app/globals.css; app/layout.tsx; components/admin/admin-navigation.tsx; components/admin/save-content-button.tsx; components/public/site-chrome.tsx; components/public/template-block-renderer.tsx; components/public/affiliate-cta.tsx.
- Spec ngắn của sprint: openspec/changes/022-ui-ux-rescue/{proposal,design,tasks}.md. docs/ROADMAP.md và docs/PRODUCTION_READINESS.md có thay đổi từ phiên trước, được giữ nguyên trong sprint này.


## FINAL LAUNCH READINESS CHECK — 2026-09-10

**Dừng roadmap nhiều phiên tại đây. Không có phiên 41/42/43 hoặc chuỗi công việc mới. Chưa thể launch production nhỏ nguyên trạng.** Mục này thay thế mọi trạng thái và gợi ý việc tiếp theo trong lịch sử bên dưới.

- Git đầu phiên sạch tại commit 09a320eb. Phiên này chỉ sửa ba tài liệu handoff/roadmap/readiness; không đổi code, commit, push hay deploy. File generated do build đã trả về nguyên trạng.
- Lint, typecheck, Next build và Vinext build đạt. Next có warning Prisma WASM import rộng; Vinext có lỗi ghi log ngoài sandbox nhưng build hoàn tất, exit 0.
- Scan file Git hiện tại và toàn bộ 3 commit (257 historical blobs; tổng 464 lượt file): không thấy credential đang dùng hoặc mẫu secret phổ biến. .env.local/.env.cloudflare đều ignored. Đây là kiểm tra trong phạm vi, không bảo đảm mọi loại secret.
- Neon reachable khi chạy ngoài sandbox: migrate status báo đủ 7 migration, schema up to date; pilot 16 published, 18 affiliate active, 16 internal links; SEO audit 16 bài, 0 issues. Không migrate/seed lại vì dữ liệu đã tồn tại.
- Preview: 16 bài có HTTP 200, canonical đúng preview origin, một H1; sitemap 16 URL; comparison 200, draft 404; redirect thử nghiệm 302/no-store, không follow destination. Thiếu/sai auth 401; các trang admin content/new, affiliate, SEO và dashboard có auth 200/no-store.
- Blocker runtime thật: /admin/brokers/ có auth trả 503 lặp lại. Cloudflare tail xác nhận outcome exceededCpu, Worker exceeded CPU time limit. Biến thể query trả 200 không được xem là đã sửa. Cần xử lý CPU/runtime hoặc tối ưu đúng nguyên nhân rồi kiểm tra URL gốc trước launch; không tự đổi gói dịch vụ/deploy.
- Blocker dữ liệu: 9/9 broker fact sources là example.com; SampleFX/Example Markets là giả; 18/18 affiliate dùng đích test. Homepage còn CMS shell. Không copy nguyên bộ pilot lên production; chỉ đưa nội dung đã duyệt lên public và ẩn dữ liệu demo liên quan.
- Chốt production Worker/Neon, origin HTTPS và APP_ENV/APP_URL, secrets/mật khẩu mạnh; ngăn index preview (hiện index, follow); có điểm khôi phục dữ liệu và kiểm tra lại trên target production trước phát hành. Không cần đủ 20/50/4.000 bài.

Phân loại cuối cùng và bằng chứng: [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md). Báo cáo HTTP bổ sung và log được lưu private trong backups/final-launch-check/ (ignored). Smoke redirect tạo một click thử nghiệm; không sửa nội dung/seed/migration. Chưa thực hiện kiểm thử ghi admin hoặc restore trong phiên này.

## Lịch sử — không phải kế hoạch tiếp tục

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
- Slug tu dong sinh tu title qua `normalizeSlug`; nguoi dung tu khoa khi sua, co nut "Reset to title".
- Featured image va Social sharing image picker co nut upload noi tuyen (goi intent + finalize), khong can mo Media Manager.
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
## Cap nhat 2026-09-13 - Media Manager va S3/R2 upload

Da trien khai change `027-media-manager-s3-upload`:

- Them `MediaAsset`, `MediaVariant`, featured/social image cho content va media logo cho broker.
- Migration `202609130400_media_manager` da apply thanh cong len PostgreSQL.
- `/admin/media` co upload progress, search, month/status filter, metadata edit, usage guard va soft-delete state machine.
- Upload truc tiep bang presigned PUT; server finalize bang HEAD, magic bytes, dimensions, copy sang `uploads/yyyymm/assetId` va verify destination.
- Content editor va broker editor chi chon asset READY; public article render featured image va them OG/Twitter image metadata.
- Da pass Prisma generate, typecheck, lint (0 error), Next production build, safe Vinext build, database relation/rollback smoke va browser UI smoke.

Con lai theo moi truong:

- `.env.local` chua co S3/R2 endpoint, bucket, credentials va public base URL, nen chua the smoke upload/read/delete object that.
- Can cau hinh bucket CORS cho origin admin va lifecycle cleanup prefix `pending/` truoc preview rollout.
