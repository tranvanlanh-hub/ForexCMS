# Spec: Affiliate Manager

## Muc tieu

Quan ly broker va affiliate link tap trung de thay doi link mot cho va ap dung toan website.

## Requirements

- He thong phai co Broker entity.
- He thong phai co AffiliateLink entity.
- Affiliate link phai ho tro market, language, campaign, status va priority.
- Public CTA phai resolve link qua broker/campaign token.
- Link affiliate public phai dung `rel="sponsored nofollow"` tru khi co quyet dinh khac.
- He thong nen ho tro tracking click o giai doan sau.

## Acceptance criteria

- Mot broker co the co nhieu affiliate link theo market/campaign.
- Doi affiliate URL trong backend se anh huong toan bo CTA lien quan.
- Khong co bai viet nao can sua thu cong khi doi link broker.

## Constraints

- Khong hard-code affiliate URL trong Markdown/HTML content.
- Khong de moi template tu resolve link theo cach rieng.

## Implementation note 2026-09-09 - Basic manager and resolver

Basic database-backed admin pages now exist for brokers and affiliate links:

- `/admin/brokers`
- `/admin/brokers/new`
- `/admin/brokers/[id]/edit`
- `/admin/affiliate-links`
- `/admin/affiliate-links/new`
- `/admin/affiliate-links/[id]/edit`

`Broker` supports name, slug, status, logo/media URL, and short description.

`AffiliateLink` supports broker, market, language, campaign, destination URL, status, priority, sponsored, and nofollow fields.

`lib/affiliate` exposes a centralized resolver that accepts broker, market, language, and campaign tokens. Public CTA rendering uses this resolver and outputs affiliate anchors with `rel="sponsored nofollow"`.

## Implementation note 2026-09-09 - BrokerFact foundation

Change `openspec/changes/014-broker-data-review-comparison/` adds first-class sourced broker facts.

`BrokerFact` belongs to a broker and can optionally scope to a market. Supported categories include regulation/license, minimum deposit, spread, leverage, platform, account type, deposit/withdrawal method, support language, restricted country, and other.

Each fact row requires `sourceName` and `sourceUrl`. Public broker review and comparison surfaces only render fact rows with source fields so financial/legal-style claims are not shown without citation.

Broker Manager can create/update facts in the broker edit form. Affiliate URLs remain centralized in `AffiliateLink`; broker facts do not store affiliate destinations.

## Implementation note 2026-09-09 - Basic click tracking

Change `openspec/changes/015-analytics-click-quality-dashboard/` adds `AffiliateClickEvent` and routes public CTA clicks through `/affiliate/click/{affiliateLinkId}` before redirecting to `AffiliateLink.destinationUrl`.

Click events store `affiliateLinkId`, optional `brokerId`, optional `contentItemId`, `market`, `campaign`, optional `referrer`, and `clickedAt`. They intentionally do not store IP address, user agent, cookies, visitor identifiers, session identifiers, or fingerprinting data.

## Implementation note 2026-09-09 - Publish-time affiliate validation

Change `openspec/changes/018-system-audit-admin-workflow-hardening/` adds shared inline affiliate-token parsing in `lib/affiliate` and uses it during Content Manager saves. Invalid or inactive inline affiliate tokens block saving.

For templates with CTA slots, publishing requires attached active brokers and active matching affiliate links for the selected market/language/campaign slots. This prevents public broker review/list content from silently losing expected affiliate CTAs.

## Implementation note 2026-09-10 - Click analytics dimensions

Change `openspec/changes/019-seo-broker-affiliate-link-ai-safety/` expands the admin analytics view using existing non-sensitive click event fields.

`/admin/analytics` now reports click aggregation by broker, campaign, market, content, and date. The tracking data model remains unchanged and still avoids IP address, user agent, cookies, visitor/session identifiers, and fingerprinting fields.

## Implementation note 2026-09-10 - Resolver cache and index

Change `openspec/changes/020-production-readiness-scale/` adds an affiliate resolver index:

```text
idx_affiliate_resolver on AffiliateLink(brokerId, marketId, languageCode, campaign, status, priority, updatedAt)
```

Public affiliate resolver reads now use a short tag-based cache for active broker/market/campaign resolution. Affiliate link mutations revalidate this cache. Affiliate click tracking and redirects remain `no-store` and are not cached.
