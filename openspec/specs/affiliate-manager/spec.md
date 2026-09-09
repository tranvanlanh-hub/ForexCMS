# Spec: Affiliate Manager

## Muc tieu

Quan ly broker va affiliate link tap trung de thay doi link mot cho va ap dung toan website.

## Requirements

- He thong phai co Broker entity.
- He thong phai co AffiliateLink entity.
- Affiliate link phai ho tro market, language, campaign, status va priority.
- Public CTA phai resolve link qua broker/campaign token.
- Link affiliate public phai dung `rel="sponsored nofollow"` tru khi co quyet dinh khac.
- He thong nen ho tro tracking click o giai doan sau.

## Acceptance criteria

- Mot broker co the co nhieu affiliate link theo market/campaign.
- Doi affiliate URL trong backend se anh huong toan bo CTA lien quan.
- Khong co bai viet nao can sua thu cong khi doi link broker.

## Constraints

- Khong hard-code affiliate URL trong Markdown/HTML content.
- Khong de moi template tu resolve link theo cach rieng.

## Implementation note 2026-09-09 - Basic manager and resolver

Basic database-backed admin pages now exist for brokers and affiliate links:

- `/admin/brokers`
- `/admin/brokers/new`
- `/admin/brokers/[id]/edit`
- `/admin/affiliate-links`
- `/admin/affiliate-links/new`
- `/admin/affiliate-links/[id]/edit`

`Broker` supports name, slug, status, logo/media URL, and short description.

`AffiliateLink` supports broker, market, language, campaign, destination URL, status, priority, sponsored, and nofollow fields.

`lib/affiliate` exposes a centralized resolver that accepts broker, market, language, and campaign tokens. Public CTA rendering uses this resolver and outputs affiliate anchors with `rel="sponsored nofollow"`.
