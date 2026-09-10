# Tasks

- [x] Read handoff, roadmap, OpenSpec project/product/tech/structure, all current specs, and recent changes.

## Checkpoint 21 - Full System Audit

- [x] Run lint/build/type/schema checks available in the project.
- [x] Check migrations and confirm no Cloudflare D1 dependency remains in active app config.
- [x] Check seed, pilot, AI import batch generation/audit, sitemap, robots, public routes, and admin routes.
- [x] Check pilot/batch data if present.
- [x] Record issues and risks in docs or OpenSpec.
- [x] Fix serious defects found within reasonable scope before continuing.

## Checkpoint 22 - Admin Auth + Permission Foundation

- [x] Verify `/admin` fails closed when admin auth env is missing.
- [x] Verify `/admin` blocks unauthenticated access.
- [x] Add or confirm simple role foundation for admin/editor where suitable.
- [x] Keep permission logic small and MVP-appropriate.
- [x] Run relevant checks before continuing.

## Checkpoint 23 - Content Workflow

- [x] Confirm statuses `draft`, `review`, `published`, and `archived` are available in schema and UI.
- [x] Add or harden publish validation.
- [x] Confirm `updatedAt` and `publishedAt` behavior.
- [x] Add or expose author/reviewer metadata where appropriate.
- [x] Confirm AI import saves drafts only and cannot publish directly.
- [x] Run relevant checks before continuing.

## Checkpoint 24 - Admin UX for Many Articles

- [x] Add search/filter support for content list.
- [x] Add pagination.
- [x] Add filters by market/status/template/content type.
- [x] Add safe bulk actions if appropriate.
- [x] Keep UI operational and not page-builder-like.
- [x] Run relevant checks before continuing.

## Checkpoint 25 - Error Handling + Validation Hardening

- [x] Harden duplicate slug and canonical validation.
- [x] Harden affiliate token, broker link, market/language, and SEO metadata validation.
- [x] Improve fallback UI for database/env unavailable states.
- [x] Run final lint/build/test/audit checks available in the project.
- [x] Update long-lived specs, roadmap, handoff, and this checklist.

## Verification Notes

- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed after running it separately from `next build`.
- `npm.cmd run build` passed.
- `npx.cmd prisma validate` passed with a temporary PostgreSQL-shaped `DATABASE_URL`.
- `npm.cmd run db:generate` initially failed because a running Next dev server held the Prisma engine DLL, then passed after stopping the workspace dev server.
- `node --check prisma/seed.mjs` passed.
- `node --check scripts/check-content-pilot.mjs` passed.
- `node --check scripts/generate-content-pilot.mjs` passed.
- `node --check scripts/audit-content-batch.mjs` passed.
- `node --check scripts/prepare-content-batch.mjs` passed.
- `npm.cmd run content:pilot:generate` passed and wrote 50 pilot draft items.
- `npm.cmd run content:audit` passed with 0 errors and 0 warnings.
- `npm.cmd run content:batch:plan` passed and wrote the planned 250-row batch manifest only.
- `npm.cmd run db:migrate`, `npm.cmd run db:seed`, and `npm.cmd run pilot:check` remain blocked without a reachable PostgreSQL server at `localhost:5432`.
- Local production smoke test confirmed `/admin/content/` returns `503` when admin credentials are missing and `/robots.txt` remains public with `200`.
- Local production smoke test confirmed `/admin/` returns `401` without or with invalid Basic Auth, and succeeds with valid Basic Auth when credentials are configured.

## Audit/Risk Notes

- Real DB-backed seed, pilot, sitemap-with-data, public schema, affiliate CTA rendering, admin edit, and AI import save tests still require a reachable PostgreSQL database.
- No active Cloudflare D1 binding or D1 Prisma dependency was found in `wrangler.jsonc`, `package.json`, `prisma/schema.prisma`, or active Worker type definitions.
- The 250-item batch remains planned-only; no large real content import was performed.
