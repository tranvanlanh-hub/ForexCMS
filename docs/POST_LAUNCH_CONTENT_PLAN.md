# Kế hoạch content sau public — checkpoint 40

Đây là kế hoạch đề xuất, không phải lệnh tạo/import/publish trong phiên 36–40. Ngày T0 là ngày launch được chủ dự án xác nhận sau khi mọi launch gate hoàn tất.

## Bộ bài ban đầu

Chuẩn bị **50 bài thật**, publish **20 bài đã duyệt**, giữ **30 draft**. Chia bộ launch 10 global tiếng Anh + 10 Việt Nam tiếng Việt có dấu, mỗi thị trường: 5 bài giáo dục/rủi ro, 3 hướng dẫn, 1 review broker có nguồn, 1 hub theo template hiện có. Nếu review hoặc hub chưa đủ chất lượng, lùi launch phần đó; không bù bằng bài demo hay bài mỏng để đạt chỉ tiêu.

Trạng thái thực tế hiện nay: Neon có 16 published pilot + 1 draft; file batch có 50 draft mẫu và manifest kế hoạch 250 dòng. Đây không phải 50/250 bài thật đã được duyệt. Không đưa SampleFX, thông tin fact demo, CTA test hoặc câu mô tả thử nghiệm CMS lên production. Không lấy tiêu đề mẫu rồi đổi vài từ thành hàng trăm bài.

## Thứ tự topic cluster

1. Nền tảng và rủi ro: cặp tiền, pip/lot, margin/leverage, quản trị rủi ro, tài khoản demo. Mỗi bài giải quyết một câu hỏi riêng.
2. Quy trình tài khoản: kiểm tra broker, hiểu pháp nhân trong hợp đồng, mở/xác minh tài khoản, đọc điều kiện nạp/rút. Các khẳng định pháp lý theo thị trường cần nguồn gốc và người duyệt phù hợp.
3. Review broker có dữ liệu: chỉ thêm broker thật với fact có nguồn, ngày kiểm tra, phạm vi thị trường và CTA được quản lý tập trung.
4. So sánh broker theo nhu cầu: chỉ tạo cặp có dữ liệu thật đủ để so sánh; giải thích phương pháp, thiếu dữ liệu thì không xếp hạng tùy tiện.
5. Hub và danh sách chọn broker theo nhu cầu/thị trường: mở rộng sau khi có đủ bài hỗ trợ và bằng chứng sử dụng. Không nhân bản hàng loạt trang quốc gia chưa có nội dung địa phương riêng.

Hub ban đầu gom 2 cluster đầu; bổ sung cluster 3–5 dần sau launch. Internal link phải cùng market/language, liên quan trực tiếp, có ít nhất một đường vào từ bài/hub khác; không chỉ đánh dấu ACCEPTED trong DB mà phải kiểm tra anchor thật trên HTML.

## Lịch tạo 50 / 100 / 250 bài

Các mốc là tổng số bài thật đã biên soạn, không phải số bài tự động published. Lịch có thể lùi theo năng lực review và chất lượng indexing.

| Mốc | Thời gian đề xuất | Tạo thêm | Published tối đa tích lũy | Draft/review còn lại |
|---|---|---:|---:|---:|
| 50 | Hai tuần chuẩn bị trước T0 | 50, một batch tối đa 50 | 20 tại T0 | 30 |
| 100 | Tuần 1–6 sau T0 | 50, một batch tối đa 50 | 40 | 60 |
| 250 | Tuần 7–16 sau T0 | 150, chia ba batch 50 | 100 | 150 |

Nhịp publish: khoảng 3–5 bài/tuần ở giai đoạn đầu; tăng tới 5–6 bài/tuần nếu người duyệt và dữ liệu vận hành đủ tốt. Không cần publish hết số draft. Mỗi batch chạy validation riêng, import qua luồng draft-only hiện có, review và publish từng bài; công cụ ai:batch:validate là dry-run, không phải importer. 4.000 bài vẫn là mục tiêu 3–4 năm, không phải điều kiện launch.

## Audit trước publish

