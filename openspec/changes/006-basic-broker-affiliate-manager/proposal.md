# Proposal: Basic Broker and Affiliate Manager

## Summary

Add database-backed admin workflows for managing brokers and affiliate links, plus a centralized public affiliate resolver and CTA component.

## Goals

- Create a basic Broker Manager in admin.
- Create a basic Affiliate Link Manager in admin.
- Keep affiliate URLs centralized in `AffiliateLink` records.
- Resolve public CTA URLs by broker, market, language, and campaign tokens.
- Render public affiliate links with `rel="sponsored nofollow"`.

## Non-goals

- Full click analytics dashboard.
- Advanced market/language fallback rules.
- Broker fact scoring, comparison tables, or review template blocks.
- Authentication or permissions.

## User Impact

Admins can create and update broker profiles and campaign links from the CMS. Public CTA components can use broker/campaign tokens without hard-coding affiliate URLs in content.
