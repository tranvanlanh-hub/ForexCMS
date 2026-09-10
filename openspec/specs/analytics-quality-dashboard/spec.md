# Spec: Analytics and Quality Dashboard

## Muc tieu

Tao nen analytics va content quality dashboard de van hanh website affiliate forex o quy mo lon ma khong thu thap du lieu ca nhan khong can thiet.

## Requirements

- He thong phai luu affiliate click event toi thieu cho CTA.
- Click event phai luu `affiliateLinkId`, optional `brokerId`, optional `contentItemId`, `market`, `campaign`, optional `referrer`, va timestamp.
- He thong khong duoc luu IP address, user agent, cookie id, visitor id, session id, fingerprint, hoac du lieu nhay cam khong can thiet trong click event MVP.
- Public CTA phai di qua route tracking first-party truoc khi redirect den destination URL hop le trong `AffiliateLink`.
- Tracking loi khong duoc lam hong redirect neu affiliate link van hop le.
- Admin dashboard phai hien tong click affiliate, top broker theo click, top content theo click, content thieu SEO metadata, affiliate link co van de, va orphan published content khi module internal link da co.

## Acceptance criteria

- Click affiliate CTA tao duoc `AffiliateClickEvent` khi database san sang.
- Redirect chi hoat dong cho affiliate link active, broker active, market active, va con trong khoang thoi gian hieu luc.
- Dashboard doc duoc aggregation tu PostgreSQL va co fallback khi database/migration chua san sang.
- Dashboard khong hien hay yeu cau du lieu dinh danh ca nhan.

## Constraints

- Khong them third-party tracking script trong MVP.
- Khong them cookie tracking hoac cross-site identity.
- Khong hard-code affiliate destination trong content/template.
- Khong coi analytics la nguon thay the cho validation SEO/publish hien co.

## Implementation note 2026-09-09 - Basic click and quality dashboard

Change `openspec/changes/015-analytics-click-quality-dashboard/` adds `AffiliateClickEvent`, the first-party redirect route `/affiliate/click/{affiliateLinkId}`, and `/admin/analytics`.

The click event stores affiliate link, optional broker/content references, market, campaign, referrer, and click timestamp only. It deliberately omits IP address, user agent, cookie/session identifiers, and fingerprint-style fields.

The analytics dashboard reports total affiliate clicks, top brokers, top content, missing SEO metadata, inactive/empty affiliate links, missing CTA resolutions for published broker content, and orphan published content based on accepted incoming internal link suggestions.

## Implementation note 2026-09-09 - Batch audit before scale

Change `openspec/changes/017-content-scale-operations/` adds a pre-database batch audit script at `scripts/audit-content-batch.mjs`.

This does not replace the admin analytics dashboard. It is a gate for generated AI draft files before import, while `/admin/analytics` remains the database-backed quality dashboard after content exists in PostgreSQL.

## Implementation note 2026-09-10 - Expanded click and SEO quality dashboards

Change `openspec/changes/019-seo-broker-affiliate-link-ai-safety/` expands affiliate click reporting by broker, campaign, market, content, and date in `/admin/analytics`.

The same change adds `/admin/seo` as the dedicated SEO/AEO/GEO audit dashboard for missing metadata, heading risk, FAQ/schema readiness, canonical, hreflang, orphan content, and sitemap inclusion checks.

## Implementation note 2026-09-10 - Structured runtime visibility

Change `openspec/changes/020-production-readiness-scale/` adds a small structured logging helper for runtime failures. Logs redact keys that look like secrets, tokens, passwords, cookies, database URLs, S3 credentials, authorization data, or affiliate destination URLs.

The public and admin error boundaries provide safe fallback UI while runtime logs keep operator-visible context.