Editor duyệt tính chính xác, nguồn, nội dung riêng, ngôn ngữ, tác giả/reviewer, disclosure và cảnh báo rủi ro phù hợp. Đối chiếu fact broker với nguồn gốc mới nhất trước khi dùng, không coi fact demo hoặc AI output là bằng chứng.

Chạy `content:audit` và `ai:batch:validate` trên đúng file batch (validator tối đa 50). Kiểm tra duplicate intent/slug/canonical, metadata, một H1, FAQ đúng nội dung hiển thị, schema phù hợp, hreflang đúng bản dịch, token affiliate hợp lệ. Không hard-code affiliate URL. Chạy SEO audit database, xem dashboard và preview HTML từng bài trước khi publish. `pilot:check` chỉ dùng cho database pilot; không yêu cầu production giữ broker giả/bài mẫu để vượt kiểm tra này.

## Audit sau publish

Trong ngày publish: URL trả 200, canonical đúng production, không noindex nhầm, sitemap chỉ chứa URL được phép index; kiểm tra internal link thật, CTA/redirect, draft không public. Chờ/kiểm tra cache revalidation sau sửa dữ liệu; sửa qua admin để kích hoạt invalidation. Direct DB repair cần kiểm tra sau TTL và không được xem DB pass là public pass.

Ngày 1 và 7: kiểm tra lỗi HTTP/runtime, đường dẫn sitemap, coverage theo market, link hỏng và Search Console URL Inspection cho mẫu gồm hub/article/review của mỗi market. Hàng tuần: so sánh cohort theo tuần publish, discovered/crawled/indexed, canonical Google chọn, impressions và click. Hàng tháng: rà lại fact broker, affiliate đích, orphan và nội dung trùng ý định. Ghi rõ affiliate smoke tạo click test trong analytics; không tính chúng là chuyển đổi thật.

## Tiêu chí tạm dừng

Các ngưỡng dưới đây là ngưỡng vận hành nội bộ đề xuất, **không phải tiêu chuẩn hay cam kết của Google**.

- Dừng publish ngay nếu admin bị public, URL published trả 5xx, canonical sai domain, noindex/robots chặn nhầm diện rộng, sitemap sai, draft lọt public, CTA sai broker/đích, hoặc phát hiện claim broker không có nguồn.
- Đóng băng batch mới nếu audit có lỗi blocking/duplicate intent đáng kể; sửa và kiểm tra lại toàn bộ batch trước khi tiếp tục.
- Nếu sau 14 ngày nhiều URL chưa được crawl/index, kiểm tra mẫu và khả năng discover trước; không mặc định là bị phạt.
- Nếu cohort có ít nhất 20 URL hợp lệ đã public 28 ngày mà dưới 50% được index, hoặc trên 20% URL mẫu gặp canonical khác/soft-404/duplicate, tạm dừng tăng tốc. Kiểm tra crawl, nội dung, internal links và tính khác biệt; không tạo thêm 150 bài để bù.
- Khi có manual action/security issue trong Search Console, ngừng mở rộng và xử lý nguyên nhân. Không xóa hàng loạt URL chỉ vì traffic ngắn hạn giảm.
- Chỉ mở lại nhịp tăng sau khi lỗi kỹ thuật đã hết và hai lần kiểm tra tuần liên tiếp cho thấy cải thiện; owner/editor ghi lại quyết định. Không hứa thời gian Google index hay doanh thu.

Cơ sở: Google ưu tiên nội dung hữu ích cho người đọc, có giá trị thực; tạo số lượng lớn chủ yếu để thao túng thứ hạng có thể vi phạm chính sách scaled content abuse. Kế hoạch số lượng và ngưỡng trên là đề xuất riêng cho dự án. Nguồn: [Helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

Kiểm tra checkpoint 40: tổng số 20+30=50, 40+60=100, 100+150=250; mỗi batch không quá 50; không có bước auto-publish; có gate trước/sau publish và tiêu chí dừng. Chưa tạo thêm bài thật hoặc thay đổi lịch publish trong CMS.
