# Design: Broker Review v1

## Page ownership

`ContentItem` remains the only public page and canonical URL owner:

```text
/{market}/broker-reviews/{slug}/
```

Its `summary` is the short Verdict, while Markdown provides editorial analysis
and FAQ. A review does not create a public broker profile route.

`Broker` keeps reusable identity/contact data. `BrokerFact` keeps each cited
factual claim. `AffiliateLink` keeps every commercial destination. The v1
market assessment is a separate `BrokerReviewAssessment`, not a replacement for
legacy global Broker ratings.

## Assessment

One assessment is unique per `brokerId` and `marketId`. It has five optional
0.0–5.0 criteria:

1. Regulation & trust
2. Costs
3. Trading experience
4. Deposits & withdrawals
5. Support & education

Each has an optional rationale capped at 500 characters. A row with any score
requires reviewer name and review date. `methodologyVersion` is fixed to
`broker-review-v1`.

The visible overall score is the one-decimal arithmetic mean of available
criteria. It is labeled as partial (`N of 5 criteria assessed`) whenever not
complete. Missing rationales show an explicit unavailable state. No global
Broker rating may fill an absent market assessment.

## Fact selection

Only rows with valid HTTP(S) sources and non-placeholder hosts can render.
For a given `category + normalized label`, a fact scoped to the current market
wins over global. Ties use primary flag, display order, newest update, then ID.
All non-duplicate facts remain visible. Sources lists only the facts rendered
on the page, deduplicated by URL.

## Review composition

1. Identity hero and byline
2. Verdict
3. Key facts
4. MarketGB scorecard
5. Detailed analysis
6. Sourced pros and cons
7. Regulation & safety
8. Fees
9. Platforms
10. Deposits & withdrawals
11. Methodology
12. Sources
13. FAQ

Missing evidence has a direct unavailable state; it never becomes invented
copy. Markdown headings missing from the four core analysis sections are admin
warnings, not publish blockers. Markdown pros/cons are not rendered on reviews.

## Offers

Each top/middle/bottom CTA tries its configured campaign first, then tries
`review_top_cta`, `review_middle_cta`, and `review_bottom_cta` in that order
without retrying a campaign. Fallback copy is neutral. If no offer resolves,
a single disclosure appears after Verdict and the three empty CTA areas are
hidden. Broker websites are never offer fallbacks.

## SEO and cache

Keep ContentItem canonical, redirect, sitemap, and translation behavior. Review
JSON-LD uses the derived assessment average if at least one score exists, with
0–5 bounds and the assessed-criterion count in review copy. Keep Article,
BreadcrumbList, and conditional FAQPage schemas. Reuse current public-content
and affiliate-resolver cache tags.
