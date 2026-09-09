# Design: Public content routing

## Routing

The public route lives under:

```text
app/(public)/[market]/[contentType]/[slug]/page.tsx
```

It only matches three path segments, so it does not introduce `/{slug}` routing.

## Resolver

The resolver maps the public `contentType` segment back to a Prisma `ContentType`
using the shared canonical path mapping in `lib/content`.

The database query requires:

- matching market code
- matching content type
- matching slug
- `ContentStatus.PUBLISHED`

Draft, review, and archived content return `notFound()`.

## Rendering

The first version renders markdown stored in `ContentItem.body` with a conservative internal renderer:

- page title is the only H1
- markdown `#` headings are downgraded to H2
- links are not rendered as anchors yet

This keeps public rendering simple until the template/block system matures.

## SEO

The route uses `generateMetadata` to emit title, description, robots, and canonical URL.
Visible breadcrumb is rendered on the page and a basic BreadcrumbList JSON-LD object is included.

## Seed

`prisma/seed.mjs` creates:

- market `global`
- active Article and BrokerReview templates
- one published article
- one draft article at the same URL pattern family to confirm drafts do not show publicly
