# Design: Cloudflare preview deploy prep

## Runtime target

The project uses Cloudflare Workers through Vinext. `wrangler.jsonc` remains the source config and `vinext build` generates `dist/server/wrangler.json`.

## Preview environment

Preview deploys use a separate Wrangler environment:

```text
env.preview.name = content-hub-cms-preview
```

This keeps preview validation and deploy commands separate from the top-level production Worker.

## Database

The primary database remains PostgreSQL via Prisma and `DATABASE_URL`.

On Cloudflare Workers, `DATABASE_URL` must use a Workers-compatible PostgreSQL access path, such as Prisma Accelerate or another supported pooled/proxied PostgreSQL endpoint. Cloudflare D1 is not introduced.

## Storage

Storage remains S3-compatible via environment variables and the `lib/storage` boundary.

Cloudflare R2 can be used by providing S3-compatible values:

```text
S3_ENDPOINT
S3_REGION
S3_BUCKET
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_PUBLIC_BASE_URL
```

Secrets stay in Cloudflare secrets or local ignored env files, not committed config.

## Verification

The final check must run:

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run preview:check`

`preview:check` performs a Vinext build and Vinext Cloudflare dry-run for the preview environment only.

Actual preview deploy, after explicit user confirmation, uses `npm.cmd run deploy:preview`.
