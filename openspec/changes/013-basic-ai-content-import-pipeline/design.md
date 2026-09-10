# Design

## Input formats

The import surface accepts either:

- JSON object with content metadata and body/content fields.
- Markdown with YAML-like frontmatter delimited by `---`.

Supported canonical fields:

- `title`
- `slug`
- `market`
- `language`
- `contentType`
- `template`
- `seoTitle`
- `metaDescription`
- `body` or markdown body after frontmatter
- `affiliateTokens`
- `brokerMentions`
- `translationGroupKey`

## Validation

Validation runs before save and returns errors/warnings plus a normalized preview. Blocking errors prevent draft creation.

The validator checks:

- Required fields exist.
- Market code exists and is active.
- Language matches the selected market.
- Content type is a known `ContentType`.
- Template key/name exists and is active.
- Body/content exists.
- SEO title and meta description exist.
- Canonical path is market/content-type scoped.
- Duplicate slug/canonical path is not already used.
- Required template blocks are present as warnings for draft import.
- Affiliate tokens resolve to active centralized affiliate links.
- Broker mentions resolve to known brokers.
- Body does not contain hard-coded `http://` or `https://` URLs.

## Save behavior

AI import saves only `ContentStatus.DRAFT` records. It creates `ContentItem`, `SeoMetadata`, `ContentRevision`, optional translation group, and connects validated broker mentions/token brokers.

Publishing remains a separate Content Manager action so existing publish validation still applies.
