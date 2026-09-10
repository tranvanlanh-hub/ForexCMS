# Backup, Restore, and VPS Migration

This checklist supports PostgreSQL plus S3-compatible media storage. It is portable across Cloudflare R2, MinIO, AWS S3-compatible storage, and a Linux VPS.

## Required Tools

- PostgreSQL client tools: `pg_dump`, `pg_restore`, `psql`.
- S3-compatible sync tool: `aws` CLI, `rclone`, or another operator-approved equivalent.
- Secure secret storage for production environment variables.

## Environment Variables

Never commit real values. Set these in the shell, CI secret store, Cloudflare secrets, PM2 ecosystem file, or systemd environment file:

```text
DATABASE_URL=
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=
APP_URL=
ADMIN_USERNAME=
ADMIN_PASSWORD=
```

## PostgreSQL Backup

Run:

```text
npm.cmd run backup:postgres
```

The script requires `DATABASE_URL` and writes a timestamped custom-format dump to `backups/postgres/` unless `BACKUP_DIR` is provided.

## PostgreSQL Restore

Run against the target VPS database:

```text
npm.cmd run restore:postgres -- --file backups/postgres/<dump-file>.dump
```

Before restore:

- Confirm the target `DATABASE_URL` points to the VPS database, not production source.
- Stop app writes or put the site in maintenance mode.
- Take a fresh backup of the target database if it already has data.

After restore:

- Run `npm.cmd run db:generate`.
- Run `npm.cmd run pilot:check` when pilot data exists.
- Smoke test `/sitemap.xml`, representative public URLs, affiliate redirect, and admin edit flow.

## Media Backup

Run:

```text
npm.cmd run backup:media
```

The script uses S3-compatible variables and `aws s3 sync` by default. It writes to `backups/media/<bucket>/` unless `MEDIA_BACKUP_DIR` is provided.

For R2, `S3_ENDPOINT` must be the account endpoint. For MinIO, it should be the MinIO API endpoint.

## VPS Linux Migration Checklist

- Provision Node.js version compatible with the app.
- Provision PostgreSQL and create a least-privilege database user.
- Provision S3-compatible media storage or point env vars to existing R2/S3 storage.
- Copy the app source and install dependencies with `npm ci`.
- Set environment variables outside git.
- Run `npm.cmd run db:generate` or `npm run db:generate` on Linux.
- Apply migrations with `npx prisma migrate deploy`.
- Restore PostgreSQL dump if migrating existing data.
- Sync media backup to the chosen S3-compatible bucket if changing media provider.
- Build with `npm run build`.
- Serve with a process manager such as PM2, systemd, or a container.
- Put Nginx/Caddy in front for TLS, compression, and request limits.
- Smoke test public routes, admin auth, sitemap chunks, SEO audit, affiliate click redirect, and logs.

## Safety Notes

- Do not log `DATABASE_URL`, S3 keys, admin password, cookies, or Authorization headers.
- Do not production deploy or cut traffic to a VPS until the restored database and media smoke tests pass.
- Keep at least one known-good database dump and one media snapshot before large content imports.
