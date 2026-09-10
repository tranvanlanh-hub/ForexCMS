# Tasks

- [x] Read handoff, roadmap, OpenSpec project/product/tech/structure, all specs, and recent changes.

## Checkpoint 31 - Performance and Database Index

- [x] Review current public content, sitemap, affiliate resolver, and admin/audit query shapes.
- [x] Add justified PostgreSQL/Prisma indexes for content lookup, affiliate resolver, and sitemap published content queries.
- [x] Check basic N+1 risks and fix only clear issues.
- [x] Run relevant schema/static checks before continuing.

## Checkpoint 32 - Cache Strategy and Sitemap Scale

- [x] Add or standardize public content cache.
- [x] Add or standardize sitemap cache for 4,000+ URL chunks.
- [x] Add broker/affiliate resolver cache where safe.
- [x] Add revalidation strategy for content, broker, and affiliate mutations.
- [x] Confirm admin/private data is not public-cached.

## Checkpoint 33 - Backup/Restore and Cloudflare-to-VPS Migration

- [x] Add PostgreSQL backup and restore checklist/script.
- [x] Add S3-compatible media backup checklist/script.
- [x] Add VPS Linux restore and env migration documentation.
- [x] Confirm no credentials are hard-coded.

## Checkpoint 34 - Monitoring, Logging, and Error Visibility

- [x] Add server error boundary.
- [x] Add admin error fallback.
- [x] Add basic structured logging helper and safe usage on runtime errors.
- [x] Add deploy/runtime troubleshooting docs.
- [x] Confirm secrets are not logged.

## Checkpoint 35 - Production Readiness Review

- [x] Run lint.
- [x] Run build.
- [x] Run typecheck.
- [x] Run tests if present.
- [x] Run audit scripts if present.
- [x] Run Prisma validation and migration checks where possible.
- [x] Create remaining checklist before 4,000 real posts.
- [x] Update long-lived specs.
- [x] Update `docs/CODEX_HANDOFF.md`.
- [x] Update `docs/ROADMAP.md`.

## Verification Notes

- `node --check scripts/backup-postgres.mjs` passed.
- `node --check scripts/restore-postgres.mjs` passed.
- `node --check scripts/backup-media.mjs` passed.
- `node --check scripts/seo-audit.mjs` passed.
- `node --check scripts/validate-ai-batch.mjs` passed.
- `npm.cmd run content:audit` passed with 0 errors and 0 warnings.
- `npm.cmd run ai:batch:validate` passed in dry-run mode with 50 accepted and 0 rejected.
- `npx.cmd prisma validate` passed with a temporary PostgreSQL-shaped `DATABASE_URL`.
- `npm.cmd run db:generate` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed. The sitemap routes remain dynamic and no longer require `DATABASE_URL` at build time.
- `npm.cmd run typecheck` passed when run after build. Running it in parallel with build can race on `.next/types`.

## Blocking Notes

- `npm.cmd run db:migrate` was attempted with `postgresql://user:password@localhost:5432/forexcms` and failed because no PostgreSQL server was reachable.
- `npm.cmd run seo:audit` was attempted with the same local PostgreSQL URL and failed because no PostgreSQL server was reachable.
- `npm.cmd run pilot:check` was attempted with the same local PostgreSQL URL and failed because no PostgreSQL server was reachable.
- No production deploy was performed.
