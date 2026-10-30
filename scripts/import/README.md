# Pipeline import từ vựng tiếng Anh

Wordlist mở → (Gemini) → `data/processed/words.seed.json` → `prisma db seed` → Postgres.

> `data/processed/enrich-cache.json` và `words.seed.json` nên được **commit** sau khi chạy
> để deploy không phải gọi lại Gemini. Chỉ chạy lại pipeline khi muốn cập nhật dataset.

## Nguồn (xem `../../data/NOTICES.md`)

| Nguồn | Dùng cho |
|---|---|
| CEFR-J Vocabulary Profile 1.5 (miễn phí, cần trích dẫn) | từ, từ loại, cấp A1–B2 |
| Octanove Vocabulary Profile C1/C2 1.0 (CC BY-SA 4.0) | từ, từ loại, cấp C1–C2 |
| Google Gemini (`GEMINI_API_KEY`) | IPA, nghĩa Việt, định nghĩa Anh, câu ví dụ, chủ đề |

## Chạy

```bash
# 1) Tải 2 file CSV về data/raw/olp-en-cefrj/ (gitignored)
npm run data:fetch-sources

# 2) Sinh dữ liệu bằng Gemini → data/processed/enrich-cache.json.
#    Chạy lại được nhiều lần (chỉ gọi API cho từ còn thiếu) — free tier
#    thường hết quota giữa chừng, hôm sau chạy tiếp. Thử nhỏ: -- --limit 50
#    Tuỳ chọn: --batch N (từ/lần gọi, mặc định 100, tối đa 200 — lô lớn đỡ
#    tốn lượt gọi/ngày của free tier), --delay MS (nghỉ giữa các lần gọi, mặc
#    định 7000; key đã bật thanh toán dùng --delay 0).
npm run data:enrich-words

# 3) Gộp → data/processed/words.seed.json + build-report.md
npm run data:build-words

# 4) Nạp DB (SEED_RESET=true để ghi đè dữ liệu Word cũ)
SEED_RESET=true npm run db:seed
```

## ETL làm gì

1. `lib/cefr-profile.ts`: đọc CSV (`headword,pos,CEFR`), lấy biến thể đầu của headword
   (`a.m./A.M./am` → `a.m.`), bỏ đuôi rút gọn (`'m`, `'re`), quy đổi CEFR → cấp 1–6.
2. Gộp theo headword: 1 từ có nhiều nghĩa/từ loại ở nhiều cấp → giữ cấp **dễ nhất**, gộp
   mọi từ loại (`lib/pos-map.ts`).
3. `frequencyRank` = thứ tự theo cấp rồi theo bảng chữ cái (nguồn không có tần suất).
4. `enrich-words.ts`: gửi lô 100 từ (đổi bằng `--batch`, `lib/enrich-options.ts`), ép JSON
   schema, kiểm tra từng mục (`lib/enrichment.ts`) — mục sai bị bỏ và được thử lại ở lần chạy
   sau. Model hết quota/ngừng cấp thì bỏ qua, model quá tải (503) chỉ đổi model cho lô đó
   (`lib/gemini-errors.ts`).
5. `lib/lessons.ts`: chia mỗi cấp thành bài theo chủ đề (`lib/topics.ts`), tối đa 15
   từ/bài. Từ chưa có dữ liệu Gemini vào chủ đề "Từ vựng chung".

## Giấy phép dataset build ra

`words.seed.json` **phát hành lại theo CC BY-SA 4.0** (share-alike từ Octanove). Bắt buộc
ghi công ở trang `/nguon-du-lieu` của app.
