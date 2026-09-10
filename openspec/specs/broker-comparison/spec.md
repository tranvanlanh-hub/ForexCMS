# Spec: Broker Comparison

## Muc tieu

Tao nen so sanh broker co cau truc, dung du lieu BrokerFact co nguon va khong hard-code affiliate URL.

## Requirements

- Public comparison URL phai theo pattern `/{market}/compare/{broker-a}-vs-{broker-b}/`.
- Comparison phai load broker active va market active.
- Comparison phai chi hien fact co source/citation fields.
- Comparison phai ho tro categories: regulation/license, minimum deposit, spread, leverage, platforms, account types, deposit/withdrawal methods, support languages, restricted countries, va other.
- CTA trong comparison phai resolve qua affiliate token broker/market/language/campaign.
- Page comparison phai co canonical metadata va JSON-LD phu hop.

## Acceptance criteria

- Neu thieu market active, broker active, hoac pair khong hop le thi page tra ve not found.
- Bang comparison hien du lieu theo category va source link tung fact.
- Khong co affiliate destination URL nao hard-code trong template/page.
- ItemList JSON-LD liet ke broker duoc so sanh.

## Implementation note 2026-09-09 - Foundation route

Change `openspec/changes/014-broker-data-review-comparison/` adds the first public comparison route at `app/(public)/[market]/compare/[pair]/page.tsx`.

The route parses `broker-a-vs-broker-b`, loads the active market and two active brokers, filters facts to global or current-market facts, and renders a sourced comparison table. Empty cells show that no sourced data has been entered yet.

## Implementation note 2026-09-10 - Sourced fact snapshot

Change `openspec/changes/019-seo-broker-affiliate-link-ai-safety/` upgrades review and comparison rendering with a sourced broker snapshot.

BrokerReview pages now highlight sourced regulation, rating/score when represented as a sourced fact, fees/spread, minimum deposit, deposit/withdrawal, platform, account type, and sourced pros/cons. Markdown pros/cons are not rendered for BrokerReview pages because they do not carry citation fields.

Broker comparison cards now show sourced snapshot facts before the full comparison table. Review JSON-LD may include `reviewRating` only when a rating/score fact with source fields exists.
