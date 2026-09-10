# Change 011 - Multi-market and multi-language foundation

## Summary

Add the first durable foundation for managing supported markets, language metadata, and translation relationships used by future hreflang generation.

## Scope

- Keep public content URLs market-scoped with the existing `/{market}/{content-type}/{slug}/` pattern.
- Support these market codes: `global`, `us`, `uk`, `au`, `vn`, and `th`.
- Ensure each market stores `code`, `name`, `languageCode`, `locale`, optional `countryCode`, and `status`.
- Add a content translation/topic relationship so related market versions can be grouped for hreflang.
- Generate public language alternates only from published related content whose canonical path is valid for its market.
- Add a basic admin Markets surface for creating and editing allowed markets.

## Non-goals

- No root URL article route such as `/{slug}`.
- No automatic machine translation.
- No redirect manager.
- No full SEO Manager hreflang editor beyond the content relationship foundation.
