# Cloudflare Deploy

See the root `DEPLOYMENT.md` for the full preview deployment checklist.

This project deploys to Cloudflare Workers as `content-hub-cms`. Preview deploys use the separate Wrangler environment `preview` with Worker name `content-hub-cms-preview`.

Use an API token for the Cloudflare account that owns this project. Do not use the machine's default Wrangler login when deploying this project.

## API token

Create the token from the Cloudflare account for `tranvanlanhtink31b@gmail.com`.

Recommended permissions:

- Account: Account Settings Read
- Account: Workers Scripts Edit
- User: User Details Read
- User: Memberships Read
- Zone: Workers Routes Edit, if deploying to a custom domain

If the token has access to more than one account, also set `CLOUDFLARE_ACCOUNT_ID`.

## PowerShell preview check

Run this before any preview deploy:

```powershell
$env:CLOUDFLARE_API_TOKEN="paste-token-here"
$env:CLOUDFLARE_ACCOUNT_ID="paste-account-id-here-if-needed"
npm.cmd run preview:check
```

`preview:check` builds the Vinext output and runs a Vinext Cloudflare dry-run against the preview environment only.

## PowerShell preview deploy

Only run after explicit user confirmation:

```powershell
$env:CLOUDFLARE_API_TOKEN="paste-token-here"
$env:CLOUDFLARE_ACCOUNT_ID="paste-account-id-here-if-needed"
npm.cmd run deploy:preview
```

## Required runtime secrets

Set preview secrets before relying on dynamic CMS routes:

```powershell
$env:CLOUDFLARE_API_TOKEN="paste-token-here"
npx.cmd wrangler secret put DATABASE_URL --env preview
npx.cmd wrangler secret put AUTH_PASSWORD_PEPPER --env preview
npx.cmd wrangler secret put AUTH_ENCRYPTION_KEY --env preview
npx.cmd wrangler secret put S3_ACCESS_KEY_ID --env preview
npx.cmd wrangler secret put S3_SECRET_ACCESS_KEY --env preview
```

The current app uses Prisma with PostgreSQL. On Cloudflare Workers, use a Workers-compatible connection path such as Prisma Accelerate for `DATABASE_URL`.

Do not use Cloudflare D1 as the core CMS database.

`/admin` is protected by the password + TOTP flow in `docs/ADMIN_AUTH.md`. Apply the committed auth migration and run the interactive admin setup against the intended database before deployment. Missing configuration fails closed.
