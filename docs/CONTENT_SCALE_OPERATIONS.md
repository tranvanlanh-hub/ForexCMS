# Content Scale Operations

## Checkpoint Gate

Large content generation is allowed only after these checks pass against a real PostgreSQL database:

```text
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run pilot:check
npm.cmd run content:pilot:generate
npm.cmd run content:audit
```

Then smoke test representative public URLs, `/sitemap.xml`, `/sitemaps/content-0.xml`, admin edit pages, and AI Import Manager draft save.

## Sitemap

The app already uses a sitemap index at `/sitemap.xml` and chunked content sitemaps at `/sitemaps/content-N.xml`. The current chunk size is 4,000 URLs through `SITEMAP_URL_LIMIT`.

Keep this pattern for scale. Do not replace it with a single giant sitemap file.

## Cache Strategy

- Public content pages: cache at the CDN with short-to-medium TTL after the database smoke test is stable, then revalidate on admin publish/update.
- Sitemap index: cache briefly because page count changes only when published URL count changes.
- Sitemap chunks: cache longer than the index, with purge/revalidate after publishing batches.
- Admin pages: no public cache.
- Affiliate click route: no cache, because it records click events before redirect.

Suggested starting headers after runtime verification:

```text
public content: s-maxage=300, stale-while-revalidate=3600
sitemap index: s-maxage=300, stale-while-revalidate=3600
sitemap chunks: s-maxage=1800, stale-while-revalidate=86400
admin and affiliate click routes: no-store
```

## Query and Index Baseline

Existing Prisma indexes cover the important MVP paths:

- `ContentItem`: market/status, contentType, publishedAt, canonicalPath, market/contentType/slug.
- `SeoMetadata`: contentItemId, broker/market, canonicalPath.
- `AffiliateLink`: broker/market/campaign/status, languageCode, startsAt/endsAt.
- `InternalLinkSuggestion`: market/language/status, source/status, target.
- `AffiliateClickEvent`: affiliateLink/clickedAt, broker/clickedAt, content/clickedAt, market/campaign/clickedAt.

Before importing 200-500 drafts, check slow queries for content lists, sitemap generation, affiliate resolution, and analytics aggregation.

## Backup Checklist

Database:

- Take a PostgreSQL dump before migrations and before large imports.
- Store at least one offsite backup.
- Verify restore into a staging database.
- Record migration version and seed/import file name.

Media:

- Export or replicate S3-compatible bucket objects.
- Back up media metadata separately from object storage.
- Verify that public media base URL can be reconstructed on VPS Linux.

## Cloudflare Notes

- Use PostgreSQL through `DATABASE_URL`; do not add D1.
- Store `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` as secrets.
- Keep `APP_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, and `S3_PUBLIC_BASE_URL` environment-specific.
- Preview deploy only after explicit confirmation.
- Production deploy only after explicit confirmation.

## VPS Linux Notes

- Run Next.js with Node.js behind Nginx or an equivalent reverse proxy.
- Use PostgreSQL as the primary database.
- Use S3-compatible media storage such as MinIO or external S3-compatible object storage.
- Run migrations before starting the app version that expects the new schema.
- Keep `.env` out of git and rotate credentials after staging tests.
