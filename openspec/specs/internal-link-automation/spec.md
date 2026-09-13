# Spec: Internal Link Automation

## Muc tieu

Tao he thong goi y internal link co kiem soat cho website forex affiliate nhieu market/ngon ngu, giup giam orphan page va tang suc manh topic cluster ma khong chen link qua day.

## Requirements

- He thong phai co model topic cluster de gom cac topic lien quan trong cung market/language.
- He thong phai co anchor text dictionary theo market/language va optional target page.
- He thong phai co InternalLinkRule de gioi han source content type, target content type, topic cluster, priority page, so link toi da, va spacing.
- He thong phai co InternalLinkSuggestion de luu source page, target page, anchor text, rule, score, reason, va trang thai duyet.
- Suggestion engine khong duoc goi y link sai market hoac sai language.
- Suggestion engine nen gioi han batch dau tien khoang 3-8 link moi bai.
- Public renderer chi render suggestion da accepted hoac suggestion den tu rule active co mode auto-approve ro rang.
- Public renderer khong duoc ghi de body content khi chen internal link.
- Link render phai co spacing toi thieu de tranh link density qua cao.

## Acceptance criteria

- Admin co the xem topic clusters, anchor text, rules, va suggestions co ban.
- Admin co the generate suggestion cho mot published content item.
- Admin co the accept/reject suggestion.
- Public page render internal links accepted trong cung market/language.
- Cross-market va cross-language suggestions khong duoc tao hoac render.

## Constraints

- Khong auto-link tat ca bai viet neu chua co rule ro rang.
- Khong tao fallback link tu market/language khac.
- Khong chen raw URL vao markdown body.
- Khong tao route public root dang `/{slug}` cho target internal link.

## Implementation note 2026-09-09 - Basic automation

Change `openspec/changes/012-internal-link-automation/` adds Prisma models for `TopicCluster`, `AnchorText`, `InternalLinkRule`, and `InternalLinkSuggestion`.

The first suggestion engine is deterministic. It requires same `marketId` and same `languageCode`, scores candidates by topic cluster/rule/priority page/anchor priority, and caps generated suggestions to eight per source content item.

Admin review is available at `/admin/internal-links` with generation and accept/reject controls.

Public content rendering applies links at render time from accepted suggestions or active auto-approve rules only; content body remains unchanged.

## Implementation note 2026-09-09 - Orphan content dashboard

Change `openspec/changes/015-analytics-click-quality-dashboard/` surfaces orphan published content in `/admin/analytics`. The MVP definition is published content with no accepted incoming internal link suggestion.

## Implementation note 2026-09-10 - Rule creation controls

Change `openspec/changes/019-seo-broker-affiliate-link-ai-safety/` adds a rule creation surface in `/admin/internal-links`.

Operators can create rules scoped by market, language, optional topic cluster, optional priority target page, source content type, target content type, mode, status, maximum links per content, minimum word spacing, and priority. Server-side validation requires the rule language to match the selected market and rejects topic clusters or priority target pages from another market/language.

## Implementation note 2026-09-13 - Managed taxonomy

Change `openspec/changes/026-taxonomy-manager/` provides the management surface
for topics and topic clusters that feed this engine. New suggestion generation
only loads active clusters. Topic and priority-page assignments are validated
against the same market and language scope.
