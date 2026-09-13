# Design: Media Manager and S3-compatible image upload

## 1. Kiến trúc lưu trữ

Mở rộng `lib/storage` thành interface dùng chung:

- `createUploadUrl`, `headObject`, `getObjectRange`, `copyObject`, `deleteObjects`.
- `buildPublicUrl` và `assertStorageReady`.
- Implementation S3 API dùng endpoint/region/bucket/access key/secret hiện có.
- Không import Cloudflare R2 binding trong admin/action; R2 đi qua S3 API như
  MinIO và AWS S3.

Direct browser upload dùng presigned PUT để file không đi qua request body của
Worker. R2 presigned URL chỉ hoạt động với S3 API domain, còn ảnh READY được đọc
qua `S3_PUBLIC_BASE_URL`, ưu tiên custom domain `media.marketgb.com`. Bucket CORS
chỉ cho origin admin thật và localhost cần thiết, method PUT, header Content-Type
và expose ETag. URL ký có hạn 5 phút và Content-Type nằm trong signature.

Không dùng `r2.dev` cho production. Public bucket/custom domain chỉ có quyền đọc;
S3 credential có scope object read/write trên đúng bucket, không phải account-wide.

## 2. Database

Thêm enum:

```text
MediaStatus: PENDING, READY, ERROR, DELETING, DELETED
MediaKind: IMAGE
MediaUsageRole: FEATURED, SOCIAL, INLINE
```

`MediaAsset`:

- id, kind, status, storageKey unique, pendingKey unique/null.
- originalFilename, mimeType, extension, sizeBytes BigInt.
- width, height, checksumSha256/etag nullable.
- altText, caption, createdBy, createdAt, updatedAt, deletedAt, errorMessage.
- `yyyymm` (Char(6) logic-level validation) để filter nhanh và tái tạo prefix.
- public URL được suy ra từ key + config, không lưu hostname môi trường vào DB.

`MediaVariant`:

- id, mediaAssetId, name (`thumb`, `card`, `social`), storageKey unique.
- mimeType, sizeBytes, width, height, createdAt.
- unique `(mediaAssetId,name)`.

Usage có foreign key thật:

- `ContentItem.featuredMediaId` và `socialMediaId`, onDelete Restrict.
- `Broker.logoMediaId`, onDelete Restrict; giữ `logoUrl/logoAssetKey` trong một
  giai đoạn chuyển tiếp, renderer ưu tiên MediaAsset READY rồi fallback URL cũ.
- `ContentMedia` join cho role INLINE trong structured blocks tương lai; MVP có
  thể tạo model nhưng chưa chèn markdown tự động.

Index: `(status,createdAt)`, `(yyyymm,status)`, MIME, filename tìm kiếm và các FK
usage. Migration additive; không tự import logo URL bên ngoài thành object.

## 3. Luồng upload hai bước

### Bước A — tạo upload intent

Server action/API yêu cầu admin session + CSRF, nhận filename, declared MIME và
size. Validation:

- allowlist `image/jpeg`, `image/png`, `image/webp`, `image/avif`;
- size > 0 và <= 8 MiB;
- chuẩn hóa extension từ MIME, bỏ extension/tên/path do client cung cấp khỏi key;
- giới hạn rate theo admin session và số PENDING gần đây.

Trong DB tạo MediaAsset PENDING, tính UTC `yyyymm`, key
`pending/{yyyymm}/{assetId}/original.ext`, rồi trả presigned PUT và expiresAt.
Không trả credential. Response/action và admin route luôn no-store.

### Bước B — upload và finalize

Browser PUT trực tiếp kèm đúng Content-Type, sau đó gọi finalize bằng asset ID.
Finalize kiểm tra owner/status/expiry và `HeadObject`:

- object tồn tại, size đúng giới hạn, MIME đúng;
- đọc range đầu file để xác thực magic bytes và lấy kích thước an toàn;
- từ chối ảnh zero dimension, decompression-bomb dimensions hoặc format giả;
- optional checksum từ object metadata/ETag chỉ dùng làm integrity signal, không
  coi ETag luôn là MD5.

Sau verify, copy object từ pending sang
`uploads/{yyyymm}/{assetId}/original.ext`, xác minh destination, xóa pending và
transaction cập nhật storageKey/status READY. Vì DB + object store không có một
transaction chung, mỗi bước phải idempotent: finalize gọi lại tiếp tục từ state
hiện có, và ERROR lưu lý do an toàn không chứa secret/presigned URL.

Job/command cleanup xóa `pending/` hết hạn sau 24 giờ và đánh dấu record ERROR.
R2 lifecycle rule theo prefix pending có thể là lớp bảo vệ bổ sung; database job
vẫn cần để đồng bộ metadata.

## 4. Variants và xử lý ảnh

