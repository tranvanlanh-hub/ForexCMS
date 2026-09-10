# Design: SEO, Broker, Affiliate, Internal Link, and AI Safety Checkpoints 26-30

## Checkpoint Order

This change must remain sequential:

1. Checkpoint 26 builds the SEO/AEO/GEO audit layer first.
2. Checkpoint 27 improves broker review and comparison surfaces using only sourced facts.
3. Checkpoint 28 expands affiliate analytics reporting without expanding sensitive data collection.
4. Checkpoint 29 improves internal link automation rules and approval controls.
5. Checkpoint 30 adds AI batch validation and dry-run gates before final verification.

## SEO/AEO/GEO Audit

The audit should use existing content, SEO metadata, translation groups, accepted internal link suggestions, and sitemap helpers where possible. It may expose both an admin page and a script. Checks should be explainable per content item and produce a summarized report.

The audit should flag:

- missing SEO title or meta description
- multiple H1 risk in stored body/blocks
- missing FAQ block or FAQ section
- missing schema readiness for template type
- canonical outside expected market/content path
- hreflang missing for translation groups or mismatched language/market alternates
- orphan published content based on accepted incoming internal link suggestions
- missing sitemap inclusion for published active-market content

## Broker Review and Comparison

Broker public surfaces must continue to render only sourced `BrokerFact` rows. Pros/cons and rating-like values may only be displayed when represented as structured broker facts with source fields. Schema should stay conservative: emit Review/ItemList only when safe and omit review ratings unless a sourced rating fact exists.

## Affiliate Analytics

The click event data model already stores the required non-sensitive dimensions. The upgraded dashboard can aggregate existing fields by broker, campaign, market, content, and date. It should not add IP, user agent, cookie, visitor, session, or fingerprint storage.

## Internal Link Automation

Rules should make market/language/topic cluster constraints visible and configurable. The engine should preserve same-market/same-language generation, approval or semi-auto modes, priority targets, maximum links per page, and minimum spacing.

## AI Batch Safety

Batch validation should run before import and support dry-run output. It should enforce a batch size limit, reject invalid items with a report, and import only accepted items as drafts when explicitly requested. Bulk publishing remains unavailable.

## Verification

Run lint, typecheck, build, Prisma validation, relevant script syntax checks, content audit, and AI batch safety checks. Database-backed migration/seed checks may remain blocked only if no reachable PostgreSQL database is available after an actual attempt.
