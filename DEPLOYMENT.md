# Deployment

## Current target

This project is prepared for a Cloudflare Workers preview deployment using Vinext.

- Worker config: `wrangler.jsonc`
- Generated deploy config: `dist/server/wrangler.json`
- Preview environment name: `content-hub-cms-preview`
- Production deploy: `content-hub-cms` on the custom domain `marketgb.com`.

## Readiness status

The preview was verified on 2026-09-10 at https://content-hub-cms-preview.content-hub-stack.workers.dev. Production deployment to `marketgb.com` was authorized on 2026-09-13. The current source replaces its former Basic Auth with the database-backed password + TOTP flow documented in `docs/ADMIN_AUTH.md`. The old remote `content-hub-cms` Worker has a legacy D1 binding; the current production target uses Neon PostgreSQL instead.

Ready:

- Next.js App Router build path exists through `vinext build`.
- Cloudflare Workers config exists and uses `nodejs_compat`.
- Preview environment is separated under `env.preview`.
- No Cloudflare D1 binding is configured.
- Prisma datasource is PostgreSQL through `DATABASE_URL`.
- Media storage is represented as S3-compatible environment config through `lib/storage`.

Needs values before preview deploy:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID` if the API token can access more than one account
- `DATABASE_URL`
- `AUTH_PASSWORD_PEPPER`
- `AUTH_ENCRYPTION_KEY`
- `APP_URL`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL`

## Database policy

PostgreSQL is the primary CMS database. Do not replace it with Cloudflare D1 for the core CMS.

The implemented Worker path uses the generated Prisma edge client with the Neon adapter when APP_ENV is preview/production and DATABASE_URL is a Neon PostgreSQL URL. Local scripts use the Node Prisma client. Set APP_ENV explicitly; this implementation does not automatically configure Prisma Accelerate. Keep credentials in ignored UTF-8 environment files without a BOM or in the platform secret store.

`npm.cmd run build:vinext` temporarily removes `.env.local` from Vinext discovery, restores it even when the build fails, and scans generated output for known local secret values. Do not bypass this wrapper for deployment builds.

Verify migrations against Neon before relying on dynamic CMS routes. Prisma CLI does not automatically load `.env.local`; these commands load it explicitly. For deployed/shared databases use migrate deploy, not migrate dev/reset:

```powershell
node --env-file=.env.local node_modules/prisma/build/index.js migrate status
node --env-file=.env.local node_modules/prisma/build/index.js migrate deploy
```

All seven migrations were already applied with matching checksums in checkpoint 37; no migration write was needed. Existing pilot data also passed, so seed was not rerun. Only for an empty/reset preview database needing test fixtures:

```powershell
npm.cmd run db:seed
```

Seed affiliate destination data is written only into the centralized `AffiliateLink` table. Set `DEMO_AFFILIATE_DESTINATION_URL` only when a preview database needs a real test CTA; do not place affiliate URLs directly in Markdown content or templates.

## S3-compatible storage policy

Media storage must remain S3-compatible and go through the storage boundary under `lib/storage`.

Cloudflare R2 can be used for preview by setting:

```text
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=forex-cms-media-preview
S3_PUBLIC_BASE_URL=https://media-preview.example.com
```

Use separate preview credentials with the minimum required object permissions. Do not hard-code R2 calls throughout the app.

## Cloudflare variables and secrets

Use `.env.cloudflare.example` as the checklist.

Set required preview secrets:

```powershell
$env:CLOUDFLARE_API_TOKEN="paste-token-here"
$env:CLOUDFLARE_ACCOUNT_ID="paste-account-id-here-if-needed"
npx.cmd wrangler secret put DATABASE_URL --env preview
npx.cmd wrangler secret put AUTH_PASSWORD_PEPPER --env preview
npx.cmd wrangler secret put AUTH_ENCRYPTION_KEY --env preview
npx.cmd wrangler secret put S3_ACCESS_KEY_ID --env preview
npx.cmd wrangler secret put S3_SECRET_ACCESS_KEY --env preview
```

Keep `DATABASE_URL`, `AUTH_PASSWORD_PEPPER`, `AUTH_ENCRYPTION_KEY`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` as Cloudflare secrets, not committed files.

`/admin` uses a single database-backed admin account with password hashing, TOTP, recovery codes, and revocable sessions. Apply the auth migration and complete `npm.cmd run admin:setup` before testing. Missing auth secrets or setup data fail closed. See `docs/ADMIN_AUTH.md`.

Set non-secret values in the Cloudflare dashboard or `wrangler.jsonc` after the exact preview URL and bucket are known:

```text
APP_URL
S3_ENDPOINT
S3_REGION
S3_BUCKET
S3_PUBLIC_BASE_URL
```

## Preview verification

Run local checks:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run preview:check
```

`preview:check` builds the Vinext output and runs a Vinext Cloudflare dry-run for the `preview` environment. It validates setup without publishing a production Worker.

## Deploy commands

Preview deploy only after the user confirms:

```powershell
$env:CLOUDFLARE_API_TOKEN="paste-token-here"
$env:CLOUDFLARE_ACCOUNT_ID="paste-account-id-here-if-needed"
npm.cmd run deploy:preview
```

Production deploy uses `npm.cmd run deploy:cloudflare` after the production checks and secrets are complete.
