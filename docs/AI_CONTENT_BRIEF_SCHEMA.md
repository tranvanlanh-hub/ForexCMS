# AI Content Brief Schema

This is the reusable output contract for AI-generated content. AI output should be JSON first. Markdown frontmatter may mirror the same fields, but bulk work should use JSON arrays.

## Shared Required Fields

Every draft must include:

- `title`: public editorial title.
- `slug`: URL slug without market or content-type prefix.
- `market`: market code such as `global`, `us`, `uk`, `au`, `vn`, or `th`.
- `language`: language code matching the market, such as `en`, `vi`, or `th`.
- `contentType`: Prisma content type enum.
- `template`: template key.
- `status`: always `DRAFT` for AI-generated imports.
- `targetKeyword`: primary SEO keyword.
- `seoTitle`: search title.
- `metaDescription`: search meta description.
- `canonicalPath`: expected `/{market}/{content-type}/{slug}/` path.
- `topicCluster`: cluster slug used for internal linking and batch planning.
- `body`: Markdown body with no raw `http://` or `https://` links.
- `faq`: array of question/answer pairs.
- `schemaTypes`: expected JSON-LD types for the template.
- `internalLinkTargets`: canonical paths this draft should link toward.
- `affiliateTokens`: broker/campaign tokens when CTA is needed.
- `brokerMentions`: broker slugs mentioned or reviewed.
- `translationGroupKey`: optional group key for hreflang siblings.

## Affiliate Token Shape

Use tokens only, never affiliate destination URLs:

```json
{
  "broker": "exness",
  "market": "vn",
  "language": "vi",
  "campaign": "review_top_cta"
}
```

## Article

```json
{
  "contentType": "ARTICLE",
  "template": "article",
  "schemaTypes": ["Article", "BreadcrumbList", "FAQPage"],
  "affiliateTokens": [],
  "brokerMentions": []
}
```

Article drafts should contain an intro, key takeaways, body sections, FAQ, and contextual internal link targets.

## Guide

```json
{
  "contentType": "GUIDE",
  "template": "guide",
  "schemaTypes": ["Article", "BreadcrumbList", "FAQPage"],
  "affiliateTokens": [],
  "brokerMentions": []
}
```

Guide drafts should be step based and link to relevant articles, broker reviews, or best broker lists in the same market/language.

## BrokerReview

```json
{
  "contentType": "BROKER_REVIEW",
  "template": "broker-review",
  "schemaTypes": ["Review", "Article", "BreadcrumbList", "FAQPage"],
  "brokerMentions": ["exness"],
  "affiliateTokens": [
    {
      "broker": "exness",
      "market": "global",
      "language": "en",
      "campaign": "review_top_cta"
    }
  ]
}
```

BrokerReview drafts must include pros/cons, sourced-fact placeholders, FAQ, and CTA tokens. They must not invent broker facts without a source workflow.

## BestBrokerList

```json
{
  "contentType": "BEST_BROKER_LIST",
  "template": "best-broker-list",
  "schemaTypes": ["ItemList", "Article", "BreadcrumbList", "FAQPage"],
  "brokerMentions": ["exness", "samplefx"],
  "affiliateTokens": [
    {
      "broker": "exness",
      "market": "global",
      "language": "en",
      "campaign": "review_top_cta"
    }
  ]
}
```

BestBrokerList drafts must explain selection criteria, link to broker reviews, include FAQ, and use only centralized affiliate tokens.

## CountryHub

```json
{
  "contentType": "COUNTRY_HUB",
  "template": "country-hub",
  "schemaTypes": ["CollectionPage", "BreadcrumbList", "FAQPage"],
  "affiliateTokens": [],
  "brokerMentions": []
}
```

CountryHub is a supported schema contract for AI briefs, but the public template is not fully implemented yet. Generate these only as draft/planned content until the CountryHub template and route behavior are verified.
