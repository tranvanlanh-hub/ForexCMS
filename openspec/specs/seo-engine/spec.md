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
