# Change 014: Broker data, review, and comparison foundation

## Summary

Upgrade broker data from unstructured JSON toward sourced BrokerFact records, improve BrokerReview rendering with cited facts, and add the first broker comparison foundation route.

## Why

Broker reviews and comparisons need structured broker facts such as regulation, minimum deposit, spreads, leverage, platforms, account types, payment methods, support languages, and restricted countries. These facts can affect financial/legal interpretation, so public claims must be source-backed and reusable across review and comparison templates.

## Scope

- Add a BrokerFact model and PostgreSQL migration.
- Add admin editing support for sourced broker facts.
- Render sourced broker facts in BrokerReview pages.
- Add a public comparison foundation at `/{market}/compare/{broker-a}-vs-{broker-b}/`.
- Add Review and ItemList JSON-LD helpers where appropriate.
- Update seed data, docs, roadmap, and this change checklist.

## Out of scope

- Full comparison builder UI.
- Broker scoring/rating model.
- Legal advice or financial recommendations.
- Affiliate click tracking analytics.
