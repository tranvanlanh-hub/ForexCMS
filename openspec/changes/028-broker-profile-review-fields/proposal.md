# Proposal: Broker profile and editorial review fields

## Goal

Expand Broker Manager so editors can maintain reusable English-language company,
contact, priority, and review-score data for broker reviews and comparisons.

## Scope

- Add first-class broker priority and company/contact fields.
- Add first-class editorial review scores matching the approved review layout.
- Validate URLs, email, phone, year, priority, and scores in admin mutations.
- Show the new fields in broker create/edit and useful summary columns in the list.
- Keep sourced factual claims in `BrokerFact` and affiliate destinations in
  `AffiliateLink`.

## Out of scope

- Populating production broker data.
- Automatically calculating or scraping scores.
- Publishing a new public broker profile route.
- Treating an editorial score as a regulator or broker-provided fact.

## Acceptance

- Existing brokers remain valid after migration.
- Admin can create and update all profile and review fields using English labels.
- Scores accept 0.0–5.0 only and remain optional.
- Broker list orders by priority and exposes contact/rating completeness.
- Lint, typecheck, Prisma validation/generation, and production build pass.
