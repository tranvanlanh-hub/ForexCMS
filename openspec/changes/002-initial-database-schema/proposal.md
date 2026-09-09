# Proposal: Initial Database Schema

## Summary

Choose the ORM and add the first PostgreSQL database schema for the core CMS entities.

## Motivation

The project needs a portable database foundation before building admin screens, public rendering, broker management, affiliate resolution, and SEO tools. The schema must support multi-market content, versioned content, templates, taxonomy, centralized affiliate links, and SEO metadata without relying on WordPress or Cloudflare D1.

## Decision

Use Prisma with PostgreSQL.

Prisma is the better fit for this phase because the CMS starts with several relational entities and the schema should remain easy for future Codex sessions to read, migrate, and extend. Drizzle is a strong option for SQL-first control, but Prisma gives this project a clearer initial model layer and a mature migration workflow while staying portable to a Linux VPS.

## Scope

- Add Prisma dependencies and schema files.
- Model Market, ContentItem, ContentRevision, Category, Topic, Template, SeoMetadata, Broker, and AffiliateLink.
- Keep affiliate destination URLs in the database, resolved by broker/market/campaign tokens.
- Keep PostgreSQL as the only core CMS database target.

## Out of Scope

- Admin CRUD screens.
- Public database rendering.
- Seed data.
- Affiliate click tracking.
- Cloudflare D1 support.
