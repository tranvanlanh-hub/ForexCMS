# Spec: Production Operations

## Muc tieu

Giup Forex CMS van hanh an toan khi chuan bi scale len 4.000+ URL, gom performance, cache, backup/restore, monitoring/logging, va production readiness.

## Requirements

- He thong phai co index PostgreSQL phu hop cho public content lookup, sitemap published content query, va affiliate resolver.
- Cache chi duoc ap dung cho public published/active data.
- Admin/private/auth/mutation responses va affiliate click redirects khong duoc public-cache.
- Mutations lien quan content, broker, va affiliate link phai co revalidation strategy.
- Backup PostgreSQL va media S3-compatible phai co checklist/script khong hard-code credential.
- Migration tu Cloudflare/R2 sang VPS Linux phai giu kien truc portable va PostgreSQL la database chinh.
- Runtime logging phai structured va khong log secrets.
- Public/admin error fallback phai hien thi thong bao an toan.
- Production readiness review phai ghi ro muc san sang va viec con lai truoc khi tao 4.000 bai that.

## Acceptance criteria

- Prisma schema va migration co index bo sung cho query scale-critical.
- Sitemap van chia chunk va san sang cho 4.000+ URL.
- Public content, sitemap, va affiliate resolver cache co TTL/tag ro rang.
- Admin/private data khong bi cache public.
- Backup/restore scripts yeu cau env vars thay vi credential hard-code.
- Error boundary/fallback ton tai cho public va admin.
- Lint, build, typecheck, Prisma validate, va audit scripts duoc chay hoac ghi ro ly do bi chan.

## Constraints

- Khong dung Cloudflare D1 cho core CMS.
- Khong doi public URL architecture.
- Khong production deploy neu chua co user xac nhan.
- Khong log `DATABASE_URL`, admin password, S3 keys, Authorization header, cookies, hoac affiliate destination URL.

## Implementation note 2026-09-10 - Checkpoints 31-35

Change `openspec/changes/020-production-readiness-scale/` adds targeted PostgreSQL indexes for public content lookup, sitemap ordering, and affiliate resolver lookup.

It adds tag-based caching for public content, sitemap page counts/chunks, and affiliate resolver reads. Content mutations revalidate public content and sitemap caches; broker/affiliate mutations revalidate resolver cache, with broker changes also revalidating public content because broker facts can render publicly.

It adds `docs/BACKUP_RESTORE_VPS.md`, `docs/PRODUCTION_READINESS.md`, and scripts for PostgreSQL backup/restore plus S3-compatible media backup. Scripts require environment variables and do not store credentials.

It adds basic structured logging in `lib/observability/logging.ts`, plus public and admin error boundaries.

## Implementation note 2026-09-10 — Checkpoints 36–40

Change 021 records sequential repository, Neon, real preview HTTP and launch/content planning evidence. Operational reviews must distinguish command success from report findings, secret presence from value verification, technical preview readiness from production content readiness, and checklist preparation from completed launch gates.

- Preserve previous uncommitted changes; ignore generated logs/cache/build output and private snapshots.
- Verify committed migration checksums and existing seed before modifying shared Neon; use migrate deploy only for pending migrations, never dev/reset on deployed databases.
- SEO audit loads local environment like pilot check and returns failure when issues remain.
- Verify real rendered internal links and authenticated/unauthenticated admin behavior, not only database rows or HTTP 200.
- Direct database repairs require private before-snapshots, revisions, scope validation and public verification after cache refresh. Do not assume direct writes invalidate application caches.
- Production requires real reviewed content, strong credentials, correct domain/runtime variables, full backup/restore evidence and explicit owner deploy approval. A legacy remote Worker must be audited separately from preview; current source config alone does not prove its remote bindings.
- Content growth stays in draft batches at most 50, with reviewed publication and explicit technical/indexing stop gates. Numeric publishing targets are internal plans, not ranking guarantees.

No application architecture, URL pattern or storage boundary changed. Preview uses Neon PostgreSQL; the legacy root Worker's remote D1 binding was observed and left untouched pending a reviewed production configuration.
