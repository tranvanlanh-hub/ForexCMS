# Proposal: Basic Admin Content Manager

## Summary

Build the first database-backed Content Manager surface in the admin area.

## Scope

- Add an admin content list at `/admin/content`.
- Add basic create/edit forms for `ContentItem`.
- Support title, slug, market/language, content type, template, status, body, SEO title, and meta description.
- Generate hierarchical canonical paths with the pattern `/{market}/{content-type}/{slug}/`.
- Prevent publishing when required content or SEO fields are missing.
- Keep affiliate links outside raw content.

## Out of scope

- Rich block editor.
- Public content rendering.
- Authentication and permissions.
- Full Template Manager CRUD.
