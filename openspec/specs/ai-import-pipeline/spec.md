# Spec: AI Import Pipeline

## Mục tiêu

Cho phép đưa nội dung từ AI vào CMS nhanh, đúng cấu trúc, có validation trước khi publish.

## Requirements

- Import phải hỗ trợ format Markdown frontmatter hoặc JSON schema.
- Import phải kiểm tra required fields theo template.
- Import phải kiểm tra slug, market, language, broker mention và affiliate token.
- Import phải kiểm tra SEO title/meta description.
- Import phải preview trước khi publish.
- Bulk import sẽ làm sau MVP.

## Acceptance criteria

- Một bài AI output hợp lệ có thể import thành draft.
- Bài thiếu trường bắt buộc không được publish thẳng.
- Affiliate token không hợp lệ phải bị cảnh báo.

## Constraints

- Không cho AI tự publish hàng loạt không qua validation.
- Không import HTML tùy tiện chứa link affiliate hard-code.

## Implementation note 2026-09-09 - Basic single draft import

Change `openspec/changes/013-basic-ai-content-import-pipeline/` adds the first usable AI Import Manager at `/admin/ai-import`.

The MVP supports one pasted draft at a time from JSON or Markdown frontmatter. It validates title, slug, active market, language, content type, active template, body/content, SEO title, meta description, affiliate tokens, and broker mentions before saving.

AI import always creates `ContentStatus.DRAFT` content. Publishing remains a separate Content Manager workflow with the existing publish validation.

The importer rejects body content containing hard-coded `http://` or `https://` URLs, including Markdown links and HTML links. Affiliate references must use broker/campaign tokens that resolve through the centralized Affiliate Manager.

The admin page shows blocking validation errors, warnings, normalized metadata, canonical path preview, broker checks, affiliate token checks, and body preview before draft save.

## Implementation note 2026-09-09 - Scale brief contract

Change `openspec/changes/017-content-scale-operations/` adds a reusable AI content brief contract in `docs/AI_CONTENT_BRIEF_SCHEMA.md`.

The contract covers Article, Guide, BrokerReview, BestBrokerList, and CountryHub output. Bulk-ready drafts must include SEO title, meta description, target keyword, market, language, content type, template, FAQ, internal link targets, and affiliate tokens when CTA content needs them.

`scripts/generate-content-pilot.mjs` writes 50 draft import items that follow the contract, and `scripts/audit-content-batch.mjs` checks the generated drafts before any large-scale batch is allowed.

## Implementation note 2026-09-09 - Draft-only workflow confirmed

Change `openspec/changes/018-system-audit-admin-workflow-hardening/` confirms AI import remains draft-only. Imported content cannot become published through the AI import action; it must move through the Content Manager workflow and publish validation.

## Implementation note 2026-09-10 - Batch safety dry-run

Change `openspec/changes/019-seo-broker-affiliate-link-ai-safety/` adds `npm.cmd run ai:batch:validate`.

The batch validator is dry-run by default, enforces a default maximum batch size of 50 items, validates metadata, canonical paths, FAQ, internal link targets, affiliate tokens, raw URL usage, duplicate slugs/canonicals, and draft-only status, then writes `data/ai-content/last-batch-reject-report.json`. It does not publish content and does not write to the database in dry-run mode.
