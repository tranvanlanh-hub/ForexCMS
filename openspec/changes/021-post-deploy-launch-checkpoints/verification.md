# Verification report — checkpoints 36–40

Date: 2026-09-10 (Asia/Bangkok). Preview: https://content-hub-cms-preview.content-hub-stack.workers.dev.

## 36 — PASS

Read requested context, all specs and recent changes 018–020 before implementation. Captured per-file Git status in git-inventory-before.txt; see repo-audit.md for commit groups. Existing source changes retained. Updated .gitignore for generated artifacts; git check-ignore and git diff --check passed. No staging/commit/push.

## 37 — PASS after fixes

- Found a leading UTF-8 BOM in .env.local and .env.cloudflare: Node interpreted the first key incorrectly. Removed only the BOM, preserving values; private files stay ignored.
- Local DATABASE_URL is Neon PostgreSQL, pooled, sslmode=require. Preview settings confirm DATABASE_URL secret exists plus APP_ENV=preview. Secret value cannot be read back; authenticated admin and repaired public content provide runtime evidence of the expected database. This is not a byte-for-byte secret comparison or proof of the intended future production branch.
- Prisma migrate status: PASS; seven migrations applied. Database migration checksums match all seven local files (neon-results.json). No migration or seed rerun necessary; no reset/migrate dev on shared Neon.
- Initial pilot check failed in network sandbox; authorized network execution passed. This was an access restriction, not a Neon schema defect.
- Initial SEO command failed because .env.local was not loaded; fixed the script to load it consistently with pilot check. It now exits nonzero on audit issues so a report containing issues cannot silently pass a launch gate.
- SEO report then found 12 orphan rows. Repaired 12 same-market/language further-reading references with accepted internal links, content snapshots under ignored backups/pilot-repair and ContentRevision rows. Existing published status, canonical and affiliate destination values preserved. No new content published.

| Command | Final result | Notes |
|---|---|---|
| npm.cmd run db:generate | PASS | Node + edge clients generated |
| Prisma migrate status with .env.local explicitly loaded | PASS | 7 migrations; up to date |
| Read-only migration checksum comparison | PASS | 7/7 match |
| npm.cmd run pilot:check | PASS | 16 published pilot, 18 active affiliate links, 16 accepted links |
| npm.cmd run seo:audit | PASS | 16 scanned; 0 issues after repair |
| npm.cmd run content:audit | PASS | 50 fixtures; 0 errors, 0 warnings |
| npm.cmd run ai:batch:validate | PASS | 50 accepted; 0 rejected; dry-run; no imports |
| npm.cmd run db:seed | NOT RUN | Existing seed sufficient; avoids overwrite |
| migrate deploy | NOT RUN | No pending migrations; status confirmed instead |

## 38 — PASS after rendered-link repair and cache refresh

See smoke-results.json for final per-assertion evidence. Required homepage/admin/sitemap/article/review/comparison/CTA checks passed. Added a full pilot crawl:

- Homepage 200; sitemap index 200; content sitemap 200 with 16 same-origin URLs matching published rows.
- All 16 global/Vietnamese public pilot routes 200, one H1, correct preview canonical.
- /global/compare/exness-vs-samplefx/ 200 with both broker names. This is a demo comparison, not production content.
- /admin/content/ missing and invalid auth: 401 + Basic challenge + no-store. Correct local credentials: 200, database content present, no demo fallback. Separate header check confirmed authenticated admin no-store, must-revalidate and Cloudflare BYPASS.
- /global/articles/ai-import-pilot-draft/ 404; absent from published sitemap.
- Configured test affiliate link: 302, destination equal to the private DEMO_AFFILIATE_DESTINATION_URL, no-store. External destination was not followed. Five full smoke runs each exercised a test redirect, so up to five synthetic click events may be present; do not count them as real conversions.
- Two pre-existing accepted links from FAQ pages were not actually rendered. Added further-reading sections outside the summary block for those two pages, preserving the existing links. Total 14 pilot articles amended across checkpoints 37–38; 12 new link records, 2 existing ones retained.
- Application cache kept old FAQ bodies temporarily after direct DB edits. Final smoke after TTL/SWR refresh confirmed every one of the 16 accepted link targets appears in its source HTML. Do not confuse a passing DB audit with visible public links. Normal content editing should use admin invalidation.
- robots.txt currently allows public crawling, disallows /admin/, and names the preview sitemap. Preview indexing isolation remains a production launch gate.

## 39 — Checklist complete; production gates NOT complete

See docs/PRODUCTION_LAUNCH_CHECKLIST.md. Remote preview has no D1 binding. The old root Worker content-hub-cms DOES still have a legacy D1 DB binding, and its settings lack the required CMS secrets/APP_URL/APP_ENV. This pre-existing remote state was not modified or used as a database in this session.

Secret scan found no known credentials/private keys/Neon credential URLs in the scanned working files or two commits; scope and limits are in secret-scan.json. Full Neon backup/restore is pending; pg_dump is absent from PATH. Local JSON repair snapshots are not full database backups. Strong admin credentials, domain, production runtime configuration, media decision, real reviewed content and explicit deploy approval remain owner gates.

## 40 — Plan complete

See docs/POST_LAUNCH_CONTENT_PLAN.md: 50 real prepared articles = 20 published + 30 drafts at launch; 100 = 40 + 60 by weeks 1–6; 250 = 100 + 150 by weeks 7–16, conditional on quality and indexing. Batches capped at 50, draft-only import, manual review/publish, staged clusters and explicit stop rules. No actual batch generation/import/publication performed.

## Repository checks and deployment state

- npm.cmd run lint: PASS.
- npm.cmd run build: PASS; one existing Turbopack warning about broad WASM import file matching from the edge Prisma client; not a build failure, monitor bundle/build performance before scale.
- npm.cmd run typecheck: PASS after build.
- New/edited operational script syntax checks: PASS.
- No dedicated test runner is configured; actual DB/HTTP checks are the relevant integration evidence.
- Last observed preview deployment: 2026-09-09T18:23:26.714392Z, version 88503f84-9e3f-4ebe-81bc-7fc12655448a. It predates this session.
- No preview or production deploy, secret update, domain change, Git commit or push in this session. Local script/doc changes remain uncommitted. Only the described pilot content/link repair changed Neon.

Current conclusion: **preview ready for technical testing; production NOT ready**. Production content quality and infrastructure gates must be completed before requesting final deployment approval.
