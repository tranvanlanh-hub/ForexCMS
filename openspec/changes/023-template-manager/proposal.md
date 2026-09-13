# Proposal: Template Manager

## Problem

`/admin/templates` is still a placeholder even though content creation,
publish validation, public block rendering, schema checks, CTA slots, and
internal-link behavior already depend on database-backed Template records.
Operators currently have to change seed code or edit PostgreSQL directly.

## Scope

- Replace the placeholder with a database-backed template list.
- Add create and edit screens for template identity, kind, active state,
  allowed/required blocks, schema types, CTA slots, and internal-link slots.
- Validate template configuration before saving.
- Show how many content items use each template.
- Keep content authoring Markdown-first; do not add a page builder or delete
  templates in this change.

## Outcome

An administrator can maintain the content structures already enforced by the
CMS without editing code or touching the database directly.
