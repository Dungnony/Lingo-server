# Triển khai lingo-server lên VPS

Hướng dẫn chạy API trên một VPS Linux bằng PM2, kèm CI/CD tự deploy khi push lên `main`.

## Yêu cầu

- Node.js 22 (khuyến nghị cài qua nvm), `npm`, `git`
- PostgreSQL (và Redis nếu dùng) — tự cài, dùng dịch vụ hosted, hoặc chạy `docker compose up -d`
  với `docker-compose.yml` có sẵn trong repo (Postgres cổng 2222, Redis cổng 2223)
- Reverse proxy (nginx, Caddy…) có HTTPS trỏ tên miền API về cổng `PORT` (mặc định 8000)

## Lần đầu (thủ công — chỉ làm 1 lần)

CI/CD (`.github/workflows/deploy.yml`) chỉ `git reset --hard` + build + `pm2 restart` — nó
**không** clone repo lần đầu, không tạo `.env`, không dựng Postgres/Redis, và không đăng ký
tiến trình với PM2. Các bước dưới đây làm đúng 1 lần cho một VPS mới.

```bash
git clone https://github.com/Dungnony/Lingo-server.git <VPS_APP_PATH>
cd <VPS_APP_PATH>
# <VPS_APP_PATH> phải khớp chính xác secret VPS_APP_PATH trên GitHub,
# vì mỗi lần deploy sau CI sẽ `cd` vào đúng đường dẫn đó.

cp .env.example .env
nano .env                       # điền giá trị production (xem bên dưới)
chmod 600 .env

docker compose up -d            # bỏ qua nếu đã có Postgres/Redis riêng

npm ci
npx prisma generate
npx prisma migrate deploy
npm run db:seed                 # một lần duy nhất — KHÔNG nằm trong CI/CD
npm run build

npm i -g pm2                    # nếu VPS chưa có
pm2 start dist/src/main.js --name lingo-server
pm2 save
pm2 startup                     # copy lệnh in ra và chạy — để PM2 tự khởi động lại sau khi VPS reboot
```

Kiểm tra:

```bash
pm2 logs lingo-server --lines 50
curl http://localhost:8000/api/health   # {"status":"ok","db":"up","redis":"up"}
```

### Biến môi trường cho production

So với `.env.example`, nhớ đổi ít nhất:

- `NODE_ENV=production`
- `APP_URL` — URL công khai của API (vd `https://api.example.com`)
- `FRONTEND_URL` — URL của client (CORS + redirect)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — chuỗi ngẫu nhiên mạnh (`openssl rand -base64 48`)
- `COOKIE_DOMAIN` — domain chung của client và API (vd `.example.com`), `COOKIE_SECURE=true`
- `GOOGLE_CLIENT_ID`, `GEMINI_API_KEY`, `MAIL_*`, `VAPID_*` nếu dùng các tính năng tương ứng

## Bật CI/CD tự deploy

Mỗi push/PR lên `main` luôn chạy job `ci` (lint + build). Job `deploy` chỉ chạy khi đã cấu
hình đủ trong GitHub → Settings → Secrets and variables → Actions:

| Loại | Tên | Giá trị |
| --- | --- | --- |
| Variable | `DEPLOY_ENABLED` | `true` |
| Secret | `VPS_HOST` | IP hoặc hostname VPS |
| Secret | `VPS_USER` | user SSH |
| Secret | `VPS_SSH_KEY` | private key SSH (public key đã thêm vào `~/.ssh/authorized_keys` trên VPS) |
| Secret | `VPS_PORT` | cổng SSH (bỏ trống = 22) |
| Secret | `VPS_APP_PATH` | thư mục đã clone repo ở bước trên |

Sau đó mọi push lên `main` sẽ tự động: lint + build → SSH vào VPS → `git reset --hard
origin/main` → `npm ci` → `prisma generate` → `prisma migrate deploy` → `npm run build` →
`pm2 restart lingo-server --update-env`.

## Lưu ý

- `npm run db:seed` không chạy trong CI/CD; chạy tay khi cần nạp lại dữ liệu
  (`SEED_RESET=true` xoá toàn bộ từ vựng và tiến độ ôn tập liên quan).
- Khi đổi nội dung FAQ của trợ lý AI, xoá các dòng `faq:%` trong bảng `AssistantIndexChunk` để
  trợ lý đánh index lại.
