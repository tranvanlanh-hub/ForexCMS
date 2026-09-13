# Production Readiness — Final Launch Check

> Historical audit from 2026-09-10. Production was subsequently deployed to
> `https://marketgb.com` on 2026-09-13. Use the current status at the top of
> [CODEX_HANDOFF.md](CODEX_HANDOFF.md) before acting on this older checklist.

Ngày kiểm tra: 2026-09-10. Commit đầu phiên: 09a320eb. Phạm vi: production nhỏ của dự án hiện tại; roadmap nhiều phiên đã dừng.

**Chưa thể launch production nhỏ nguyên trạng.** Không thiếu tính năng lớn để tiếp tục phát triển; còn lỗi runtime đã tái hiện, dữ liệu demo và điều kiện vận hành production chưa hoàn tất.

## MUST FIX BEFORE LAUNCH

1. **Broker Manager vượt CPU trên preview.** /admin/brokers/ với auth hợp lệ trả 503 lặp lại, body rỗng. Cloudflare tail ghi outcome exceededCpu và “Worker exceeded CPU time limit.” URL có query kiểm tra trả 200 với dữ liệu thật; /admin/brokers/new/ cũng 200, nhưng không thay thế việc URL gốc phải hoạt động. Xử lý giới hạn CPU/runtime hoặc tối ưu dựa trên đo đạc rồi kiểm tra lại URL gốc, auth và no-store trên build/target sẽ phát hành. Chưa thay đổi tài nguyên có phí hoặc deploy, chưa coi lỗi đã sửa.
2. **Chỉ public nội dung thật đã duyệt.** Neon có 16 published pilot, trong đó review demo và broker giả SampleFX/Example Markets. Cả 9 BrokerFact source URLs đều dùng example.com; trang review thật đang render nguồn placeholder. Cả 18 affiliate active dùng một destination thử nghiệm. Thay bằng nguồn/destination đã xác minh hoặc ẩn các broker, bài và CTA demo khỏi production (kể cả comparison sinh từ broker active). Homepage vẫn giới thiệu CMS shell và placeholder; cần nội dung giới thiệu/điều hướng phù hợp bộ bài được chọn. Không yêu cầu số lượng bài tối thiểu; không cần viết thêm hàng loạt.
3. **Hoàn tất target production và bảo vệ truy cập.** Chốt Worker/Neon và origin HTTPS, APP_ENV=production, APP_URL đúng origin, DATABASE_URL và admin secrets. Mật khẩu hiện dùng vẫn là credential preview tạm theo handoff và dưới 16 ký tự; số ký tự không tự chứng minh độ mạnh, cần mật khẩu riêng đủ mạnh cho production. Không tái dùng cấu hình Worker cũ chưa kiểm chứng. Phiên này chỉ xác minh runtime preview; chưa kiểm chứng secret/domain của production.
4. **Không để demo preview cạnh tranh index với production.** Preview robots hiện Allow: /, article meta index, follow, không có X-Robots-Tag. Áp dụng access protection hoặc noindex phù hợp; kiểm tra canonical/sitemap trên origin production sau khi triển khai. Chỉ Disallow trong robots không bảo đảm URL không bị index.
5. **Có khả năng khôi phục dữ liệu trước khi nhận nội dung thật.** Xác nhận một backup hoặc điểm khôi phục Neon sử dụng được và cách phục hồi. Phiên này chưa xác minh cơ chế đó; JSON snapshot pilot không phải full backup. Không bắt buộc xây hệ thống backup phức tạp hoặc restore sang VPS mới được launch nhỏ.

Production deploy chưa được thực hiện/ủy quyền trong yêu cầu này. Đây là điều kiện phát hành sau khi các blocker được đóng, không phải một roadmap kỹ thuật mới.

## CAN DO AFTER LAUNCH

