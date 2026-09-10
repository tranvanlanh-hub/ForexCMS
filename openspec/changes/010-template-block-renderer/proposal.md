# Change 010: Template Block Renderer Foundation

## Goal

Build the first practical Template System rendering layer without introducing a complex page builder.

## Scope

- Upgrade the Article and BrokerReview template definitions.
- Add a structured block model for intro, summary/key takeaways, table of contents, FAQ, pros/cons, and CTA slots.
- Render public content through template-aware blocks.
- Reuse FAQ and key sections in SEO JSON-LD when present.
- Validate required template blocks before publish.
- Keep markdown as the simple authoring surface for MVP.

## Non-goals

- No drag-and-drop page builder.
- No full Template Manager UI in this change.
- No new database tables or migration unless the existing JSON template/body fields cannot support the MVP behavior.
