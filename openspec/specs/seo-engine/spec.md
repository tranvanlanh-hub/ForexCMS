# Spec: SEO, AEO, GEO Engine

## Mục tiêu

Tạo nền SEO/AEO/GEO chuẩn cho website nội dung lớn, giúp Google và AI answer engines hiểu rõ cấu trúc nội dung.

## Requirements

- Mỗi public page phải có title, description, canonical và robots metadata.
- Hệ thống phải sinh schema JSON-LD theo template.
- Hệ thống phải hỗ trợ BreadcrumbList.
- Hệ thống phải hỗ trợ FAQPage khi content có FAQ.
- Hệ thống phải hỗ trợ hreflang cho nội dung đa ngôn ngữ/thị trường.
- Hệ thống phải sinh sitemap index và sitemap chia nhỏ khi số lượng URL lớn.
- Nội dung nên có table of contents, summary/key takeaways và cấu trúc heading rõ.

## Acceptance criteria

- Page publish có metadata hợp lệ.
- Broker review hoặc article có schema tương ứng.
- Sitemap không gom toàn bộ URL vào một file lớn duy nhất.
- Canonical không trỏ sai market/language.

## Constraints

- Không render nhiều H1 trên một page.
- Không bỏ qua metadata vì nghĩ sẽ bổ sung sau.
## Implementation note 2026-09-09 - Public page SEO basics

Published public content pages now emit basic metadata from `SeoMetadata` when available:

- title
- description
- canonical URL
- robots index/follow

The page renders one visible H1 from `ContentItem.title`, downgrades markdown H1 content to H2, and includes a basic visible breadcrumb plus BreadcrumbList JSON-LD.

## Implementation note 2026-09-09 - SEO/AEO/GEO foundation

Change `openspec/changes/007-seo-aeo-geo-foundation/` adds reusable SEO helpers in `lib/seo` for canonical URL generation, robots metadata, language alternates, breadcrumb JSON-LD, Article JSON-LD, FAQPage JSON-LD, and sitemap XML rendering.

Published public content pages now render:

- SEO title.
- Meta description.
- Canonical URL guarded to the content market path.
- Robots metadata.
- Visible breadcrumb.
- Article JSON-LD.
- BreadcrumbList JSON-LD.
- FAQPage JSON-LD when markdown contains an FAQ section.

Sitemap routing now starts with a sitemap index at `/sitemap.xml` and segmented content sitemap routes at `/sitemaps/content-N.xml`, using a 4,000 URL chunk size constant for future scaling.

Robots routing now exposes `/robots.txt`, allows public crawling, disallows `/admin/`, and points crawlers to `/sitemap.xml`.

## Implementation note 2026-09-09 - Template block SEO inputs

FAQPage JSON-LD now reads FAQ items from template blocks when available instead of only scanning raw markdown.

Article JSON-LD adds `articleSection` from table-of-contents headings and summary/key takeaway items when the selected template produces those blocks.

## Implementation note 2026-09-09 - Translation-group hreflang

Change `openspec/changes/011-multi-market-language/` adds translation-group-aware hreflang generation.

Public metadata now derives language alternates from published sibling content in the same `ContentTranslationGroup`. Each alternate canonical path is guarded against the sibling market prefix before it is emitted, and a global sibling becomes `x-default` when present.

## Implementation note 2026-09-09 - Internal link automation

Change `openspec/changes/012-internal-link-automation/` adds controlled internal links as a render-time SEO layer.

Internal links are capped per page and spaced apart. Only accepted suggestions or active auto-approve rules render publicly, which keeps internal linking useful for SEO without uncontrolled link density.

## Implementation note 2026-09-09 - Review and ItemList schema

Change `openspec/changes/014-broker-data-review-comparison/` adds a safe Review JSON-LD helper for BrokerReview pages. It sets `itemReviewed` to the attached broker as an Organization and does not emit `reviewRating` until a dedicated rating/scoring model exists.

The broker comparison foundation route emits BreadcrumbList and ItemList JSON-LD for the compared brokers. Comparison facts are sourced from `BrokerFact` rows that include source fields.

## Implementation note 2026-09-09 - Quality dashboard checks

Change `openspec/changes/015-analytics-click-quality-dashboard/` adds `/admin/analytics` with a basic missing SEO metadata scan across recent content. The dashboard highlights content missing SEO title, meta description, or canonical path so editors can fix quality gaps before scale.

## Implementation note 2026-09-09 - Content scale audit and sitemap cache

Change `openspec/changes/017-content-scale-operations/` adds an offline content audit for generated AI draft batches. The audit checks missing SEO title/meta description, duplicate slugs, duplicate canonical paths, canonical mismatch, FAQ/schema readiness, internal link targets, affiliate token shape, and orphan risk.

Sitemap route responses now include CDN cache headers:

- `/sitemap.xml`: `s-maxage=300`, `stale-while-revalidate=3600`.
- `/sitemaps/content-N.xml`: `s-maxage=1800`, `stale-while-revalidate=86400`.

The sitemap URL pattern and chunked sitemap structure remain unchanged.

## Implementation note 2026-09-10 - SEO/AEO/GEO audit dashboard

Change `openspec/changes/019-seo-broker-affiliate-link-ai-safety/` adds a dedicated SEO/AEO/GEO audit layer.

`/admin/seo` now scans published active-market content for missing SEO title/meta description, multiple H1 risk in stored markdown, missing FAQ, missing schema readiness, canonical mismatch, hreflang gaps, orphan content, and sitemap exclusion. The report summarizes issue counts and links each issue back to the content editor.

`npm.cmd run seo:audit` provides a script-level report for the same operational checkpoint when PostgreSQL is reachable.

## Implementation note 2026-09-10 - Sitemap scale cache

Change `openspec/changes/020-production-readiness-scale/` keeps the existing sitemap index and chunked sitemap URL structure. Sitemap page count and chunk entries now use tag-based server caching in addition to CDN cache headers. Content mutations revalidate the sitemap cache tag so published URL changes do not depend only on TTL expiry.

The sitemap query is supported by additional `ContentItem` indexes for published content ordering, keeping the route ready for 4,000+ URLs without switching databases or using Cloudflare D1.

## Implementation note 2026-09-10 — Auditable launch gate

Change 021 loads .env.local/.env for the standalone SEO audit and returns nonzero when issues are found. Its current database scan is capped at 1,000 rows; the 16-row pilot was fully covered, but this script alone must not certify all content at 4,000+ scale. Preview HTTP verification additionally checks sitemap origin, canonical URLs, one H1, draft exclusion and actual rendered internal links. Production requires separate domain/indexing checks and reviewed real content.