- Theo dõi lỗi/uptime và tối ưu CPU/cache sâu hơn sau khi các route chính đã chạy ổn định; mở rộng log retention và alerting theo nhu cầu.
- Restore drill đầy đủ trong môi trường tách biệt, tự động hóa backup và backup media khi bắt đầu dùng upload; không cần dựng VPS cho việc này.
- Tối ưu warning Prisma WASM của Next build, performance/load test cho lưu lượng lớn, cải thiện trang chủ và SEO/content dần theo dữ liệu thực tế.
- Tăng số bài theo chất lượng; analytics/affiliate reporting, quy trình biên tập và UI nâng cao chỉ khi thực sự cần.

## NOT NEEDED NOW

- Roadmap phiên 41/42/43 hoặc kế hoạch kỹ thuật 20–30 phiên mới.
- Đủ 20, 50, 250 hay 4.000 bài mới launch; bulk AI publish.
- Refactor kiến trúc, đổi ORM/database, D1, chuyển VPS, nâng dependency lặt vặt.
- Page builder, nhiều template mới, phân quyền nhiều người phức tạp, tracking nâng cao.
- R2/S3 upload và media backup nếu bản launch không phụ thuộc uploaded media.

## Kết quả kiểm tra thực tế

| Hạng mục | Kết quả |
|---|---|
| Git | Đầu phiên sạch, HEAD 09a320eb; cuối phiên chỉ 3 docs được sửa. Không commit/push. |
| Secret | 464 lượt file hiện tại/lịch sử, 257 historical blobs trên toàn bộ 3 commit reachable: không thấy credential đang dùng, Neon credential URL hoặc mẫu key/token phổ biến. Env private ignored. Không phải bảo đảm tuyệt đối, không audit toàn bộ remote logs/secret store. |
| Lint/typecheck | npm run lint và npm run typecheck exit 0. |
| Next build | Exit 0; một warning broad WASM import của Prisma edge. |
| Cloudflare build | npm run build:vinext exit 0, hoàn tất 5 bước. Sandbox chặn ghi Wrangler log ngoài workspace; không làm build thất bại. Không deploy/dry-run deploy. |
| Neon | DATABASE_URL có sẵn; ban đầu sandbox chặn mạng, retry có quyền mạng thành công. Prisma migrate status: 7 migrations, schema up to date. Không chạy migrate dev/reset hoặc seed lại. |
| Seed/pilot | Data seed đã có; pilot:check pass: 16 published, 18 affiliate active, 16 accepted internal links; draft test còn private. |
| SEO audit | 16 published scanned, 0 structural issues. Audit này không xác minh độ chính xác nội dung/nguồn broker. |
| Public routes | Homepage, 16/16 bài, comparison đều 200; 16 bài có canonical đúng origin và một H1; 16 accepted links hiện trên HTML; draft 404. |
| Sitemap/robots | Index và chunk 200, chunk 16 URLs, origin preview đúng; robots 200 nhưng đang cho index demo. |
| Admin auth | Content: thiếu/sai auth 401; đúng auth 200. Dashboard, content/new, affiliate-links, SEO: thiếu auth 401; đúng auth 200/no-store. Broker list đúng auth 503 do CPU; query variant và new 200/no-store. Không thử ghi/publish admin. |
| Affiliate | Một redirect được cấu hình thử nghiệm trả 302, Location đúng destination và no-store; không follow ra website ngoài. Có một click test được ghi bởi route. Không chứng minh attribution/doanh thu affiliate thật. |
| Nội dung | Chưa public nguyên trạng: 9/9 nguồn broker placeholder, 18/18 CTA dùng đích test, 3 review chứa marker demo/pilot/CMS, homepage còn shell. |

Evidence private (ignored): backups/final-launch-check/smoke-results.json, additional.json và tail.txt. additional.json ghi lần kiểm tra broker thất bại đầu tiên; tail xác nhận CPU limit trong bước chẩn đoán sau đó. Không đưa credential hoặc raw logs vào Git.

Không sửa code theo phỏng đoán; không thêm feature, refactor, thay dữ liệu public, migration, secret, gói dịch vụ hoặc deployment. Giới hạn của kết luận: đây là HTTP/data/code review trên preview, không phải kiểm thử production đã gắn domain hay xác nhận biên tập nội dung tài chính.
