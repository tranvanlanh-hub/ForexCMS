# Tasks: Media Manager and S3-compatible image upload

Trạng thái: implemented locally — migration đã áp dụng; smoke R2 thật chờ cấu hình.

## Đợt 1 — Hạ tầng và schema

- [ ] Chốt preview bucket, public media domain, CORS origins và credential scope.
- [x] Thêm S3 client/presigner qua `lib/storage`; validate config, không lộ secret.
- [x] Tạo MediaAsset/MediaVariant/usage migration và index; Prisma generate.
- [ ] Unit test key builder: UTC yyyymm, assetId, extension allowlist, traversal.

## Đợt 2 — Upload an toàn

- [x] Upload intent có auth/CSRF/rate/size/MIME validation và presigned PUT 5 phút.
- [ ] Client upload progress/retry; không lưu hoặc log presigned URL.
- [x] Finalize idempotent: HEAD, magic bytes, dimensions, pending → uploads copy,
      destination verify, pending cleanup và READY state.
- [ ] Cleanup pending hết hạn và ERROR recovery; lifecycle prefix `pending/`.

## Đợt 3 — Media Library

- [x] Navigation + `/admin/media` grid/list, search/filter/pagination/empty/error.
- [x] Upload UI, preview, alt/caption edit và metadata cơ bản.
- [x] Soft delete state machine, dependency guard và retry object deletion.
- [ ] Responsive/a11y check cho desktop/mobile, keyboard và progress announcements.

## Đợt 4 — Tích hợp sản phẩm

- [x] Shared media picker chỉ hiển thị READY images.
- [x] Broker logoMediaId với fallback logoUrl cũ.
- [x] Content featuredMediaId/socialMediaId; SEO/OG fallback và validation.
- [x] Cấu hình media origin cho CSP; revalidate public cache.

## Đợt 5 — Verification và rollout

- [ ] Integration test format hợp lệ, MIME giả, size 0/quá lớn, expiry/replay,
      duplicate filename, finalize/delete retry và month rollover.
- [x] Test quan hệ usage và rollback; dependency guard chặn asset đang dùng.
- [ ] Smoke preview R2 upload/read/public custom domain/delete và CORS đúng origin.
- [ ] Backup + restore DB/media sang base URL khác; URL suy ra vẫn đúng.
- [x] Prisma validate/generate, lint, typecheck, Next build, safe Vinext build,
      secret scan và kiểm tra không có credential/presigned URL trong output.
- [x] Cập nhật spec, ROADMAP, env mẫu và CODEX_HANDOFF.

Điểm bắt đầu phiên code: cần owner chọn hoặc xác nhận preview R2 bucket và public
media domain trước bước smoke hạ tầng; schema và adapter có thể chuẩn bị độc lập.
