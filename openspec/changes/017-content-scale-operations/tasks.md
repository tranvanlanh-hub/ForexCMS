# Tasks

- [x] Read handoff, roadmap, OpenSpec project/product/tech/structure, relevant specs, and recent changes.
- [x] Checkpoint 16: define AI content brief/schema for Article, Guide, BrokerReview, BestBrokerList, and CountryHub.
- [x] Checkpoint 16: update docs/OpenSpec so future sessions can reuse the contract.
- [x] Checkpoint 16: run syntax/static checks for new schema/generation files.
- [x] Checkpoint 17: generate 50 draft pilot items as import data.
- [x] Checkpoint 17: split pilot items by topic cluster and market.
- [x] Checkpoint 17: keep all pilot items draft and avoid hard-coded affiliate URLs.
- [x] Checkpoint 17: check URL, SEO metadata, schema, affiliate token, and internal link fields.
- [x] Checkpoint 18: add content audit script.
- [x] Checkpoint 18: audit the 50 draft pilot items.
- [x] Checkpoint 18: fix generated pilot issues found by the audit.
- [x] Checkpoint 19: do not create 200-500 real articles while DB-backed validation remains unavailable.
- [x] Checkpoint 19: add guarded large-batch planning pipeline.
- [x] Checkpoint 20: document sitemap chunking, cache strategy, query/index baseline, backup checklist, and Cloudflare/VPS notes.
- [x] Checkpoint 20: run final lint/build/static/audit checks.
- [x] Update docs/CODEX_HANDOFF.md and docs/ROADMAP.md.

## Verification notes

- `node --check scripts/generate-content-pilot.mjs` passed.
- `node --check scripts/audit-content-batch.mjs` passed.
- `node --check scripts/prepare-content-batch.mjs` passed.
- `npm.cmd run content:pilot:generate` passed and wrote 50 draft items.
- `npm.cmd run content:audit` passed on the 50-item pilot.
- `npm.cmd run content:batch:plan` passed and wrote a planned 250-item batch manifest only.
- `npx.cmd prisma validate` passed with a temporary PostgreSQL-shaped `DATABASE_URL`.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.

## Blocking notes

- Real DB-backed `db:seed`, `pilot:check`, browser smoke tests, and AI Import Manager save tests still require a reachable PostgreSQL database.
- Large draft creation remains blocked until DB-backed AI import, SEO, internal link, and affiliate validation are confirmed.
