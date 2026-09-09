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
