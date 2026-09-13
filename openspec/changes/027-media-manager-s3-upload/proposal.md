# Proposal: Media Manager and S3-compatible image upload

Ngày: 2026-09-13. Trạng thái: kế hoạch, chưa triển khai.

## Vấn đề

Dự án mới có biến cấu hình S3-compatible và `lib/storage` trả config. Chưa có
storage client, metadata asset, upload workflow hay thư viện media. Broker vẫn
nhập logo URL thủ công; ContentItem chưa chọn featured/social image.

## Kết quả mong muốn

- Admin upload, tìm kiếm, xem, sửa metadata và quản lý ảnh tại `/admin/media`.
- File nằm trong R2/S3 theo prefix tháng để dễ duyệt và backup.
- Database là nguồn sự thật về ownership, trạng thái và nơi asset đang được dùng.
- Broker và bài viết chọn asset từ Media Library thay vì nhập URL rời rạc.
- Logic chỉ gọi adapter S3-compatible; Cloudflare R2 là cấu hình triển khai đầu tiên.

## Quy ước object key

Chấp nhận đề xuất chia theo `yyyymm`, với key chuẩn:

```text
pending/{yyyymm}/{assetId}/original.{ext}
uploads/{yyyymm}/{assetId}/original.{ext}
uploads/{yyyymm}/{assetId}/thumb.{ext}
uploads/{yyyymm}/{assetId}/card.{ext}
uploads/{yyyymm}/{assetId}/social.{ext}
```

Ví dụ:

```text
uploads/202609/cm123abc/original.webp
uploads/202609/cm123abc/thumb.webp
```

`assetId` bảo đảm key duy nhất; không dùng filename người dùng làm identity.
Filename gốc chỉ lưu trong database để tìm kiếm. Prefix `yyyymm` dùng thời điểm
MediaAsset được tạo theo UTC và không đổi khi sửa metadata hoặc thay usage.

## Phạm vi MVP

- Ảnh JPEG, PNG, WebP và AVIF; tối đa đề xuất 8 MiB/file.
- Presigned PUT ngắn hạn, finalize/verify sau upload, trạng thái pending/ready/error.
- Media library: grid/list, search, lọc tháng/type/status/usage, phân trang.
- Alt text, caption, filename, MIME, kích thước file, width/height, object key.
- Copy URL, chọn ảnh cho broker logo, content featured image và social/OG image.
- Soft delete có dependency guard; cleanup object theo state có thể retry.
- Cấu hình CORS, custom public media domain, backup và smoke read/write/delete.

## Ngoài phạm vi MVP

- Video/audio/PDF, SVG upload, DAM approval phức tạp, AI image generation.
- Crop editor nâng cao, focal-point UI, duplicate perceptual hashing.
- Multipart upload; giới hạn 8 MiB không cần multipart.
- Public media gallery hoặc thay toàn bộ image pipeline bằng Cloudflare Images.

## Tiêu chí hoàn tất

- Admin hợp lệ có thể upload ảnh, finalize thành READY và xem qua public URL.
- Key luôn đúng prefix `pending|uploads/yyyymm/assetId/`; không path traversal.
- MIME khai báo sai, signature hết hạn, file quá giới hạn hoặc magic bytes không
  khớp đều không tạo asset READY.
- Không lộ S3 secret ra client/log/build; presigned URL chỉ cho một PUT/key/type
  và hết hạn ngắn.
- Không xóa asset đang được broker/content dùng; retry được upload/delete dang dở.
- R2, AWS S3 hoặc MinIO dùng cùng service interface và schema metadata.

## Ranh giới phiên lập kế hoạch

Chỉ tạo tài liệu. Chưa cài SDK, tạo/apply migration, tạo bucket/token/domain/CORS,
upload/xóa object, sửa dữ liệu Neon, commit, push hoặc deploy.
