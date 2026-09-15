# Proposal: Production broker research import

## Goal

Populate the production Broker Manager with the approved 36-broker working list
after the editable profile fields are deployed.

## Scope

- Add a reviewed JSON dataset matching the Broker profile fields.
- Add an explicit, idempotent import command that creates missing brokers as
  drafts and only fills blank or obvious demo values on existing rows.
- Back up production PostgreSQL before applying the migration or importing data.
- Deploy the Broker Manager fields, apply the committed migration, import the 36
  drafts, and verify application/database health.

## Out of scope

- Publishing brokers or broker reviews.
- Inventing editorial ratings or automatically calculating scores.
- Creating affiliate links, regulatory claims, or sourced BrokerFact rows.
- Overwriting editor-maintained non-placeholder values on repeated imports.

## Acceptance

- Production has all 36 expected broker slugs, priorities 1 through 36, and no
  duplicate priorities in this imported set.
- Every newly created broker remains `DRAFT` and every review score remains null.
- The deployed admin bundle contains the new editable Broker fields.
- Public and authentication smoke checks pass with no new service errors.
