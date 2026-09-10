# Tasks: Broker data, review, and comparison foundation

- [x] Add BrokerFact schema and migration.
- [x] Add helper functions for parsing, grouping, and displaying sourced facts.
- [x] Upgrade Broker Manager create/edit/list pages for sourced fact data.
- [x] Upgrade BrokerReview public rendering to show cited facts.
- [x] Add BrokerComparison foundation route and ItemList schema.
- [x] Update seed data without hard-coded affiliate URLs.
- [x] Run Prisma validation/generate, lint, and build.
- [x] Update docs and specs after completion.

## Verification

- `npx.cmd prisma validate`: passed with temporary PostgreSQL `DATABASE_URL`.
- `npm.cmd run db:generate`: passed after stopping the workspace Next dev server that was holding the Prisma engine DLL.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
