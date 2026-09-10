# Proposal: Security and Deployment Verification

## Why

The CMS has been deployed or prepared for deployment, but the admin backend must not remain publicly accessible. The deployment configuration also needs a verification pass to ensure the project still follows the agreed infrastructure policy: PostgreSQL through `DATABASE_URL`, no Cloudflare D1 for the core CMS, S3-compatible media config, and centralized affiliate links.

## Scope

- Add a minimal protection layer for `/admin`.
- Keep public reader routes available.
- Verify and document Cloudflare preview/runtime environment requirements.
- Align database configuration with PostgreSQL and remove D1-specific app configuration.
- Run available lint/build/deployment checks.
- Update handoff, roadmap, and this change checklist.

## Non-goals

- Full user account, session, role, or permission management.
- Production deployment.
- Migration to Cloudflare D1.
- New CMS CRUD features.
