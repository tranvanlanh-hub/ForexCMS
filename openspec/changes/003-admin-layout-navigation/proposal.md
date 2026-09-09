# Proposal: Admin Layout And Navigation Foundation

## Goal

Create a clear admin layout at `/admin` with stable navigation for the CMS modules planned in OpenSpec.

## Scope

- Add a reusable admin layout for all `/admin/*` routes.
- Add navigation entries for Dashboard, Content, Templates, Brokers, Affiliate Links, SEO, URL Routing, AI Import, and Settings.
- Add lightweight placeholder pages for each admin module so navigation lands on real routes.
- Keep public frontend routes and styling behavior intact.

## Out of scope

- No CRUD workflows.
- No authentication or role management.
- No database reads/writes from admin pages.
- No affiliate link resolver changes.
- No public renderer changes.
