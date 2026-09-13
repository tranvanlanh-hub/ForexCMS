# Design: URL Redirect Manager

## Cơ sở từ mã nguồn hiện tại

- `app/admin/content/actions.ts`: create/update đã có transaction cho content,
  SEO và revision; kiểm tra duplicate diễn ra trước transaction.
- `prisma/schema.prisma`: canonicalPath unique nhưng chưa có bảng redirect.
  ContentRevision không lưu slug/canonicalPath. publishedAt có thể bị xóa khi
  unpublish/archive, nên không dùng riêng trường này làm lịch sử public.
- `lib/routing/content.ts` và public page chỉ tìm bài published ở market active,
  sau đó trả notFound. Cần thêm bước resolve URL lịch sử trước notFound.
- `lib/cache/public.ts` cache lookup và sitemap; invalidation dùng profile `max`.
  Phải xác minh độ mới ngay sau mutation, không chỉ dựa vào TTL.
- `/admin/url-routing` hiện đi qua placeholder `app/admin/[section]/page.tsx`.
- AI import tạo draft trực tiếp; phải tham gia kiểm tra quyền sở hữu URL.

## 1. Dữ liệu và quyền sở hữu đường dẫn

Đề xuất một bảng `ContentUrl` dùng chung cho URL hiện tại và lịch sử:

- `id`, `path` unique toàn cục, `contentItemId` FK với delete Restrict.
- `publishedOnce` boolean: URL cụ thể này từng được publish hay chưa.
- `redirectEnabled` boolean: bật/tắt chuyển hướng khi path không còn hiện tại.
- `source` (CONTENT hoặc MANUAL), `createdAt`, `updatedAt`.
- Index contentItemId để lấy lịch sử; index bổ sung theo query thực tế.

URL hiện tại được xác định bằng so sánh path với ContentItem.canonicalPath,
không lưu thêm targetPath hoặc trạng thái current dễ lệch nhau. Destination luôn
lấy từ ContentItem hiện tại. URL lịch sử bị tắt vẫn được giữ quyền sở hữu.
Một bảng unique chung tránh race giữa bảng URL hiện tại và bảng redirect riêng.

Backfill tất cả canonical hiện tại, kể cả draft, để đặt quyền sở hữu thống nhất;
đánh dấu publishedOnce chắc chắn cho bài hiện PUBLISHED. Revision PUBLISHED
có thể chứng minh bài từng public nhưng không chứng minh URL cụ thể lúc đó:
không tự suy đoán URL cũ. Xuất báo cáo bài từng publish nhưng hiện không public
để rà soát/import alias thủ công. Migration không thể phục hồi lịch sử đã mất.

## 2. Luồng ghi

Service dùng chung trong `lib/routing/` nhận transaction client và dữ liệu mới.
Create/update/import phải sử dụng nó. Đọc lại content hiện tại trong transaction;
chống ghi đè editor cũ bằng version/updatedAt và kiểm tra affected-row count.
Unique constraint là hàng rào cuối; translate conflict thành lỗi dễ hiểu.

1. Kiểm tra đường dẫn đúng pattern, market/content type hợp lệ và không trùng
   route hệ thống; khóa riêng namespace compare để không đè route comparison.
2. Claim URL mới: URL của bài khác luôn bị chặn, kể cả redirect đã tắt.
3. Giữ URL cũ nếu publishedOnce; URL draft chưa từng public có thể giải phóng
   khi đổi path, trừ alias thủ công được giữ có chủ đích.
4. Nếu đổi về alias của chính bài: URL đó trở thành current; không redirect tới
   chính nó. Những alias khác vẫn trỏ tới canonical mới.
5. Ghi content, SEO, revision và ContentUrl trong cùng transaction. Đánh dấu
   publishedOnce cho URL hiện tại mỗi khi publish; không xóa khi unpublish.
6. Sau commit: invalidate lookup current/old/aliases, trang liên quan và sitemap.