MVP có thể phát hành original trước, nhưng interface và schema chuẩn bị variants:

- thumb: khoảng 320 px, dùng trong admin picker.
- card: khoảng 800–1200 px, dùng listing/featured.
- social: 1200×630 khi workflow crop phù hợp.

Không đổi key original khi thay alt/caption. Variant generation chạy sau READY;
nếu runtime Worker không phù hợp CPU/library ảnh thì đưa vào job Node portable
hoặc Cloudflare Images adapter riêng ở change sau. Original upload không phụ
thuộc Cloudflare Images.

`next/image` cần cấu hình `remotePatterns` từ hostname public đã validate ở boot,
không wildcard mọi HTTPS host. Renderer có fallback kích thước và alt text.

## 5. Media Manager UI

Thêm navigation `Media` và `/admin/media`:

- Grid mặc định với thumbnail, filename, dimensions, yyyymm và usage badge.
- List view để audit key/MIME/size/status.
- Search filename/alt/caption; filter tháng `yyyymm`, type, status, used/unused.
- Upload drawer/modal có drag-drop, chọn file, progress, retry và lỗi cụ thể.
- Detail/edit cho alt text, caption; usage panel link tới bài/broker đang dùng.
- Copy public URL chỉ khi READY; không hiển thị presigned URL sau upload.
- Delete chỉ enabled khi usage count bằng 0; form có xác nhận rõ object sẽ bị xóa.

Accessibility: input file có label, progress có aria attributes, mọi ảnh có alt,
keyboard chọn được asset, trạng thái không chỉ phân biệt bằng màu.

## 6. Gắn vào Content và Broker

Media picker dùng chung nhận loại usage và filter READY images:

- Broker form chọn logoMediaId; lưu cùng transaction với broker/facts.
- Content form chọn featuredMediaId và socialMediaId; SEO metadata ưu tiên social,
  fallback featured, rồi site default.
- Picker hiển thị asset cùng market-neutral; alt text riêng trên MediaAsset. Nếu
  một ảnh cần alt khác theo ngữ cảnh, ContentMedia có overrideAlt.

Publish validation chặn referenced asset không READY/DELETING/DELETED. Thay asset
không xóa asset cũ. Public cache được revalidate khi usage hoặc metadata ảnh đổi.

## 7. Xóa và khôi phục lỗi

Delete workflow:

1. Server kiểm tra lại FK/usage count, không tin trạng thái UI.
2. Đổi READY/ERROR → DELETING có optimistic guard.
3. Xóa original + variants + pending key qua adapter.
4. Đánh dấu DELETED, deletedAt; giữ row audit, không tái sử dụng key.

Nếu bước object lỗi, record giữ DELETING + errorMessage và có nút Retry. Nếu DB
update cuối lỗi, retry HEAD/delete là idempotent. Không hard-delete metadata ở
MVP. Có thể khôi phục metadata chỉ khi object vẫn tồn tại; nếu đã xóa object thì
phải upload asset mới.

## 8. Security và cấu hình

- Session/CSRF hiện hành bảo vệ intent/finalize/edit/delete.
- Same-origin check, short expiry, per-object key, signed Content-Type, rate limit.
- Không cho SVG/HTML, filename có path, user-defined key, public ACL hoặc URL đích.
- Sniff magic bytes; set Content-Disposition inline chỉ cho allowlisted images,
  `X-Content-Type-Options: nosniff` tại custom media domain nếu cấu hình được.
- Không ghi presigned URL, access key, secret, raw file content vào logs.
- CSP `img-src` admin/public thêm đúng media origin.
- Startup/admin health hiển thị thiếu config mà không lộ giá trị secret.

Biến hiện có tiếp tục dùng; thêm:

```text
MEDIA_MAX_UPLOAD_BYTES=8388608
MEDIA_UPLOAD_URL_TTL_SECONDS=300
MEDIA_ALLOWED_ORIGINS=
```

## 9. Rollout và kiểm thử

1. Tạo bucket preview riêng và custom media subdomain preview.
2. Tạo least-privilege credential; set secrets/vars, CORS và pending lifecycle.
3. Apply migration vào preview database.
4. Smoke upload từng format, MIME giả, quá size, URL hết hạn, retry finalize,
   duplicate filename, cùng giây/tháng rollover và path traversal.
5. Gắn ảnh vào broker/content; kiểm tra public render/cache/OG, mobile và a11y.
6. Xóa unused, chặn used, mô phỏng object delete lỗi rồi retry.
7. Chạy backup media + DB, restore sang bucket/base URL khác và xác minh key.
8. Lint, typecheck, Next build, safe Vinext build; quét bundle/log không có secret.

Production bucket/domain/credential và deploy vẫn cần owner chọn target rõ ràng.
