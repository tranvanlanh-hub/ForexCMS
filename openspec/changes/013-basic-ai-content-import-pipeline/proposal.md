# Change 013: Basic AI Content Import Pipeline

## Summary

Build the first usable AI Import Manager for single-draft import from Markdown frontmatter or JSON.

## Goals

- Let an admin paste AI output into `/admin/ai-import`.
- Parse Markdown frontmatter or JSON into CMS content fields.
- Validate routing, market, language, content type, template, body, SEO metadata, affiliate tokens, and broker mentions before saving.
- Save only draft content from AI import.
- Reject Markdown/HTML body content that contains hard-coded raw URLs.

## Non-goals

- Bulk import.
- AI generation inside the CMS.
- Automatic publishing from imported AI content.
- Rich schema-specific editor UI.
