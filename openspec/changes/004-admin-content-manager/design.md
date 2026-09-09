# Design: Basic Admin Content Manager

## Approach

The admin content workflow uses the existing Prisma models:

- `Market`
- `Template`
- `ContentItem`
- `SeoMetadata`
- `ContentRevision`

The route-specific UI lives under `app/admin/content/`. Shared content helpers live in `lib/content/` so URL generation and validation are not duplicated across pages and actions.

## Validation

Publishing requires:

- title
- slug
- market
- content type
- template
- markdown body
- SEO title
- meta description

The form may save incomplete drafts, but cannot save a `PUBLISHED` item until required fields pass validation.

## URL policy

Canonical paths are generated from market code, content type path segment, and slug:

```text
/{market}/{content-type}/{slug}/
```

The admin form never accepts a raw public URL and does not create root-only paths like `/slug`.

## Affiliate policy

The body field is plain markdown for now. Raw `http://` or `https://` links in the body are rejected in this first version so affiliate destinations are not hard-coded before Broker/Affiliate Manager token resolution is implemented.
