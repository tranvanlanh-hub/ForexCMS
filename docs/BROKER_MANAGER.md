# Broker Manager

Tài liệu này mô tả trạng thái vận hành hiện tại của Broker Manager trên
MarketGB. Trạng thái release, migration và dữ liệu production mới nhất vẫn được
ghi tại [CODEX_HANDOFF.md](CODEX_HANDOFF.md).

## Phạm vi dữ liệu

`Broker` lưu thông tin hồ sơ dùng lại giữa review, comparison và affiliate:

- Identity: name, slug, legal company name, logo và short description.
- Editorial: status và priority; số priority nhỏ hơn được xếp trước.
- Contact: official website, support email, support phone/hotline và contact
  page URL.
- Company profile: founded year, headquarters country và headquarters address.
- Review: overall rating; trust & safety; commissions & fees; research &
  education; trading tools; trading platforms; customer support; account types;
  special features; account opening; rating summary và rating review date.

Các score là dữ liệu editorial tùy chọn theo thang `0.0–5.0`. Không tự động
tính overall rating và không điền score nếu chưa có phương pháp review cùng bằng
chứng rõ ràng.

## Phân tách trách nhiệm dữ liệu

- `Broker` giữ identity, contact, headquarters và điểm review tổng hợp.
- `BrokerFact` giữ từng factual claim như regulation/licence, spread, minimum
  deposit, platform hoặc account type. Mỗi fact phải có source name, source URL
  và có thể giới hạn theo market/jurisdiction.
- `AffiliateLink` giữ destination URL theo broker, market, language và campaign.
  Không đưa affiliate URL trực tiếp vào Broker hoặc nội dung bài viết.
- `ContentItem` loại `BROKER_REVIEW` là trang frontend được biên tập và publish.
  Broker status không tự tạo hoặc tự publish một trang frontend.

## Quy trình admin

1. Mở `/admin/brokers/` và chọn broker cần sửa.
2. Cập nhật các input theo từng nhóm Company, Contact, Headquarters, Ratings,
   Identity và Publishing.
3. Giữ broker ở `Draft` trong khi thông tin, nguồn và rating chưa hoàn chỉnh.
4. Thêm factual claims vào `Sourced broker facts`; không nhập claim pháp lý chỉ
   vào phần mô tả tự do.
5. Tạo hoặc sửa một `ContentItem` loại `Broker Review`, gắn broker tương ứng và
   hoàn tất nội dung/SEO.
6. Chỉ sau khi bài review được `Published`, cột `Frontend` tại Broker Manager mới
   hiện nút `View ↗` và mở canonical path trong tab mới.

Nếu chưa có một linked `BROKER_REVIEW` đã publish, cột `Frontend` hiển thị
`No page`. Hành vi này tránh mở URL đoán, lỗi 404 hoặc làm lộ draft.

## Bộ dữ liệu 36 broker

Dataset làm việc nằm tại `data/brokers/research-20260915.json`. Production đã
được nhập đủ 36 broker với priority từ 1 đến 36. Các record mới được tạo ở
`Draft`; rating để null.

Lệnh kiểm tra kế hoạch, không ghi database:

```text
npm run brokers:import
```

Lệnh ghi dữ liệu có chủ đích:

```text
npm run brokers:import -- --apply
```

Importer chỉ tạo slug còn thiếu. Với broker đã tồn tại, nó chỉ điền trường đang
trống hoặc giá trị demo rõ ràng và không ghi đè dữ liệu thật mà editor đã sửa.
Trước mọi lần import production lớn phải tạo backup PostgreSQL và xác nhận đúng
database đích.

Workbook nghiên cứu chi tiết, source URL và ghi chú jurisdiction nằm trong
`outputs/broker-research-20260915/marketgb-broker-research-36.xlsx`. Workbook là
tài liệu biên tập tham khảo; cần mở lại nguồn trước khi publish vì pháp nhân,
địa chỉ và kênh hỗ trợ có thể thay đổi theo quốc gia.

## Broker Review v1 — 2026-09-16 (deployed)

- Public review vẫn là ContentItem canonical path
  `/{market}/broker-reviews/{slug}/`; không có route broker profile riêng.
- `BrokerReviewAssessment` thêm một assessment hiện hành cho từng broker/market:
  Regulation & trust, Costs, Trading experience, Deposits & withdrawals, Support
  & education. Mỗi điểm 0–5; overall public là trung bình các tiêu chí đã chấm.
- Vào broker edit, chọn **Assess** ở market cần cập nhật. Assessment có reviewer,
  date và rationale per criterion. Legacy global scores vẫn chỉ là dữ liệu cũ/
  internal; Review v1 không dùng làm fallback.
- Public review chỉ hiện BrokerFact có source hợp lệ; fact đúng market override
  fact global cùng category/label. Không dùng `example.com` hay test data làm
  evidence publish.
- Tạo BrokerReview qua Content Manager, đặt Verdict/Summary, gắn broker và viết
  Markdown analysis. Missing core facts/heading chỉ hiện state warning/unavailable
  để editor có thể tiếp tục draft; không thay claim bằng copy tự tạo.
- Không có affiliate offer hợp lệ: review không link broker website thay thế, chỉ
  hiện disclosure. CTA top/middle/bottom thử campaign slot rồi fallback campaign
  Review đã cấu hình.

## Trạng thái production ngày 2026-09-15

- Broker profile/review input migration đã được áp dụng.
- Production có 36 broker: 35 `Draft`, 1 `Active` do owner cập nhật sau import.
- Chưa broker nào được liên kết với một `BROKER_REVIEW` đã publish; vì vậy cột
  `Frontend` hiện `No page` cho toàn bộ danh sách.
- Thay đổi dữ liệu không tự tạo BrokerFact, affiliate link hoặc public content.

## Kiểm tra khi thay đổi Broker Manager

- Prisma schema validate và client generate thành công.
- Typecheck, ESLint và Next production build thành công.
- Migration production chỉ chạy bằng `prisma migrate deploy`; không dùng reset
  hoặc `migrate dev` trên database dùng chung.
- Sau deploy, kiểm tra login, Broker Manager có session/không session, public
  homepage, link `View` nếu có bài published và service journal.
- Sau import, kiểm tra tổng số slug, priority, status và bảo đảm rating không bị
  điền ngoài chủ đích.
