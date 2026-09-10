# Tasks

- [x] Read handoff, roadmap, OpenSpec project/product/tech/structure, all current specs, and recent changes.

## Checkpoint 26 - SEO/AEO/GEO Audit Dashboard

- [x] Add or upgrade admin/script audit reporting.
- [x] Check missing title/meta, multiple H1, missing FAQ, missing schema, canonical mismatch, hreflang gaps, orphan content, and sitemap inclusion.
- [x] Make the report readable for operators.
- [x] Run relevant checks before continuing.

## Checkpoint 27 - Broker Review and Comparison

- [x] Upgrade BrokerReview and BrokerComparison display with structured facts.
- [x] Cover pros/cons, ratings where sourced, fees/spread, regulation, deposit/withdrawal, and platform facts.
- [x] Keep unsupported claims hidden or flagged when source/citation fields are missing.
- [x] Emit schema only when safe.
- [x] Run relevant checks before continuing.

## Checkpoint 28 - Affiliate Tracking Upgrade

- [x] Upgrade click analytics by broker, campaign, market, content, and date.
- [x] Confirm tracking avoids unnecessary sensitive data.
- [x] Confirm public affiliate links keep `rel="sponsored nofollow"`.
- [x] Run relevant checks before continuing.

## Checkpoint 29 - Internal Link Automation Upgrade

- [x] Add or improve rule handling for topic cluster, market, language, and priority pages.
- [x] Keep approval or semi-auto mode visible.
- [x] Avoid dense links, wrong language, and wrong market links.
- [x] Run relevant checks before continuing.

## Checkpoint 30 - AI Batch Safety

- [x] Add pre-import batch validation.
- [x] Add dry-run mode, reject report, and batch size limit.
- [x] Keep batch import draft-only and prevent bulk publishing.
- [x] Run final lint/build/type/test/audit checks.

## Closeout

- [x] Update long-lived specs.
- [x] Update `docs/CODEX_HANDOFF.md`.
- [x] Update `docs/ROADMAP.md`.
- [x] Record final verification notes and checkpoint results here.

## Verification Notes

- `node --check scripts/seo-audit.mjs` passed.
- `node --check scripts/validate-ai-batch.mjs` passed.
- `npm.cmd run ai:batch:validate` passed in dry-run mode against 50 pilot items and wrote `data/ai-content/last-batch-reject-report.json` with 0 rejects.
- `npm.cmd run content:audit` passed with 0 errors and 0 warnings.
- `npm.cmd run lint` passed.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd run build` passed.
- `npx.cmd prisma validate` passed with a temporary PostgreSQL-shaped `DATABASE_URL`.
- `npm.cmd run db:generate` initially hit a transient Windows Prisma DLL rename lock, then passed on retry.

## Blocking Notes

- `npm.cmd run seo:audit` could not complete against PostgreSQL because no database server was reachable at `localhost:5432`.
- `npm.cmd run db:migrate` remains blocked for the same PostgreSQL availability reason.
- No production deploy was performed.
