# Design: System Audit, Admin Workflow, and Hardening Checkpoints 21-25

## Checkpoint Order

This change must remain sequential:

1. Checkpoint 21 audits the current system and fixes blocking defects first.
2. Checkpoint 22 ensures admin routes are not publicly writable/readable.
3. Checkpoint 23 tightens editorial workflow and publish gates.
4. Checkpoint 24 improves the content admin list for operational scale.
5. Checkpoint 25 hardens validation and error handling across the relevant flows.

## Admin Auth

The MVP protection remains intentionally small. Admin access can be guarded by HTTP Basic Authentication or an equivalent admin secret/session mechanism using environment variables. If admin credentials are missing, admin routes must fail closed instead of rendering the CMS publicly.

The permission foundation may expose simple role naming (`admin` and `editor`) for UI/server-action intent, but it must not introduce a complex account system until the product needs it.

## Content Workflow

`ContentStatus` already supports `DRAFT`, `REVIEW`, `PUBLISHED`, and `ARCHIVED`. Admin save logic should treat `PUBLISHED` as a guarded transition:

- require title, slug, active market, language match, active template, body, required template blocks, SEO title, meta description, valid canonical, and valid affiliate/broker references when used
- set `publishedAt` when content first becomes published
- preserve existing `publishedAt` when editing already-published content
- clear or keep archival metadata conservatively without changing URL patterns

AI import remains draft-only. Imported drafts may enter review or publish only through the Content Manager validation path.

## Operational Admin UX

The content list should support many articles without becoming a page builder:

- keyword search
- filter by market
- filter by status
- filter by template
- filter by content type
- pagination
- safe bulk status changes for draft/review/archive operations if validation boundaries are respected

Bulk publish should either be omitted or heavily guarded by the same publish validation used by single-content saves.

## Validation and Error Handling

Validation should be shared where practical so admin form saves, AI import, and bulk actions do not drift. Hardening should cover:

- duplicate slugs and canonical paths
- canonical path outside the selected market/content type
- affiliate token shape and resolver failures
- broker content missing a resolvable affiliate link when a CTA is expected
- missing market/language or language mismatch
- missing SEO title, meta description, or canonical
- fallback UI when database or required environment variables are unavailable

## Verification

Each checkpoint records its own checks in `tasks.md`. Database-backed checks may be marked blocked only when no reachable PostgreSQL database is available after an actual attempt.
