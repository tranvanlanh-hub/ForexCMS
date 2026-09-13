# Proposal: Taxonomy Manager and content assignment

Ngày: 2026-09-13. Trạng thái: kế hoạch, chưa triển khai.

## Vấn đề

Database đã có Category, Topic và TopicCluster cùng các quan hệ với ContentItem,
nhưng admin chưa có nơi quản lý taxonomy và form bài viết chưa lưu các quan hệ
này. Internal Link Automation đã đọc `primaryTopic.topicClusterId`, nên dữ liệu
taxonomy bị thiếu cũng làm chất lượng gợi ý liên kết thấp hơn thiết kế.

## Kết quả mong muốn

- Admin quản lý Category theo cây cha–con tối đa 3 cấp trong từng market.
- Admin quản lý Topic và Topic Cluster trong từng market/language.
- Mỗi bài chọn một primary category, thêm các category liên quan; chọn một
  primary topic và thêm các topic liên quan.
- Quan hệ primary luôn nằm trong tập taxonomy được gắn vào bài.
- Không thể gắn taxonomy khác market hoặc tạo cây sai/có vòng lặp.

## Phạm vi

- Thêm `/admin/taxonomy` với ba khu vực Category, Topics và Topic Clusters.
- CRUD cơ bản, tìm kiếm, lọc market/trạng thái và thống kê số bài đang dùng.
- Category có ba cấp cố định về giới hạn: cấp 1 root, cấp 2 child, cấp 3 grandchild.
- Gắn taxonomy vào create/edit Content Manager và draft tạo từ AI Import.
- Dùng primary topic/cluster hiện có để cải thiện Internal Link Automation.
- Auth/session/CSRF và phong cách UI admin hiện hành áp dụng cho mọi mutation.

## Ngoài phạm vi

- Không tạo public category/topic archive hoặc thay đổi URL/canonical bài viết.
- Không tự động phân loại bằng AI, bulk reassignment, merge taxonomy hoặc dịch
  taxonomy giữa các market trong MVP này.
- Không biến Category thành Topic hay Topic Cluster; mỗi loại giữ vai trò riêng.

## Quyết định sản phẩm

- Category là cấu trúc điều hướng ổn định, tối đa 3 cấp.
- Topic là nhãn biên tập chi tiết; MVP hiển thị dạng danh sách, không dùng `parentId`
  để tạo thêm một cây cạnh tranh với Category.
- Topic Cluster là nhóm chiến lược SEO/internal-link. Topic có thể chưa thuộc
  cluster khi chuẩn bị dữ liệu, nhưng bài publish có primary topic thì topic đó
  phải thuộc một cluster ACTIVE.
- Bài publish bắt buộc có primary category. Primary topic là tùy chọn để không
  chặn các loại nội dung chưa cần chiến lược cluster.

## Tiêu chí hoàn tất

- Không thể tạo Category cấp 4, chọn chính nó/descendant làm parent, hoặc chuyển
  node khiến hậu duệ vượt cấp 3.
- Slug Category và Topic duy nhất trong cùng market; Topic Cluster duy nhất theo
  market + language + slug như schema hiện tại.
- Bài chỉ gắn taxonomy cùng market; primary category/topic luôn nằm trong danh
  sách category/topic của bài sau mỗi lần lưu.
- Đổi market bài viết buộc người dùng chọn lại taxonomy hợp lệ, không âm thầm giữ
  liên kết sai market.
- Không thể xóa taxonomy đang được bài, rule, anchor hoặc cluster sử dụng; UI nêu
  rõ dependency và cho phép archive/inactive theo mô hình phù hợp.

## Ranh giới phiên lập kế hoạch

Change này chỉ lập kế hoạch. Chưa thay schema, migration, code, dữ liệu Neon,
commit, push hoặc deploy. Các thay đổi đang có trong workspace được giữ nguyên.
