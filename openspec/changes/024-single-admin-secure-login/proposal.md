# Proposal: Single-admin secure login

## Why

The CMS is operated by one owner. Browser Basic Authentication keeps a plaintext
password in runtime secrets, has no second factor, and cannot revoke individual
browser sessions. A private login flow is needed before production use.

## Scope

- Replace Basic Auth with one database-backed admin account.
- Add password hashing, TOTP, one-time recovery codes, revocable sessions,
  throttling, CSRF protection, logout, and an accessible login UI.
- Keep public routes, content URL architecture, PostgreSQL, and S3 boundaries unchanged.
- Do not add registration, email recovery, OAuth, invitations, or user management.

## Deployment boundary

This change creates a committed migration and operator setup workflow. It does
not apply the migration, create credentials, rotate remote secrets, or deploy.
