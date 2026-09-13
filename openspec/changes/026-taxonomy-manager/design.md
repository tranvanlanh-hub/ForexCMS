# Design: Taxonomy Manager and content assignment

## 1. Hiện trạng và thay đổi dữ liệu

Schema hiện có gần đủ:

- Category: `marketId`, `parentId`, slug/name/description và self relation.
- Topic: `marketId`, `parentId`, `topicClusterId`, slug/name/description.
- TopicCluster: market/language, priority content, status và priority.
- ContentItem: `primaryCategoryId`, `primaryTopicId`, many-to-many `categories`
  và `topics`.

Migration nhỏ được đề xuất:

- Thêm `CategoryStatus` (`ACTIVE`, `INACTIVE`, `ARCHIVED`) và `status` cho Category.
- Thêm `TopicStatus` tương tự và `status` cho Topic.
- Thêm index phục vụ cây/list: Category `(marketId,parentId,status,name)` và Topic
  `(marketId,topicClusterId,status,name)`.
- Giữ `parentId` của Topic để tương thích dữ liệu, nhưng UI MVP không cho tạo
  hierarchy Topic; dữ liệu parent hiện có nếu có phải được audit trước migration.

Không cần trường `level`: depth được tính từ parent chain trong transaction để
tránh level lưu sẵn bị lệch. Category tối đa ba node trên đường từ root tới leaf.

## 2. Invariant Category ba cấp

Service `lib/taxonomy/` là điểm ghi duy nhất cho Category:

1. Category không parent là cấp 1.
2. Parent cấp 1 tạo child cấp 2; parent cấp 2 tạo child cấp 3.
3. Category cấp 3 không xuất hiện trong danh sách parent có thể chọn.
4. Khi đổi parent, service tải ancestor của parent và toàn bộ depth lớn nhất của
   subtree đang chuyển. `new parent depth + subtree height` không được vượt 3.
5. Chặn self-parent và parent là bất kỳ descendant nào để loại vòng lặp.
6. Parent và child phải cùng market. Market của node có child hoặc bài đang dùng
   không được đổi trực tiếp; dùng workflow migrate riêng trong tương lai.
7. Unique `(marketId, slug)` tiếp tục là hàng rào database cuối cùng.

Delete dùng `Restrict`: chỉ xóa node chưa có child và chưa gắn với bài. Với node
đang dùng, admin chuyển INACTIVE/ARCHIVED. Category inactive vẫn hiển thị khi sửa
bài đã gắn nhưng không được chọn mới; publish yêu cầu primary category ACTIVE.

## 3. Topic và Topic Cluster

Topic là danh sách phẳng theo market trong UI. Mỗi Topic chọn tối đa một cluster;
cluster và topic phải cùng `marketId` và language lấy từ Market phải khớp
`TopicCluster.languageCode`. Topic slug unique theo market.

Topic Cluster Manager quản lý name, slug, description, status, priority và
priority ContentItem. Priority content phải cùng market, published khi cluster
ACTIVE, và có primary topic thuộc chính cluster đó. Có thể lưu cluster trước khi
chọn priority content; UI báo trạng thái chưa hoàn thiện.

Không hard-delete cluster khi còn Topic, AnchorText hoặc InternalLinkRule. Chuyển
cluster INACTIVE giữ nguyên lịch sử, nhưng engine chỉ nên dùng cluster ACTIVE khi
tạo suggestion mới. Suggestion đã accepted vẫn theo validation public hiện hành.

## 4. Gắn taxonomy vào Content Manager

Form create/edit thêm panel Taxonomy:

- Primary category: single select theo cây, label dạng `Parent / Child / Leaf`.
- Related categories: multi-select/checkbox; primary được tự thêm server-side.
- Primary topic: single select theo cluster; có lựa chọn none.
- Related topics: multi-select/checkbox; primary được tự thêm server-side.

Client lọc lựa chọn khi đổi market để dễ dùng, nhưng server luôn xác thực lại.
Server action nhận ID, loại trùng, giới hạn số lượng hợp lý (đề xuất 10 category
và 20 topic mỗi bài), tải tất cả record trong một query và kiểm tra cùng market.

Trong transaction đang ghi content/SEO/revision/URL:

- `primaryCategoryId` và `primaryTopicId` được ghi cùng content.
- many-to-many dùng `set` để bỏ quan hệ cũ không còn chọn.
- primary ID luôn được union vào tập `set`.
- Publish chặn thiếu primary category hoặc primary category inactive.
- Nếu có primary topic khi publish, topic và cluster của nó phải ACTIVE.

Đổi market bài viết: lựa chọn taxonomy cũ không hợp lệ trả lỗi rõ, form giữ dữ
liệu người dùng qua query/error flow hiện có hoặc bổ sung action-state phù hợp.
Không tự xóa taxonomy rồi lưu vì điều đó dễ làm mất phân loại ngoài ý muốn.

AI Import schema bổ sung optional `primaryCategorySlug`, `categorySlugs`,
`primaryTopicSlug`, `topicSlugs`. Import chỉ resolve trong market của draft và
vẫn lưu DRAFT; slug không tồn tại trả validation error, không tự tạo taxonomy.

## 5. Admin UX

Thêm mục `Taxonomy` vào navigation, route `/admin/taxonomy` với tab/query param:

- Categories: tree 3 tầng, expand/collapse, số bài direct/total subtree, trạng thái,
  create/edit và filter market.
- Topics: search, market/cluster/status filter, usage count, create/edit.
- Topic Clusters: status/priority, số topic, số bài qua topics, priority page và
  liên kết tới Internal Links.

Form Category chỉ hiển thị parent hợp lệ và preview `Level 1/2/3`. Khi edit node
có subtree, server vẫn tính lại độ sâu thay vì tin UI. Các mutation sử dụng
`requireAdminMutation`, CSRF và admin cache no-store hiện hành.

Delete là action riêng có xác nhận giao diện và server dependency check. Nếu có
dependency, trả danh sách loại dependency và hướng người dùng archive record.

## 6. Ảnh hưởng SEO, public và cache

MVP không thêm taxonomy vào canonical path, sitemap hoặc breadcrumb public nên
không phát sinh redirect. Public renderer có thể đọc taxonomy để chuẩn bị UI sau,
nhưng không hiển thị archive page chưa có spec.

Content mutation tiếp tục revalidate public content vì taxonomy có thể được dùng
cho schema/internal links sau này. Taxonomy change cần revalidate admin pages và
cache suggestion inputs; không tự regenerate suggestion hoặc sửa accepted links.

## 7. Migration và dữ liệu hiện có

Trước apply migration, audit số Category/Topic/Cluster, orphan relation, cross-
market relation, Topic parent hierarchy và category depth. Vì form content hiện
chưa gắn taxonomy, 17 content hiện tại có thể thiếu primary category; migration
không được tự đoán phân loại.

Rollout theo thứ tự:

1. Additive schema/status/index migration.
2. Deploy manager và cho owner tạo taxonomy thật.
3. Gắn taxonomy cho bài hiện có qua edit workflow.
4. Chỉ bật publish guard bắt buộc primary category sau khi dữ liệu published đã
   được backfill; dùng audit/gate rõ ràng để tránh làm các bài hiện tại không sửa được.

Nếu muốn triển khai trong một release, migration tạo category `Uncategorized`
không được dùng mặc định vì làm bẩn taxonomy SEO. Thay vào đó giữ guard theo
transition: bài mới hoặc bài từ non-published → PUBLISHED bắt buộc taxonomy;
bài published cũ được sửa nội dung nhưng admin hiển thị cảnh báo cần xử lý.
