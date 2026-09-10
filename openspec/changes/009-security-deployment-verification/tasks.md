# Tasks: Security and Deployment Verification

- [x] Create OpenSpec change files.
- [x] Inspect current deploy/build configuration.
- [x] Protect `/admin` with minimal auth or public-access blocking middleware.
- [x] Remove active Cloudflare D1 usage from code/config.
- [x] Confirm affiliate links remain centralized and are not hard-coded in content.
- [x] Check database migration/seed flow and Cloudflare env var documentation.
- [x] Check public routes: `/`, `/admin`, `/sitemap.xml`, `/robots.txt`, `/global/articles/forex-trading-basics/` when data is available.
- [x] Run lint/build/test or equivalent available checks.
- [x] Update `docs/CODEX_HANDOFF.md`, `docs/ROADMAP.md`, and this checklist.

## Verification notes

- `npm.cmd run db:generate`: passed after clearing stale local smoke-test Node processes.
- `npx.cmd prisma validate`: passed with a PostgreSQL `DATABASE_URL` supplied in the process environment.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `npm.cmd run preview:check`: passed; Vinext build and Cloudflare dry-run completed without deploying.
- Cloudflare production Worker `content-hub-cms` has deployments, latest observed deployment created at `2026-09-09T14:29:59.809Z` serving version `61921371-c388-4d55-9282-4958bcb298aa` at 100%.
- Cloudflare preview Worker `content-hub-cms-preview` does not exist yet, so preview secrets and remote preview smoke checks could not be verified.
- Cloudflare production Worker secret list is empty at verification time.
- Local production smoke test with admin credentials:
  - `/`: `200`
  - `/admin/` without auth: `401`
  - `/admin/` with valid Basic Auth: `200`
  - `/sitemap.xml`: `200`
  - `/robots.txt`: `200`
  - `/global/articles/forex-trading-basics/`: `404` because no local PostgreSQL data/migration/seed was available in this session.
- Local production smoke test without `ADMIN_USERNAME`/`ADMIN_PASSWORD`: `/admin/` returned `503`.
