# Change: Small Content Production Pilot

## Summary

Run a small realistic production-content pilot before scaling to thousands of forex affiliate pages.

## Why

The CMS now has core content, template rendering, SEO metadata, sitemap generation, affiliate CTA resolution, internal link suggestions, AI import, broker facts, comparison pages, and analytics foundations. Before creating a large batch such as 4,000 articles, the project needs a representative seed set and an end-to-end verification pass across public and admin flows.

## Scope

- Add a realistic demo content seed of roughly 10-20 items.
- Cover education articles, account-opening guides, broker reviews, best broker lists, FAQ-style content, and at least two markets.
- Keep affiliate URLs centralized in AffiliateLink rows.
- Validate URL patterns, canonical paths, sitemap output, JSON-LD schema, affiliate CTA resolution, internal links, admin edit readiness, and AI import readiness.
- Run available lint/build/test-style checks.

## Out of Scope

- Do not generate 4,000 articles.
- Do not add a new production publishing automation.
- Do not bypass AI import validation or publish imported drafts automatically.
- Do not hard-code affiliate destination URLs in content markdown.
