# Design: Small Content Production Pilot

## Approach

Use `prisma/seed.mjs` as the pilot entrypoint so a fresh PostgreSQL environment can be migrated and seeded with a representative data set. The seed remains deterministic and idempotent through canonical-path upserts.

## Content Mix

The pilot content set should include:

- Global market education articles.
- Vietnam market education and FAQ content.
- Account-opening guides.
- Broker reviews attached to broker records.
- Best broker list pages attached to broker records.
- A draft item for public-rendering negative checks.

## Templates

The seed should ensure active templates exist for:

- `article`
- `guide`
- `broker-review`
- `broker-comparison`
- `best-broker-list`

Guide and best-broker-list can use the existing markdown-first block renderer at MVP level. They should not introduce page-builder behavior.

## Affiliate Safety

Seed content markdown must not contain raw affiliate destination URLs. Public CTAs should resolve through Broker and AffiliateLink rows with broker/market/language/campaign tokens.

## Verification

The pilot should verify:

- Canonical paths follow `/{market}/{content-type}/{slug}/`.
- Public pages expose canonical metadata and schema.
- Sitemap index and content sitemap include pilot URLs.
- Affiliate CTAs render only through first-party click tracking URLs when matching active links exist.
- Internal links can be suggested or pre-accepted within the same market/language.
- Admin edit routes can load seeded content.
- AI import validation can accept a representative draft shape when dependencies exist.
