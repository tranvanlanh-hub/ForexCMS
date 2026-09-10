# Design: Template Block Renderer Foundation

## Decisions

- Keep `ContentItem.body` as JSON and continue accepting markdown from the admin form.
- Store new content as `{ format: "markdown", markdown, blocks }`.
- Derive blocks at render time for legacy content that only has markdown.
- Treat `Template.allowedBlocks`, `Template.requiredBlocks`, `Template.schemaTypes`, `Template.ctaSlots`, and `Template.internalLinkSlots` as the template registry for this MVP layer.
- Render only known block types. Unknown/future blocks are ignored until implemented.

## Block structure

Supported block types:

- `intro`
- `summary`
- `table_of_contents`
- `body`
- `faq`
- `pros_cons`
- `cta_slot`

Markdown conventions:

- Content before the first `##` becomes `intro`.
- `## Summary`, `## Key takeaways`, or `## Takeaways` becomes `summary`.
- Regular `##` sections become `body` and feed `table_of_contents`.
- `## FAQ`, `## FAQs`, or `## Frequently asked questions` with `###` questions becomes `faq`.
- `## Pros`, `## Cons`, or `## Pros and cons` becomes `pros_cons`.
- CTA slots come from `Template.ctaSlots` and render through the affiliate resolver when a broker is attached.

## SEO behavior

- FAQ JSON-LD is built from FAQ blocks.
- Article JSON-LD uses table-of-contents headings and summary items as `articleSection` when present.
- Breadcrumb JSON-LD remains unchanged.

## Publishing validation

When content is published, required template blocks are derived from markdown and compared with `Template.requiredBlocks`. Missing required blocks return admin form errors.

## Boundaries

This change intentionally avoids a page builder. Editors still write markdown, and templates define allowed structure plus render behavior.