Đọc trạng thái trước khi đổi giúp giữ URL cũ cả khi vừa đổi slug vừa unpublish.
Bulk status cũng cần giữ dấu public và invalidate cùng cơ chế. Rà các đường ghi
khác/seed để không có writer bỏ qua registry. Chặn đổi market code đang được
content/URL sử dụng trong MVP; di chuyển toàn bộ market là change riêng.

## 3. Resolve public

- Shared resolver trả một trong content, redirect, not-found; metadata và page
  dùng cùng quyết định, tránh metadata báo 404 trong khi body redirect.
- Chỉ resolve path chuẩn hóa theo grammar route hiện hành; không dùng normalize
  làm các URL sai khác trở thành alias ngoài ý muốn. Chặn URL tuyệt đối,
  protocol-relative, backslash, encoded separator và dot segments ở input admin.
- Current URL render bình thường nếu published/market active.
- Alias enabled + publishedOnce (hoặc MANUAL) chỉ redirect nếu bài đích đang
  published ở market active. Còn lại trả 404, giữ record cho lần republish.
- Đề xuất HTTP 308 cố định cho redirect vĩnh viễn trong MVP; xác minh response
  HTTP thật trước streaming ở Next và Vinext. Không coi meta refresh là đạt.
- Dùng destination path nội bộ, không nhận hostname từ form. MVP bỏ query của
  URL cũ; source matching chỉ theo pathname. Fragment không tới server.
- DB lỗi phải throw như resolver hiện tại, không biến thành cached 404.
- Không thêm lookup DB vào proxy auth cho mọi request. Ưu tiên public resolver;
  nếu runtime không đảm bảo status trước streaming, chọn điểm xử lý sớm có
  phạm vi giới hạn và ghi lại quyết định trước khi triển khai.

## 4. Admin và SEO

Trang `/admin/url-routing`: URL cũ, URL hiện tại, bài đích, nguồn tự động/thủ công,
trạng thái enabled/disabled/đích chưa public, ngày tạo; search/filter/pagination.
Form thủ công chọn ContentItem cùng market, chỉ nhận path thuộc route content
được hỗ trợ; không nhận target URL tự do. URL current không có nút disable.
Không hard-delete và không chuyển quyền sở hữu alias sang bài khác trong MVP.

Editor hiện preview old → new và giải thích redirect tự tạo khi lưu. Redirect
tự động mới enabled; alias đã bị admin tắt giữ lựa chọn đó qua các lần đổi slug.
Mọi mutation dùng requireAdminMutation/CSRF; UI tiếng Anh theo sản phẩm hiện hành.

Canonical, hreflang, sitemap và internal links theo ContentItem ID phải dùng URL
mới. Không đưa aliases vào sitemap. Không sửa hàng loạt link viết tay trong body;
link lịch sử còn lại được redirect, có thể báo cáo để biên tập sau.

## 5. Cache và triển khai

Xác minh immediate expiration phù hợp phiên bản Next/Vinext đã cài; không giả
định revalidateTag max loại bỏ ngay dữ liệu cũ. Invalidate cả cache hit/miss,
page/metadata, sitemap và các alias khi publish/unpublish/market activation.
Kiểm tra headers để browser/CDN không giữ redirect lỗi thời khi URL đích thay
đổi hoặc alias bị tắt; MVP ưu tiên no-store cho response redirect nếu runtime hỗ trợ.

Chuẩn bị migration additive + backfill có kiểm tra conflict, chạy trên database
test riêng trước. Khi rollout, tránh writer phiên bản cũ ghi ngoài registry bằng
cửa sổ dừng ghi ngắn hoặc cơ chế tương đương; kiểm tra coverage trước mở lại admin.
Không tự chạy migration vào Neon hiện có trong phiên lập kế hoạch. Build cả Next
và Vinext bằng safe wrapper sẵn có; không deploy trong phạm vi kế hoạch.
