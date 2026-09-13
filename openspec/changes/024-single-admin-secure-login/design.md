# Design: Single-admin secure login

## Credentials

The singleton `AdminAccount` stores a PBKDF2-HMAC-SHA-256 password hash with
600,000 iterations and a random 128-bit salt. A minimum 256-bit pepper is kept
outside PostgreSQL. Passwords are never reversibly encrypted.

The TOTP seed is encrypted with AES-256-GCM using a separate environment key.
Recovery codes contain sufficient random entropy, are normalized before use,
and are stored only as keyed hashes. The setup command writes the account only
after the owner confirms a valid TOTP code.

## Authentication flow

Password verification creates a random five-minute `AdminLoginChallenge`.
Successful TOTP or unused recovery-code verification consumes that challenge
and creates an opaque 256-bit session token. Only SHA-256 token hashes are
stored in PostgreSQL.

Sessions have a 30-minute idle timeout and eight-hour absolute timeout. Cookie
flags are HttpOnly, SameSite=Strict, Path=/, and Secure on preview/production.
The production cookie uses the `__Host-` prefix. Logout revokes the database
session before deleting the cookie.

## Authorization and request integrity

Proxy performs an optimistic cookie-presence redirect only. The admin layout
and every mutation verify the active database session. Mutations additionally
verify same-origin headers and a session-derived CSRF token. Client-provided
role headers are removed and never treated as authoritative.

Failed login and TOTP attempts are throttled. Network identifiers are HMACed
before storage; raw IPs, credentials, codes, cookies, and affiliate destinations
are not written to security events.

## Portability

All cryptography uses Web Crypto primitives available on Cloudflare Workers and
Node.js. PostgreSQL remains the only auth state store, keeping the design portable
to a Linux VPS.
