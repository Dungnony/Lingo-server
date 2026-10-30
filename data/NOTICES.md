# Nguồn dữ liệu & ghi công (attribution)

App Lingo phải hiển thị nội dung dưới đây ở trang **"Nguồn dữ liệu" (`/nguon-du-lieu`)**
và một liên kết ở footer.

## Danh sách từ vựng và cấp độ

- **CEFR-J Wordlist Version 1.5** — biên soạn bởi Yukio Tono, Tokyo University of Foreign
  Studies (bản quyền: Tono Laboratory, TUFS). Được phép dùng cho nghiên cứu và mục đích
  thương mại miễn phí, **với điều kiện trích dẫn đúng nguồn**. Cung cấp: từ, từ loại, cấp
  CEFR A1–B2. Lấy qua [openlanguageprofiles/olp-en-cefrj](https://github.com/openlanguageprofiles/olp-en-cefrj).
- **Octanove Vocabulary Profile C1/C2 1.0** — Octanove Labs. Giấy phép
  **CC BY-SA 4.0**. Cung cấp: từ, từ loại, cấp CEFR C1–C2.

Cấp CEFR được quy đổi sang 6 cấp của Lingo: A1 → 1 (Beginner) … C2 → 6 (Advanced).

## Phiên âm, nghĩa, câu ví dụ, chủ đề

Phiên âm IPA, nghĩa tiếng Việt, định nghĩa tiếng Anh, câu ví dụ (kèm bản dịch) và chủ đề
bài học do **Google Gemini sinh tự động** (`scripts/import/enrich-words.ts`), lưu ở
`data/processed/enrich-cache.json`. Chưa được người rà soát — có thể còn sai sót.

## Bộ dữ liệu phái sinh của Lingo

`data/processed/words.seed.json` do Lingo tổng hợp từ các nguồn trên, **phát hành lại theo
CC BY-SA 4.0** (điều khoản share-alike của Octanove). Mã nguồn app không bị ràng buộc bởi
giấy phép này.

## Nội dung mẫu trang /nguon-du-lieu (tiếng Việt)

> Danh sách từ vựng và cấp độ của Lingo dựa trên **CEFR-J Wordlist 1.5** (Yukio Tono,
> Tokyo University of Foreign Studies) và **Octanove Vocabulary Profile C1/C2** (Octanove
> Labs, CC BY-SA 4.0). Phiên âm, nghĩa tiếng Việt và câu ví dụ được sinh tự động bằng AI
> nên có thể còn sai sót. Bộ dữ liệu tổng hợp được chia sẻ theo giấy phép CC BY-SA 4.0.
