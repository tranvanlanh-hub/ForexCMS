# Proposal: URL Redirect Manager

Ngày: 2026-09-13. Trạng thái: kế hoạch, chưa triển khai.

## Vấn đề và kết quả mong muốn

Content Manager hiện thay `canonicalPath` khi sửa slug nhưng không lưu URL cũ.
Người truy cập link đã publish sẽ gặp 404. Change này bảo vệ URL đã public và
thay placeholder `/admin/url-routing` bằng màn hình quản lý lịch sử đường dẫn.

Ví dụ: bài đổi `/global/education/old/` thành `/global/education/new/` thì URL
cũ chuyển hướng vĩnh viễn tới URL mới, và URL mới trả nội dung published.

## Phạm vi

- Tự lưu lịch sử URL khi publish và tự redirect khi URL của bài đã public thay đổi.
- Theo dõi toàn bộ canonical path, bao gồm thay slug, market hoặc content type
  qua Content Manager; không chỉ so sánh slug.
- Redirect cùng website tới canonical hiện tại của cùng ContentItem, một bước.
- Danh sách có tìm kiếm, phân trang, lọc market/trạng thái; xem bài đích và
  bật/tắt redirect. Tạo thủ công alias cho URL cũ bị mất trước khi có tính năng.
- Cảnh báo trong editor về URL cũ/mới; cập nhật SEO và cache đồng bộ.
- Áp dụng auth/session/CSRF hiện hành cho mọi thao tác admin.

Không bao gồm external redirect, regex/wildcard, redirect affiliate, chuyển
domain, analytics lượt redirect, đổi hàng loạt market code hay revision restore UI.
Không cần hoàn thành Taxonomy/Revision Manager trước change này.

## Tiêu chí hoàn tất

- A → B → C: A và B chuyển thẳng tới C; C trả 200 khi bài published/market active.
- A → B → A không tạo vòng lặp; bài khác không được chiếm URL lịch sử.
- Draft chưa từng public không sinh redirect tự động; unpublish không lộ draft.
- Content, SEO, quyền sở hữu URL và revision được lưu nguyên tử; lỗi không để
  bài đổi URL mà mất redirect.
- Kiểm thử sau khi làm nóng cache chứng minh URL cũ không tiếp tục trả nội dung
  cũ hoặc 404 sai sau save.

## Ranh giới phiên lập kế hoạch

Chỉ tạo bộ tài liệu này. Chưa đổi mã nguồn, tạo/apply migration, ghi database,
commit, push hoặc deploy. Những thay đổi sẵn có trong workspace được giữ nguyên.
