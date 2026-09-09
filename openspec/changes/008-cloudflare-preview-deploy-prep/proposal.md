# Change 008: Cloudflare preview deploy prep

## Summary

Prepare the project for a Cloudflare Workers preview deployment without publishing production.

## Goals

- Check deployment readiness against the current Next.js/Vinext/Cloudflare setup.
- Document the preview deployment process.
- Prepare Cloudflare runtime variable and secret guidance.
- Keep PostgreSQL as the core CMS database.
- Keep storage S3-compatible through the existing adapter boundary.
- Avoid Cloudflare D1 as the primary database.

## Non-goals

- No production deploy.
- No migration from PostgreSQL to D1.
- No direct R2-specific storage implementation.
- No auth, CMS feature, or public rendering scope changes.
