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
