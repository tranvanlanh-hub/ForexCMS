# Change 012 - Internal Link Automation

## Goal

Add a basic, controlled internal link automation layer for market-scoped forex content.

## Scope

- Add database models for topic clusters, anchor text, internal link rules, and internal link suggestions.
- Generate internal link suggestions from published content using market, language, topic, content type, and priority signals.
- Keep suggestions limited to a small initial set per source content item.
- Add an admin screen to review and approve/reject suggestions.
- Render public internal links only when approved or produced by an explicit auto-approve rule.

## Non-goals

- No AI-generated anchors in this change.
- No bulk auto-insertion into stored article body.
- No cross-market or cross-language fallback.
- No orphan-page analytics dashboard beyond basic counts.
