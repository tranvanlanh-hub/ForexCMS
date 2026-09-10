# Design

## Data model

- `TopicCluster` groups topics for one market/language and can mark a priority page.
- `AnchorText` stores approved phrases for a cluster, market/language, and optional target page.
- `InternalLinkRule` defines source/target content-type scope, cluster scope, priority, max links per article, spacing, and rule mode.
- `InternalLinkSuggestion` stores a source page, target page, anchor, rule, status, and reason.

## Suggestion engine

The first version uses deterministic scoring:

1. Source and target must share the same market and language.
2. Target must be published and cannot equal source.
3. Topic cluster matches are preferred from the source primary topic, target primary topic, and explicit anchor/rule cluster.
4. Priority pages are boosted.
5. Rules can narrow source content type, target content type, and topic cluster.
6. The result is capped to 3-8 suggestions per source item.

## Rendering

The public renderer receives only renderable links:

- Accepted suggestions.
- Suggestions attached to an active rule with `AUTO_APPROVE` mode.

Links are applied at render time to plain text occurrences, not written back into content body. The renderer spaces links apart and caps rendered internal links to avoid dense linking.
