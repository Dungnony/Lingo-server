# Triển khai Lingo (PaaS: Render/Railway + Vercel, hoặc VPS Linux)

Tài liệu này hướng dẫn 2 cách triển khai:
1. **PaaS miễn phí / Cloud (Khuyến nghị để chạy nhanh):** Server + PostgreSQL trên **Render** (hoặc **Railway**), Client trên **Vercel**.
2. **VPS Linux tự quản lý:** Chạy bằng PM2 + Docker Postgres/Redis + CI/CD GitHub Actions.

---

## Cách 1: Deploy lên Render / Railway (Server) + Vercel (Client)

### Bước 1: Deploy `lingo-server` lên Render (hoặc Railway)

Repo đã có sẵn [`render.yaml`](../render.yaml) và [`Dockerfile`](../Dockerfile).

**Với Render (dùng Blueprint tự động tạo cả Web Service + PostgreSQL):**
1. Đẩy code `Lingo-server` lên GitHub (`https://github.com/Dungnony/Lingo-server`).
2. Vào **Render Dashboard** → **New +** → **Blueprint** → chọn repo `Lingo-server`.
3. Render sẽ tự tạo database `lingo-db` và web service `lingo-server` cùng các biến `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`, `COOKIE_DOMAIN=""`, `TRUST_PROXY_HOPS=1`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
4. Điền các biến còn lại trên giao diện Render:
   - `APP_URL`: URL Render cấp cho service (vd `https://lingo-server.onrender.com`)
   - `FRONTEND_URL`: URL Vercel của client (vd `https://lingo-client.vercel.app` — có thể điền nhiều URL cách nhau bằng dấu phẩy `,`)
   - `GEMINI_API_KEY`: API key Gemini (để dùng trợ lý AI và dữ liệu từ vựng)
   - `GOOGLE_CLIENT_ID`: Google OAuth Client ID (nếu bật đăng nhập Google; có thể để trống)
5. Sau khi service chạy lần đầu, mở tab **Shell** trên Render (hoặc chạy từ máy local trỏ `DATABASE_URL` vào External Database URL của Render) để nạp từ vựng một lần duy nhất:
   ```bash
   npm run db:seed
   ```

> **Lưu ý về Cookie khác tên miền (Vercel + Render/Railway):**
> Vì `*.vercel.app` và `*.onrender.com` khác root domain, bắt buộc cấu hình trên server:
> - `COOKIE_DOMAIN=` *(để trống)*
> - `COOKIE_SECURE=true`
> - `COOKIE_SAME_SITE=none`
> - `REDIS_URL=` *(có thể để trống khi chạy 1 instance; server tự dùng WebSocket adapter bộ nhớ trong)*

### Bước 2: Deploy `lingo-client` lên Vercel

1. Đẩy code `Lingo-client` lên GitHub (`https://github.com/Dungnony/Lingo-client`).
2. Vào **Vercel Dashboard** → **Add New...** → **Project** → Import repo `Lingo-client`.
3. Trong mục **Environment Variables**, thêm:
   - `NEXT_PUBLIC_API_URL`: `https://<ten-service-cua-ban>.onrender.com/api` (nhớ có `/api` ở cuối)
   - `NEXT_PUBLIC_SITE_URL`: `https://<ten-project-cua-ban>.vercel.app`
   - `NEXT_PUBLIC_APP_NAME`: `Lingo`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: trùng với `GOOGLE_CLIENT_ID` bên server (nếu dùng đăng nhập Google)
4. Bấm **Deploy**. Sau khi Vercel cấp domain chính thức, kiểm tra lại biến `FRONTEND_URL` bên Render đã khớp đúng domain Vercel chưa (không có dấu `/` ở cuối).

---

## Cách 2: Triển khai `lingo-server` lên VPS Linux

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
- `TRUST_PROXY_HOPS=1` — API đứng sau reverse proxy; thiếu biến này rate limit gộp mọi user vào IP của proxy
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
