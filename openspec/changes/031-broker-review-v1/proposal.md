# Proposal: Broker Review v1

## Goal

Upgrade the existing `/{market}/broker-reviews/{slug}/` ContentItem route into
an evidence-led MarketGB broker review. Editorial prose, verdict, and FAQ remain
owned by ContentItem. Reusable identity, market-scoped assessment, sourced facts,
and affiliate campaigns remain owned by Broker, BrokerReviewAssessment,
BrokerFact, and AffiliateLink.

## Scope

- Add one current `BrokerReviewAssessment` per broker and market.
- Render a dedicated review template without creating a broker-profile URL.
- Prefer market-specific sourced facts over matching global facts.
- Add review-specific admin guidance, verdict entry, assessment editing, and
  non-blocking completeness warnings.
- Keep affiliate URLs centralized and make missing offers visible without
  blocking the review page.

## Safety

- Do not render unsourced or placeholder factual claims.
- Do not treat old global Broker ratings as market-specific assessments.
- Do not hard-code affiliate destinations or use the broker website as an offer
  fallback.
- Do not reseed or publish demo broker data.

## Acceptance

- Published reviews have the agreed evidence-led section order and work on mobile.
- Assessment scores are market-specific, transparent when partial, and separate
  from broker-sourced facts.
- The canonical ContentItem route, redirects, sitemap, and hreflang behavior
  remain unchanged.
