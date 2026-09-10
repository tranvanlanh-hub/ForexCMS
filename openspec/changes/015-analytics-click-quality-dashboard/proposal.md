# Change 015 - Analytics click and quality dashboard

## Why

Affiliate CTAs currently resolve centrally, but clicks are not persisted and the admin dashboard does not expose affiliate or content quality signals. Operators need a simple, privacy-conscious way to see affiliate click volume, top brokers/content, missing SEO metadata, broken affiliate links, and orphan content.

## Scope

- Add a minimal affiliate click event model.
- Route affiliate CTA clicks through a first-party tracking endpoint before redirecting to the resolved destination.
- Store only operational fields needed for affiliate reporting.
- Add an admin analytics dashboard with basic click and quality checks.
- Update relevant specs, roadmap, handoff, and this change checklist.

## Out of scope

- User-level attribution, fingerprinting, cookies, IP address storage, user-agent storage, session tracking, or cross-device identity.
- Advanced funnels, revenue attribution, A/B testing, or external analytics integrations.
- Background crawling for external link health.
