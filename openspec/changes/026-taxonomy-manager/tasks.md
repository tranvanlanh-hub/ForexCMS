# Tasks: Taxonomy Manager and content assignment

Trạng thái: implemented — migration đã áp dụng vào database được cấu hình.

## Đợt 1 — Audit và schema

- [x] Audit Neon: số record, category depth/cycle, Topic parent, orphan/cross-market
      relation và số bài published chưa có primary category/topic.
- [x] Chốt status enum, index và delete policy; tạo migration additive.
- [x] Viết taxonomy service cho tree depth, cycle, subtree move,
      same-market, slug conflict và dependency checks.

## Đợt 2 — Category Manager ba cấp

- [x] Thêm navigation và `/admin/taxonomy?view=categories`.
- [x] Tree tối đa 3 cấp, market filter, search và usage counts.
- [x] Create/edit/archive/delete an toàn; parent selector loại node cấp 3.
- [x] Validation root → child → grandchild; chặn cấp 4, self/descendant parent, cross-
      market parent và move subtree vượt depth.

## Đợt 3 — Topic và Topic Cluster Manager

- [x] Topics list/create/edit/archive/delete, chọn cluster cùng market/language.
- [x] Cluster list/create/edit/status/priority page và dependency counts.
- [x] Chặn priority page sai market/sai cluster; chặn delete khi còn dependency.
- [x] Cập nhật Internal Link engine chỉ dùng cluster ACTIVE cho suggestion mới.

## Đợt 4 — Gắn vào bài viết và AI Import

- [x] Panel taxonomy trong content create/edit, lựa chọn theo cây/cluster.
- [x] Server validation và transaction save primary + many-to-many relations.
- [x] Publish transition bắt buộc primary category ACTIVE; primary topic nếu có
      phải ACTIVE và thuộc cluster ACTIVE.
- [x] Bổ sung slug taxonomy optional vào AI Import; resolve-only, không auto-create.
- [x] Audit/report bài published cũ chưa taxonomy và cảnh báo backfill thủ công.

## Đợt 5 — Verification và bàn giao

- [ ] Integration tests cho create/edit content, đổi market, primary membership,
      relation replacement và rollback khi taxonomy invalid.
- [ ] Xác minh Internal Link scoring theo primary topic/cluster sau khi gắn taxonomy.
- [ ] Kiểm tra auth/CSRF, empty/error/loading, desktop/mobile và database failure.
- [x] Prisma validate/generate, lint, typecheck, Next build, safe Vinext build.
- [x] Apply migration lên target đã chọn, smoke admin/database không sửa nhầm nội
      dung, rồi cập nhật content/internal-link spec, ROADMAP và CODEX_HANDOFF.

Kiểm thử tự động sâu cho mọi tổ hợp move/cycle và UI lọc tức thời theo market có
thể bổ sung ở vòng hardening; validation server và smoke chính đã hoàn tất.
