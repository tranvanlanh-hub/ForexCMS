# Design: Production Readiness and Scale Checkpoints 31-35

## Checkpoint Order

This change remains sequential:

1. Checkpoint 31 tunes database performance using current query shapes.
2. Checkpoint 32 adds cache/revalidation around public read paths.
3. Checkpoint 33 documents and scripts backup/restore/migration operations.
4. Checkpoint 34 adds error visibility and runtime troubleshooting.
5. Checkpoint 35 runs verification and records readiness.

## Database Indexes

Indexes should match observed query shapes:

- Public content route: market-scoped lookup by content type, status, and slug.
- Sitemap: published active-market content ordered by publication/create time.
- Affiliate resolver: broker/market/language/campaign/status ordered by priority.
- Analytics/admin existing indexes are left mostly unchanged unless the current queries clearly need support.

The existing unique constraints remain authoritative for duplicate protection. New indexes are additive and portable PostgreSQL indexes only.

## Cache Strategy

Public content, sitemap, and affiliate resolver reads may be cached because they only expose published/active data. Admin routes, mutation responses, affiliate click redirects, auth, and private fallback states must stay uncached.

Content and affiliate mutations should invalidate related public cache tags in addition to admin paths. Cache TTLs should be short enough for MVP operations and configurable later without architectural changes.

## Backup and Migration

Backup/restore scripts must rely on environment variables and standard CLIs. They must not hard-code credentials. Media backup should target S3-compatible storage so Cloudflare R2, MinIO, or AWS S3 can be swapped by configuration.

## Observability

Structured logging should emit JSON-like records with timestamp, level, event name, and safe metadata. Logs must not include secrets, raw Authorization headers, cookies, full database URLs, S3 access keys, or affiliate destination URLs. Error boundaries should show safe recovery UI while logs keep operator-visible context.

## Verification

Run lint, build, typecheck, Prisma validation, script syntax checks, available audit scripts, and migration/seed checks when PostgreSQL is reachable. If PostgreSQL is unavailable, record the exact blocked checks.
