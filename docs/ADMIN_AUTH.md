# Single-admin authentication

MarketGB CMS has one private administrator account. There is no public registration,
email reset flow, or user-management screen.

## Security design

- Passwords use PBKDF2-HMAC-SHA-256 with 100,000 iterations, a random per-password salt, and a server-side pepper. This value is intentionally kept within the Cloudflare Workers CPU budget and must match in both runtime verification and the admin setup script.
- The TOTP secret is encrypted with AES-256-GCM. Google Authenticator, Microsoft Authenticator, Authy, and 1Password are compatible.
- The browser receives a random opaque session token in an HttpOnly, Secure, SameSite=Strict cookie. PostgreSQL stores only its SHA-256 hash.
- Sessions expire after 30 minutes idle and after 8 hours absolutely. Logout revokes the database session.
- Admin mutations require a valid database session, same-origin request, and session-bound CSRF token.
- Login attempts are rate-limited without storing raw IP addresses. Security logs never contain passwords, TOTP secrets, recovery codes, cookies, or raw IPs.

## First-time setup

Do this separately for each preview or production database.

1. Generate new independent secrets:

   ```powershell
   npm.cmd run admin:generate-secrets
   ```

2. Put the generated values in the local ignored environment file and the target platform secret manager as `AUTH_PASSWORD_PEPPER` and `AUTH_ENCRYPTION_KEY`. Never commit or paste them into documentation.

3. Apply the committed Prisma migration to the intended database. On a deployed/shared database use `prisma migrate deploy`, never `migrate dev` or reset.

4. Run the interactive setup from a private terminal:

   ```powershell
   npm.cmd run admin:setup
   ```

   Choose a unique password of 16-128 characters. Scan the QR code, confirm the current TOTP code, then store the displayed one-time recovery codes offline. The account is written only after TOTP confirmation succeeds.

Running setup again rotates the password and TOTP secret, replaces recovery codes,
and revokes every existing session. Database or server access is therefore the
intentional recovery path if both the authenticator and recovery codes are lost.

## Deployment secrets

The application requires these secrets for admin authentication:

- `DATABASE_URL`
- `AUTH_PASSWORD_PEPPER`
- `AUTH_ENCRYPTION_KEY`

Preview and production must use different values. Deploying the new source before
applying its migration and creating the admin account leaves admin sign-in
unavailable; it does not expose the CMS.
