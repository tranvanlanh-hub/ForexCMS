# Tasks: Template Manager

- [x] Read the roadmap, handoff, long-lived template/content specs, and current
  placeholder implementation.
- [x] Record the bounded Template Manager change before implementation.
- [x] Add a shared registry for supported blocks, schemas, and slots.
- [x] Build database-backed template list, create, and edit screens.
- [x] Add server-side validation and create/update actions.
- [x] Revalidate dependent admin and public content after writes.
- [x] Verify authenticated routes against the existing database.
- [x] Run lint, typecheck, and production builds.
- [x] Update template spec, roadmap, and handoff.

## Verification

- Authenticated `/admin/templates/`, `/admin/templates/new/`, and an existing
  template edit route returned 200 against Neon; unauthenticated list returned
  401. The list no longer renders the generic module placeholder.
- No template record was created or modified during verification.
- `npm.cmd run lint`: passed.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed; the existing Prisma WASM broad-pattern warning
  remains.
- `npm.cmd run build:vinext`: passed.
