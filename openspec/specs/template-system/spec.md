# Spec: Template System

## Mục tiêu

Quản lý nhiều loại giao diện và cấu trúc nội dung theo template, giúp content nhất quán và dễ scale bằng AI.

## Requirements

- Hệ thống phải có Template entity hoặc template registry.
- Mỗi template phải định nghĩa required fields/blocks.
- Template đầu tiên gồm Article và BrokerReview.
- Các template sau gồm Guide, BestBrokerList, CountryHub, TopicHub, BrokerComparison, GlossaryTerm.
- Template phải gắn với SEO/schema behavior.
- Template phải kiểm soát vị trí CTA và internal link slots.

## Acceptance criteria

- Admin chọn được template khi tạo content.
- Content thiếu block bắt buộc phải bị cảnh báo hoặc không publish được.
- Public renderer chọn đúng layout theo template.

## Constraints

- Không tạo layout riêng lẻ nằm ngoài template system cho các page quan trọng.
- Không biến template manager thành page builder phức tạp ở MVP.
## Implementation note 2026-09-09 - Initial public rendering

The first public content renderer loads the `Template` relation and keeps rendering conservative while the template system is still early.

Seed data creates active `Article` and `BrokerReview` templates. Full template-specific block layouts remain a later change.

## Implementation note 2026-09-09 - Schema behavior foundation

The public renderer now emits Article schema for published content and FAQPage schema when FAQ markdown is present. Full template-specific schema selection remains a later Template Manager change.

## Implementation note 2026-09-09 - Template block renderer foundation

Change `openspec/changes/010-template-block-renderer/` adds the first template-aware block renderer without a page builder.

Article and BrokerReview templates now define structured allowed/required blocks, schema types, CTA slots, and internal link slots through the existing `Template` JSON fields.

Supported MVP block types:

- intro
- summary/key takeaways
- table of contents
- body
- FAQ
- pros/cons
- CTA slot

Admin content remains markdown-first. New saves store structured blocks in `ContentItem.body`; legacy markdown-only content derives blocks at render time.

Published content is checked against required template blocks before save. Public pages render blocks through the selected template and CTA slots continue to resolve via broker/market/language/campaign tokens.

## Implementation note 2026-09-09 - BrokerReview facts and comparison foundation

Change `openspec/changes/014-broker-data-review-comparison/` upgrades BrokerReview rendering with a sourced broker facts section when the content item has an attached broker.

BrokerComparison now has a foundation route at `/{market}/compare/{broker-a}-vs-{broker-b}/`. It loads broker data directly for the pair and renders a sourced fact comparison table. The seeded `broker-comparison` template defines basic allowed blocks and schema behavior for future CMS-authored comparison pages.

## Implementation note 2026-09-10 - BrokerReview sourced claims

Change `openspec/changes/019-seo-broker-affiliate-link-ai-safety/` keeps BrokerReview rendering citation-first. Broker facts, pros/cons, and rating-like values are rendered from sourced `BrokerFact` rows. Unsourced markdown pros/cons are not rendered for BrokerReview pages.
