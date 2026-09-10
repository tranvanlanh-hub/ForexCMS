# Change: System Audit, Admin Workflow, and Hardening Checkpoints 21-25

## Summary

Merge sessions 21 through 25 into one sequential hardening change for the Forex CMS after the content scale operations work.

## Why

The project now has public rendering, admin CRUD, template blocks, affiliate resolution, internal links, AI import, broker facts, analytics, and content-scale pilot tooling. Before larger publishing work, the system needs a checkpointed audit, non-public admin protection, a clearer editorial workflow, list operations that can handle many articles, and stronger validation/error handling.

## Scope

- Checkpoint 21: audit build, lint, type/schema, migrations, seed/import scripts, sitemap/robots routes, public/admin routes, pilot/batch data, and record risks.
- Checkpoint 22: protect `/admin` with MVP admin authentication/secret handling and prepare simple admin/editor role metadata without a complex permission system.
- Checkpoint 23: enforce the `draft -> review -> published -> archived` workflow, publish validation, timestamps, author/reviewer metadata, and AI import draft-only behavior.
- Checkpoint 24: improve admin content operations for many articles with search, filters, pagination, and safe bulk actions where appropriate.
- Checkpoint 25: harden duplicate slug, canonical, affiliate token, broker link, market/language, SEO metadata validation, and database/env fallback UI.

## Out of Scope

- Do not production deploy.
- Do not use Cloudflare D1.
- Do not change the established public URL patterns.
- Do not hard-code affiliate destination links in content or templates.
- Do not build a complex multi-tenant user/permission system.
- Do not let AI imports publish content directly.
