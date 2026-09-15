# Tasks: Production broker research import

- [x] Add the reviewed 36-broker JSON dataset.
- [x] Add a dry-run-by-default, explicit `--apply` import command.
- [x] Validate JSON/script syntax, Prisma schema/client, lint, typecheck and build.
- [x] Create and download a pre-change production PostgreSQL backup.
- [x] Deploy the new Broker Manager release and apply the migration.
- [x] Import all 36 brokers as drafts.
- [x] Verify database counts, priorities, statuses, empty ratings, HTTP routes,
  deployed field labels and recent service errors.
- [x] Update the current handoff with verified production state and rollback data.
