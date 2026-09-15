# Post-cutover reseed plan

Author: Claude (planning session 2026-09-15)
Trigger: VPS cutover wiped the production DB. Admin `/admin/content/new` shows
"Seed data needed" until at least one `Market` (`status=ACTIVE`) and one
`Template` (`isActive=true`) exist.

## Root cause

`app/admin/content/new/page.tsx` blocks the form when:

```ts
if (options.markets.length === 0 || options.templates.length === 0) {
  return <SeedDataNeeded />;
}
```

The same gate fires on `/admin/ai-import`. So nothing can be authored until
both rows exist.

## Decision matrix

| Option | What runs | Time on prod DB | Realism |
|---|---|---|---|
| A. `db:seed` only | Seed markets + templates + skeleton brokers/categories/topics | ~10s | Forms unlock; no draft content |
| B. A + `content:pilot:generate` + admin import | Adds 50 rule-based drafts from `data/ai-content/pilot-50-drafts.json` | ~15-20 min manual paste | Generic markdown, not Claude-written |
| C. B + LLM batch (Claude/OpenAI per `docs/AI_CONTENT_BRIEF_SCHEMA.md`) | Real prose via API | +20-60 min + token cost | Highest quality |
| D. Restore Postgres backup | `npm run restore:postgres` | Minutes | Fastest if `.sql` from before 2026-09-13 cutover still exists |

## Why "B" in isolation is weak

`scripts/generate-content-pilot.mjs:101` (`bodyFor`) emits a fixed markdown
template with the title, market label, and a couple of generic FAQ pairs.
There is no LLM call. The previous "AI demo data felt solid" was almost
certainly created through a bulk-import CLI path that has since been removed —
today the import path is only the single-item `/admin/ai-import` form
(`app/admin/ai-import/actions.ts`), which would require 50 manual pastes.

## Recommended next steps (in order)

1. **Try D first** — locate the most recent `backup-postgres` artifact. If
   present, restore. This is the only path that preserves real content from
   before the cutover.
2. **If D fails** — run A from a workstation with `.env.local` pointing at the
   Neon prod URL:
   ```bash
   node --env-file=.env.local node_modules/prisma/build/index.js migrate deploy
   npm run db:seed
   ```
3. **If pilot content is still wanted** — implement a one-shot CLI bulk
   importer (not yet on disk) before running B. Suggested shape:
   - Read `data/ai-content/pilot-50-drafts.json`.
   - For each draft, run the same Prisma transaction used by
     `aiImportAction` in `app/admin/ai-import/actions.ts` (so validation,
     translation group, canonical path, broker/affiliate token resolution all
     match production).
   - Exit non-zero on first failure with the draft id.
   - Estimated dev: ~30 min. Run time after that: <30s for 50 drafts.
4. **If prose quality matters** — wrap step 3 with an LLM step that rewrites
   `draft.body` per `docs/AI_CONTENT_BRIEF_SCHEMA.md` before insert. Requires
   `ANTHROPIC_API_KEY` (or OpenAI equivalent) and rate-limit handling.

## Open questions for next session

- Do we still have a Postgres `.sql` dump from before commit `9d9edfc`
  (cutover)? Check `~/backups/postgres/` or the Cloudflare R2 bucket named in
  `DEPLOYMENT.md`.
- Should the bulk importer live at `scripts/bulk-import-pilot.mjs` so future
  reseeds are a single command? (Recommended yes — eliminates the manual
  paste bottleneck that caused this plan to exist.)