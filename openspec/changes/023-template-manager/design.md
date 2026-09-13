# Design: Template Manager

## Data model

Use the existing `Template` model. This change requires no schema migration.
The manager writes the current JSON array fields through controlled form
options:

- `requiredBlocks`
- `allowedBlocks`
- `schemaTypes`
- `ctaSlots`
- `internalLinkSlots`

## Validation

- Key is normalized as a slug and remains unique.
- Name and kind are required.
- `body` must be an allowed block.
- Every required block must also be allowed.
- CTA slots require `cta_slot` to be allowed.
- Block, schema, and CTA values must come from the supported registry.
- Internal-link slots are normalized tokens with duplicates removed.
- A template kind cannot change after content items use the template.
- Content saves require the selected template kind to match the content type.

## Admin behavior

The list is dynamic and shows status, kind, content usage, blocks, and schema
types. Create and edit use server actions following the existing Market and
Broker Manager patterns. Save errors return to the form; successful writes
revalidate template, content, and public content paths.

Templates are not deleted here because ContentItem has a required relation to
Template. An operator can deactivate a template to prevent future publishing
with it while preserving existing content relationships.
