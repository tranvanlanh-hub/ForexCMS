# Design: Basic Broker and Affiliate Manager

## Data Model

The existing Prisma models already include `Broker` and `AffiliateLink`. This change adds the minimal fields needed for the requested admin workflows:

- `Broker.logoUrl`
- `Broker.description`
- `AffiliateLink.languageCode`

`AffiliateLink` remains related to `Broker` and `Market`. Language is stored explicitly so campaigns can be scoped by market and language without forcing a new market record for every language variant.

## Admin UI

Broker Manager includes:

- List page at `/admin/brokers`
- Create page at `/admin/brokers/new`
- Edit page at `/admin/brokers/[id]/edit`
- Fields: name, slug, status, logo/media URL, short description

Affiliate Manager includes:

- List page at `/admin/affiliate-links`
- Create page at `/admin/affiliate-links/new`
- Edit page at `/admin/affiliate-links/[id]/edit`
- Fields: broker, market, language, campaign, destination URL, status, priority

The pages follow the existing Content Manager server-action pattern and include database-not-ready fallback UI.

## Public Resolver

`lib/affiliate` exposes a resolver that accepts:

- broker slug
- market code
- campaign
- optional language code

It returns the highest priority active affiliate link whose date window is currently valid. Public CTA rendering uses the resolver and never receives a raw destination URL from article content.

## Link Attributes

Public affiliate anchors render with:

```text
rel="sponsored nofollow"
```

Tracking remains basic: the resolver can return the affiliate link id and CTA component appends lightweight `data-*` attributes for future tracking hooks.
