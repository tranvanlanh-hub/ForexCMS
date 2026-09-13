# Tasks: URL Redirect Manager

Trạng thái: implemented — migration đã áp dụng vào database được cấu hình.

## Đợt 1 — Dữ liệu và ghi an toàn

- [x] Chốt schema ContentUrl và ownership theo canonical path.
- [x] Tạo migration/backfill; ghi rõ lịch sử cũ không thể suy ra từ revision.
- [x] Thêm service claim URL; cập nhật create/edit/import và guard market code.
- [x] Tích hợp content + SEO + revision + URL trong một transaction.

## Đợt 2 — Redirect public và cache

- [x] Resolver alias được gọi trước not-found trên public content route.
- [x] HTTP 308 tới canonical hiện tại; draft/archived/inactive destination trả 404.
- [x] Invalidation sau save cho public content và sitemap.
- [x] Xác minh HTTP 308, Location và trailing slash trên Next runtime.

## Đợt 3 — Manager và editor

- [x] Thay placeholder bằng danh sách search/filter/pagination, trạng thái đích.
- [x] Thêm alias thủ công cùng market/type và bật/tắt có auth/CSRF; giữ ownership.
- [x] Editor giải thích redirect tự động, hiển thị current URL và lịch sử.
- [x] Dùng responsive table/form và trạng thái empty/error/success.

## Đợt 4 — Kiểm thử và bàn giao

- [ ] Integration trên DB test: published A → B; A → B → C; A → B → A;
      đổi slug cùng lúc unpublish; draft chưa từng publish; republish.
- [ ] Thử duplicate current/alias/disabled alias, hai save đồng thời và stale form;
      cố ý lỗi giữa transaction phải rollback toàn bộ.
- [ ] Manual alias: path sai, external URL, route reserved, self redirect,
      khác market và URL của bài khác đều bị chặn theo design.
- [ ] Kiểm thử trước/sau làm nóng cache: old 308 + Location đúng, new 200;
      archived/draft/inactive 404; DB outage không thành cached not-found.
- [ ] Kiểm tra sitemap/canonical/hreflang/internal links dùng URL mới; đường
      comparison và affiliate không bị ảnh hưởng.
- [ ] Auth/CSRF sai không thể mutate; enabled/disabled không bị cache giữ sai.
- [x] Prisma validate/generate, lint, typecheck, Next build, safe Vinext build.
- [x] Smoke HTTP: alias enabled 308 đúng Location, canonical 200; alias disabled
      và draft target 404; admin thiếu session 307; dữ liệu smoke đã được dọn.
- [x] Cập nhật URL spec, ROADMAP và CODEX_HANDOFF; ghi giới hạn backfill.

Các bài kiểm thử concurrency/stale-form nâng cao còn là hardening tiếp theo;
không chặn luồng đổi slug và quản lý redirect hiện tại.
