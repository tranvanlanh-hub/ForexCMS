# Design: Content Scale Operations Checkpoints 16-20

## Checkpoint Order

This change is intentionally sequential:

1. Checkpoint 16 defines the AI brief contract.
2. Checkpoint 17 generates 50 draft items that conform to the contract.
3. Checkpoint 18 audits those 50 draft items and blocks scale-up if issues remain.
4. Checkpoint 19 prepares a large-batch planner only when real DB-backed validation is not available.
5. Checkpoint 20 records operational performance, sitemap, cache, index, backup, and deploy notes.

## AI Brief Contract

The contract remains compatible with the existing AI Import Manager fields:

- title
- slug
- market
- language
- contentType
- template
- body
- seoTitle
- metaDescription
- affiliateTokens
- brokerMentions
- translationGroupKey

The scale-ready brief adds fields used by generation and audit tooling:

- targetKeyword
- topicCluster
- faq
- internalLinkTargets
- schemaTypes
- canonicalPath
- status

## Pilot Data

The 50-item pilot is generated as draft import data under `data/ai-content/`. It is not published and does not write to the database by default. This keeps the pilot useful before PostgreSQL smoke tests are available while still allowing the Import Manager contract to be checked.

## Audit

The audit runs against the generated draft JSON and checks for blocking issues:

- missing SEO title or meta description
- duplicate slug in market/content-type scope
- duplicate canonical path
- content without internal link targets
- invalid affiliate token shape or hard-coded affiliate destination
- canonical path mismatch
- FAQ/schema missing
- orphan draft within the pilot link graph

## Large Batch Guard

Because DB-backed AI import and public rendering could not be verified in the prior pilot due to unavailable PostgreSQL, the large-batch step must not create 200-500 real content items. Instead, the batch planner writes a deterministic plan file that can be converted to draft import data later after:

- `db:migrate`
- `db:seed`
- `pilot:check`
- content audit
- affiliate validation
- internal link validation

all pass against a real PostgreSQL database.

## Operations

Performance work is documentation-first in this change because the app already has sitemap chunk routes and Prisma indexes. The final notes document cache headers, route behavior, query/index baseline, and backup/deploy checklists without changing architecture.
