# Tasks: Single-admin secure login

- [x] Add singleton admin, challenge, session, recovery, throttle, and security-event schema.
- [x] Add a non-destructive committed PostgreSQL migration.
- [x] Implement password hashing, AES-GCM secret encryption, TOTP replay protection, and recovery codes.
- [x] Implement password and second-factor login pages plus logout.
- [x] Require database sessions, same-origin validation, and CSRF tokens for admin mutations.
- [x] Add throttling, generic errors, safe return paths, hardened cookies, CSP, frame denial, and CDN no-store headers.
- [x] Add interactive setup, secret generation, migration/deployment documentation, and a safe Vinext build wrapper.
- [x] Pass Prisma validate, generate, lint, typecheck, Next build, Vinext build, dependency audit, and unauthenticated route smoke checks.
- [ ] Apply the migration to an explicitly selected database.
- [ ] Generate environment-specific secrets and enroll the owner's authenticator.
- [ ] Run authenticated password/TOTP/recovery/logout smoke checks on that database.
- [ ] Deploy only after explicit approval.
