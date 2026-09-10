# Tasks

- [x] Read handoff, roadmap, OpenSpec project/product/tech/structure, and relevant specs.
- [x] Add realistic seed/demo content set covering 10-20 items.
- [x] Include at least two active markets in published pilot content.
- [x] Cover education article, account-opening guide, broker review, best broker list, and FAQ content.
- [x] Keep affiliate CTA resolution centralized through AffiliateLink rows.
- [x] Add `pilot:check` database verification script for URL, canonical, SEO, affiliate, and internal-link data checks.
- [ ] Check URL pattern and canonical output for representative pages against a real PostgreSQL database.
- [ ] Check sitemap index and content sitemap output against a real PostgreSQL database.
- [ ] Check public schema JSON-LD output against a real PostgreSQL database.
- [ ] Check affiliate CTA rendering and first-party click URL against a real PostgreSQL database.
- [ ] Check internal link data/rendering path against a real PostgreSQL database.
- [ ] Check admin edit flow for seeded content against a real PostgreSQL database.
- [ ] Check AI import flow if available against a real PostgreSQL database.
- [x] Run available lint/build/test commands.
- [x] Update docs/CODEX_HANDOFF.md and docs/ROADMAP.md.
- [x] Mark this checklist complete after verification status is recorded.

## Verification notes

- `node --check prisma/seed.mjs` passed.
- `node --check scripts/check-content-pilot.mjs` passed.
- `npx.cmd prisma validate` passed with a temporary PostgreSQL-shaped `DATABASE_URL`.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- `npm.cmd run db:seed` and `npm.cmd run pilot:check` were attempted. Without env they were blocked by missing `DATABASE_URL`; with a temporary PostgreSQL-shaped URL they reached the database connection step and were blocked because no PostgreSQL server is reachable at `localhost:5432`.
- `psql` and Docker are not available in PATH, so a local database could not be started from this session.
- No `test` script exists in `package.json` as of this change.
