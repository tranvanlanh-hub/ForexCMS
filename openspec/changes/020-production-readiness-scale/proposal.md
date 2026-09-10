# Change: Production Readiness and Scale Checkpoints 31-35

## Summary

Merge sessions 31 through 35 into one sequential operational-readiness change for the Forex CMS.

## Why

The CMS has working foundations for content, SEO, broker facts, affiliate tracking, internal links, AI import validation, and quality dashboards. Before creating real content at 4,000+ URL scale, the system needs targeted database indexes, a documented cache strategy, backup/restore procedures, basic observability, and a production readiness review.

## Scope

- Checkpoint 31: add justified database indexes for published content lookup, affiliate resolver, sitemap queries, and inspect basic N+1 risks.
- Checkpoint 32: standardize public cache strategy for content, sitemap, and affiliate resolver while keeping admin/private data uncached.
- Checkpoint 33: add backup/restore documentation and portable scripts/checklists for PostgreSQL, S3-compatible media, VPS Linux restore, and environment migration.
- Checkpoint 34: add basic structured logging, server error boundary, admin error fallback, and runtime troubleshooting documentation.
- Checkpoint 35: run production readiness checks, record remaining work before 4,000 real articles, and update handoff, roadmap, and OpenSpec.

## Out of Scope

- Do not production deploy.
- Do not change the established portable architecture.
- Do not introduce Cloudflare D1.
- Do not cache admin/private data publicly.
- Do not create or publish the real 4,000 article corpus in this change.
