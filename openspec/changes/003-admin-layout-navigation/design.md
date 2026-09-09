# Design: Admin Layout And Navigation Foundation

## Approach

The admin area uses a dedicated `app/admin/layout.tsx` so public pages continue to render through the root layout only. Navigation metadata lives in a small shared module and is consumed by both the sidebar and dashboard overview.

## Routes

```text
/admin
/admin/content
/admin/templates
/admin/brokers
/admin/affiliate-links
/admin/seo
/admin/url-routing
/admin/ai-import
/admin/settings
```

## UI behavior

- Desktop uses a persistent left navigation.
- Mobile stacks navigation above the content area.
- Active route is highlighted client-side.
- Pages are explicit placeholders with module scope, planned data entities, and next actions.

## Constraints

- Admin pages do not import Prisma or call storage/affiliate services in this change.
- Public frontend files are not modified unless needed for shared foundation.
- Placeholder copy must not imply completed CRUD functionality.
