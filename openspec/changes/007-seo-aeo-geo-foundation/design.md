# Design

## SEO helpers

Add reusable helpers under `lib/seo` for:

- app URL normalization
- absolute URL generation
- robots metadata
- canonical metadata
- breadcrumb creation
- Article JSON-LD
- BreadcrumbList JSON-LD
- FAQPage JSON-LD extraction from markdown
- sitemap chunk constants and sitemap URL loading

## FAQ extraction

For the foundation, FAQ is inferred from markdown sections headed by `## FAQ` or `## Frequently Asked Questions`.

Questions are markdown headings under that section. Paragraph and list text until the next question are treated as the answer.

## Sitemap strategy

Expose:

- `/sitemap.xml` as a sitemap index.
- `/sitemaps/content-0.xml` as the first segmented content sitemap.

The helper uses a chunk size constant so later work can split large URL sets without changing route contracts.

## Robots strategy

Expose `/robots.txt` via Next.js metadata route and point crawlers to `/sitemap.xml`.

## Canonical and language

Canonical URLs continue to use the saved canonical path, which includes the market segment. Language is represented through market metadata and the `alternates.languages` metadata map, initially self-referencing the page locale.
