# Checkpoint 36: repository inventory and proposed commits

Baseline HEAD: `28d44da2` (Deploy CMS foundation to Cloudflare). No commits or staging performed in this session.

`git-inventory-before.txt` lists every modified, deleted and untracked file at the start, including this change's initial documents. Pre-existing application work from changes 009-020 remains intact. In particular, deletion of the old prisma/d1 SQL files was already present; it was not performed in this session.

Ignored generated files: `.next-dev*.log`, `.wrangler-*.log`, `*.tsbuildinfo`, `.dev.vars.*`, `/backups/`, and the timestamped last batch reject report. Existing `.env.local` and `.env.cloudflare` remain ignored. Keep pilot fixtures/manifests under data/ versioned; they are not build artifacts.

Suggested commit sequence (review hunks where files overlap):

1. `Adopt Neon PostgreSQL runtime and retire local D1 artifacts`: package manifests, Prisma clients/schema/migrations, lib/db, Worker types/config, proxy/auth, environment examples and change 009. Keep all migrations together with the matching schema.
2. `Complete CMS editorial and public capabilities`: app/components/lib for templates, locales, internal links, import, comparisons, analytics and content operations; seed/scripts/data and changes 010-019. Shared files such as admin/content/actions.ts contain multiple sessions, so split by reviewed hunks or keep this coherent integration group together.
3. `Add production operations foundation`: cache/observability, backup scripts, error boundaries and change 020. Include cache invalidation callers with their helpers.
4. `Verify deployed preview and prepare launch`: this change 021, .gitignore, SEO audit fix, smoke/repair evidence and current documentation.

Long-lived specs, roadmap and handoff span groups: stage matching hunks or commit their consolidated current state in the last group. Do not use a blanket git add before checking ignored secrets, fixtures and generated files. Run build/typecheck after integration; earlier groups are proposals, not claims of independently tested commits.

Verification: `git diff --check` passed; `git check-ignore` confirmed all listed artifact classes and private env files. No source file was deleted, reverted, staged, committed or pushed.
