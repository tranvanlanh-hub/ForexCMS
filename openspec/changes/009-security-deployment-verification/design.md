# Design: Security and Deployment Verification

## Admin protection

Use Next.js middleware to protect every `/admin` route before the admin UI is rendered.

The minimal mechanism is HTTP Basic Authentication backed by environment variables:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

If either value is missing, `/admin` is locked with a service-unavailable response. This prevents accidental public exposure when a deployment is missing secrets.

Public routes such as `/`, `/sitemap.xml`, `/robots.txt`, and `/{market}/{content-type}/{slug}/` remain outside the middleware matcher.

## Database policy

The Prisma datasource must use PostgreSQL via `DATABASE_URL`. Cloudflare D1 bindings, D1 adapters, and D1 seed/migration artifacts must not be part of the active app/deploy configuration.

Migrations are run against PostgreSQL with:

```powershell
npm.cmd run db:migrate
```

Seed data for smoke checks is loaded with:

```powershell
npm.cmd run db:seed
```

## Cloudflare runtime variables

Preview deployments need:

- `DATABASE_URL` as a Cloudflare secret.
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` as Cloudflare secrets.
- S3 credentials as Cloudflare secrets.
- `APP_URL` and non-secret S3 runtime values as environment variables after the preview URL/bucket are known.

## Verification

Run lint and build. Run a Cloudflare dry-run check if credentials and local tooling allow it. Smoke-test public routes and confirm `/admin` is not accessible without credentials.
