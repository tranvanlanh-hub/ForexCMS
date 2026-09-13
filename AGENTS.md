# MarketGB working instructions

Before changing code, database data, infrastructure, authentication, or deploying,
read `docs/CODEX_HANDOFF.md`. Its topmost dated status is the authoritative current
handoff and supersedes older historical notes later in that file.

Also read the relevant OpenSpec change/spec and the focused operations document:

- Cloudflare production: `docs/CLOUDFLARE_DEPLOY.md`
- Admin authentication: `docs/ADMIN_AUTH.md`
- Launch status and remaining editorial risks: `docs/PRODUCTION_READINESS.md`
- Architecture and roadmap: `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`

Never copy secrets or credential values from ignored environment files into source,
logs, commits, documentation, or chat. Keep Cloudflare database clients scoped to
the request; a global Prisma/Neon client can violate Workers request I/O isolation.

After material work, update the top of `docs/CODEX_HANDOFF.md` with the verified
state, migrations/data changes, deployed Worker version, validation performed, and
remaining blockers. Separate verified facts from planned or incomplete work.
