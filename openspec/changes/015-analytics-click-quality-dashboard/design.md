# Design

## Data model

Add `AffiliateClickEvent` in Prisma with:

- `affiliateLinkId`
- optional `brokerId`
- optional `contentItemId`
- `market`
- `campaign`
- `referrer`
- `clickedAt`

The model intentionally does not store IP address, user agent, cookies, visitor id, or session id.

## Tracking flow

Public CTA links point to an internal redirect endpoint:

```text
/affiliate/click/{affiliateLinkId}?contentId=...
```

The endpoint looks up an active affiliate link, derives broker, market, and campaign from the database, records the event, and redirects to `AffiliateLink.destinationUrl`.

If the event insert fails, redirect still proceeds so tracking does not break affiliate conversion. If the link is inactive or missing, return 404.

## Referrer handling

The endpoint reads the request `referer` header when present and truncates it to a conservative length. No extra browser identifiers are collected.

## Dashboard

Create a database-backed admin route at `/admin/analytics` with:

- total affiliate clicks
- top brokers by click
- top content by click
- content missing SEO metadata
- affiliate links missing destination or not active
- orphan published content when the internal link module exists

The dashboard reads direct aggregations from PostgreSQL for the MVP. Later changes can add date filters and cached rollups.
