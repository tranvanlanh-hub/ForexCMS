# Verification: Production broker research import

Verified on 2026-09-15 against the Vultr production VPS.

- Pre-change database backup exists on the VPS and under the ignored local
  `backups/postgres/` directory; SHA-256 matched after transfer.
- Release: `/var/www/marketgb/releases/20260915151204`.
- Migration `202609150900_broker_profile_review_fields` applied successfully;
  production now records 12 completed migrations.
- Import result: 36 requested, 36 created, 0 missing, 0 existing rows modified.
- Database result: 36 brokers, priority minimum 1, maximum 36, 36 distinct
  priorities; all 36 are `DRAFT`; zero rows have any review rating populated.
- HTTP result: loopback `/` 200, `/admin/login/` 200, unauthenticated broker list
  and create routes 307 to login, and public `https://marketgb.com/` 200.
- Deployed server bundle contains the `Legal company name` Broker Form label.
- No error-priority `marketgb-web` journal entries appeared in the ten-minute
  deployment verification window.
