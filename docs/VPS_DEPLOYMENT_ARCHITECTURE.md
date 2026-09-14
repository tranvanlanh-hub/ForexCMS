# VPS Deployment Architecture

## Quyết định đã chốt

MarketGB sẽ chuyển runtime production từ Cloudflare Workers sang một VPS Vultr
để tránh giới hạn CPU 10 ms và lỗi Prisma WASM xảy ra không ổn định trên edge.
Cloudflare vẫn đứng phía trước để quản lý DNS, proxy, HTTPS, cache và bảo vệ
website.

Cấu hình VPS dự kiến:

- Vultr Shared CPU, Singapore.
- 1 vCPU, 2 GB RAM, 55 GB SSD.
- Ubuntu 24.04 LTS x64. Không chọn Ubuntu 26.04 cho lần cài production đầu tiên.
- Automatic Backups của Vultr đang được owner cân nhắc/bật.
- Tạo khoảng 2 GB swap.

Traffic dự kiến ban đầu chỉ khoảng 150-200 session/ngày. Cấu hình này đủ cho tải
hiện tại nếu PostgreSQL được giới hạn tài nguyên và không build Next.js trực tiếp
trên VPS.

## Kiến trúc đích

```text
Internet
  -> Cloudflare DNS/CDN/proxy
  -> Caddy hoặc Nginx trên VPS
     -> Next.js chạy bằng Node.js runtime
     -> PostgreSQL trên cùng VPS
     -> Adminer + PHP-FPM để quản trị PostgreSQL
     -> thư mục media local: /var/www/marketgb/shared/uploads/yyyymm/
```

Adminer là phần mềm miễn phí. Adminer chỉ là giao diện quản trị database, không
phải database. Dự án tiếp tục dùng PostgreSQL; không chuyển sang MySQL chỉ để sử
dụng phpMyAdmin. Adminer hỗ trợ PostgreSQL và nhẹ hơn pgAdmin cho VPS 2 GB.

## Thành phần cần cài

- Ubuntu 24.04 LTS x64 và các bản cập nhật bảo mật.
- Firewall chỉ mở SSH, HTTP và HTTPS; PostgreSQL không public ra Internet.
- Caddy hoặc Nginx làm reverse proxy.
- Node.js LTS tương thích với phiên bản Next.js của repo.
- PostgreSQL và một database user riêng có quyền tối thiểu.
- PHP-FPM cùng Adminer, chỉ mở qua HTTPS và có thêm lớp bảo vệ truy cập.
- Process manager: ưu tiên systemd; PM2 cũng chấp nhận được.
- Git hoặc cơ chế nhận build artifact từ CI/local.
- `pg_dump`, `pg_restore` và công cụ nén/sao chép backup.

## Nguyên tắc triển khai ứng dụng

- Dùng Prisma Client native cho Node.js trên VPS. Không dùng edge client,
  `client-edge/wasm.js`, Neon adapter hoặc Cloudflare request-scoped client ở
  runtime VPS.
- Chuyển `DATABASE_URL` sang PostgreSQL local qua loopback hoặc Unix socket.
- Giữ migration hiện có và chạy `prisma migrate deploy`; không reset hoặc seed
  đè database production.
- Build ở local hoặc CI rồi chuyển artifact lên VPS. Next.js build có thể dùng
  nhiều RAM hơn mức an toàn của VPS 2 GB.
- Secret nằm trong systemd environment file hoặc file env chỉ root/app user đọc
  được. Không commit credential.
- Chạy ứng dụng bằng user riêng, không chạy bằng root.
- Giữ một release trước để rollback nhanh.

## Media local

Media Manager sẽ được chuyển từ S3/R2 sang filesystem local nhưng vẫn giữ cách
chia thư mục theo tháng:

```text
/var/www/marketgb/shared/uploads/202609/
/var/www/marketgb/shared/uploads/202610/
```

Thư mục `shared/uploads` phải nằm ngoài thư mục release để deploy phiên bản mới
không xóa ảnh. Caddy/Nginx có thể phục vụ `/uploads/` trực tiếp. Ứng dụng cần lưu
đường dẫn tương đối/public URL trong database, không lưu đường dẫn tuyệt đối phụ
thuộc một release.

Owner chấp nhận rủi ro lưu database và media trên cùng VPS và sẽ định kỳ tải
backup database về máy local. Không bắt buộc R2 trong kiến trúc đã chốt.

## Thứ tự thực hiện ở phiên tiếp theo

1. Tạo VPS đúng cấu hình và ghi lại IP; không đưa root password/API key vào Git.
2. Tạo SSH key/user vận hành, tắt đăng nhập root bằng password sau khi xác minh
   user mới đăng nhập được.
3. Cập nhật hệ điều hành, cấu hình timezone UTC, firewall và 2 GB swap.
4. Cài Caddy/Nginx, Node.js, PostgreSQL, PHP-FPM và Adminer.
5. Tạo database/user production, sau đó restore bản dump mới nhất từ Neon.
6. Sửa tầng runtime database sang Prisma Node native và tầng media sang local
   filesystem; kiểm thử ở staging/local trước khi cắt domain.
7. Build artifact, cài service systemd và cấu hình reverse proxy.
8. Đồng bộ media nếu đã có; tạo quyền ghi đúng cho app user.
9. Smoke test bằng hostname tạm hoặc hosts override: public article, login/TOTP,
   tạo/sửa/publish bài, taxonomy, URL redirect, media upload, sitemap và robots.
10. Chỉ sau khi toàn bộ smoke test đạt mới chuyển Cloudflare origin/domain sang
    VPS. Giữ Worker cũ trong thời gian rollback ngắn.

## Kiểm tra sau khi chuyển domain

- Public URL trả 200 ổn định qua nhiều request liên tiếp, không còn 500/503.
- Admin login, TOTP và session hoạt động sau restart service.
- Tạo bài chỉ với title + body; SEO mặc định và slug được sinh đúng.
- Upload, đọc và xóa media đúng thư mục `uploads/yyyymm`.
- Redirect slug cũ, canonical, sitemap và robots đúng domain thật.
- Restart VPS/app/PostgreSQL không làm mất database hoặc media.
- `pg_dump` tạo được file và file đó tải về local thành công.
- Theo dõi RAM, swap, CPU và dung lượng đĩa trong vài ngày đầu.

## Không làm trong lần chuyển đầu

- Không đổi PostgreSQL sang MySQL/MariaDB.
- Không dùng phpMyAdmin; dùng Adminer cho PostgreSQL.
- Không chuyển domain trước khi restore và smoke test hoàn tất.
- Không xóa Neon hoặc Worker ngay sau cutover; chỉ dọn khi VPS đã chạy ổn định và
  có backup xác nhận dùng được.
