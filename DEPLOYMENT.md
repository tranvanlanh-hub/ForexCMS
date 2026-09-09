# Deployment

## Current target

This project is prepared for a Cloudflare Workers preview deployment using Vinext.

- Worker config: `wrangler.jsonc`
- Generated deploy config: `dist/server/wrangler.json`
- Preview environment name: `content-hub-cms-preview`
- Production deploy: do not run without explicit user confirmation.

## Readiness status

The app is deploy-prepared, but a real preview deploy still needs Cloudflare account credentials and runtime secrets.

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
- `APP_URL`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL`

## Database policy

PostgreSQL is the primary CMS database. Do not replace it with Cloudflare D1 for the core CMS.

For Cloudflare Workers preview, `DATABASE_URL` must point to a Workers-compatible PostgreSQL connection path, such as Prisma Accelerate or another supported pooled/proxied PostgreSQL endpoint. A normal direct local PostgreSQL URL is fine for local Next.js development, but it is not enough for a deployed Worker.

Run migrations against the PostgreSQL database before relying on dynamic CMS routes:

```powershell
npm.cmd run db:migrate
```

If seed data is needed for preview smoke testing:

```powershell
npm.cmd run db:seed
```

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
npx.cmd wrangler secret put S3_ACCESS_KEY_ID --env preview
npx.cmd wrangler secret put S3_SECRET_ACCESS_KEY --env preview
```

Keep `DATABASE_URL`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` as Cloudflare secrets, not committed files.

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

Production deploy is intentionally not included as a default workflow. Get explicit confirmation before running any production deploy command.
