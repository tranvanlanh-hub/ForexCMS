# Production Readiness Review

## Latest verification — checkpoints 36–40, 2026-09-10

**Preview ready for technical testing; production NOT ready.** This dated assessment supersedes historical readiness claims below.

All required DB/audit commands passed after fixing local environment loading and pilot internal links. Seven applied migrations match local checksums. Real HTTP checks passed for all 16 published pilot pages, authenticated/private admin, draft 404, comparison, both sitemaps and a configured test affiliate redirect. Sitemap/canonical use the preview origin. All 16 accepted internal links were verified in public HTML after application cache refresh.

Production blockers: strong admin credentials; real domain and APP_URL/APP_ENV; chosen production Neon branch/Worker; required production secrets; initial full Neon backup and isolated restore validation; reviewed real content replacing demo/fictitious broker data; media decision; preview indexing policy; explicit deployment approval. The old root Worker still has a remote legacy D1 binding, while preview does not. No D1 was used or introduced by this session.

Read [launch checklist](PRODUCTION_LAUNCH_CHECKLIST.md), [content plan](POST_LAUNCH_CONTENT_PLAN.md), and [verification evidence](../openspec/changes/021-post-deploy-launch-checkpoints/verification.md). Local pilot repair snapshots are not full backups. No commit, push or deployment in this session.

## Current Readiness

The system is beyond MVP and has a Cloudflare preview connected to Neon PostgreSQL.

Preview URL:

```text
https://content-hub-cms-preview.content-hub-stack.workers.dev
```

Latest preview smoke test passed for homepage, admin content, public article, broker review, Vietnamese article, sitemap index, and sitemap chunk.

Readiness level:

- MVP: ready on Cloudflare preview.
- Small production: close, after strong admin credentials, real domain, production `APP_URL`, final smoke test, and explicit production deploy approval.
- Large production: not ready yet. It still needs real backup/restore drills, media backup validation, log retention/alerting, load testing, and long-term content QA before scaling toward thousands of posts.

Important business decision:

- The site does not need 4,000 articles before public launch.
- 4,000 articles is a 3-4 year SEO/content roadmap, not a launch gate.
- Public launch should happen with a smaller pilot set, then content should expand gradually based on traffic, indexing, and revenue signals.

## Cache Policy

- Public content route data is cached with the `public-content` tag.
- Sitemap index and chunks are cached with the `sitemap` tag and keep CDN cache headers.
- Affiliate resolver reads are cached with the `affiliate-resolver` tag.
- Affiliate click redirects are `no-store`.
- Admin routes, admin forms, auth behavior, private errors, and mutations are not public-cached.
- Content mutations revalidate public content and sitemap cache.
- Broker and affiliate mutations revalidate affiliate resolver cache; broker mutations also revalidate public content cache because public broker facts can appear on reviews and comparisons.

## Monitoring and Logging

- Runtime logs use structured records with timestamp, level, event, service, and sanitized metadata.
- Known sensitive keys are redacted before logging.
- Public and admin error boundaries show safe retry UI.
- Operators should monitor build logs, runtime logs, PostgreSQL connection errors, Prisma migration status, cache revalidation behavior, and affiliate click redirect failures.

## Remaining Checklist Before 4,000 Real Posts

- Keep Neon/PostgreSQL as the primary database unless a planned migration to VPS PostgreSQL is needed.
- Do not switch core CMS database to Cloudflare D1.
- Run `npm.cmd run db:migrate` in development, then use `npx prisma migrate deploy` for production-style environments.
- Run `npm.cmd run db:seed` and `npm.cmd run pilot:check` after any database reset.
- Run `npm.cmd run seo:audit` against real data.
- Browser smoke test representative public URLs, broker reviews, comparison pages, affiliate CTA redirects, sitemap index, and sitemap chunks.
- Verify sitemap chunks with more than 4,000 planned URLs in staging or a DB snapshot.
- Take and restore one PostgreSQL backup in a non-production target.
- Take and restore one media backup from the configured S3-compatible bucket.
- Confirm Cloudflare/R2 to VPS Linux migration steps with real env vars in a private secret store.
- Add load/performance testing for public content routes and sitemap generation.
- Add a production log sink or host-level log retention.
- Decide on error alerting, uptime checks, and database monitoring.
- Keep AI batch import draft-only and validate every batch before import.
