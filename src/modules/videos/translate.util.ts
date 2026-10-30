/**
 * Dịch câu tiếng Anh sang tiếng Việt bằng dịch vụ MIỄN PHÍ, KHÔNG cần API key.
 *
 * Chính: endpoint free của Google Translate (nhanh, chất lượng khá — nhưng
 * hay bị chặn theo IP datacenter). Dự phòng: MyMemory (chậm hơn, có hạn mức
 * ngày; `MYMEMORY_EMAIL` nâng hạn mức).
 *
 * Gộp nhiều câu ngắn vào 1 request (ngăn bằng xuống dòng); nếu số dòng trả về
 * không khớp thì hạ xuống dịch từng câu cho lô đó.
 *
 * Kết quả nên được LƯU lại (DB hoặc file cache) — không gọi lại mỗi lần xem.
 */

const BATCH = 15;
const HAS_LETTER = /\p{L}/u;

/** Strips stray markup and spacing that machine translators leave behind. */
export function cleanTranslation(s: string): string {
  return s
    .replace(/<\/?[a-z]+[^>]*>/gi, '')
    .replace(/\s+([,.!?;:…])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * MyMemory nâng hạn mức ngày (≈1k → 50k từ) nếu có tham số `de=<email>`.
 * Đặt `MYMEMORY_EMAIL` trong .env cho môi trường thật; mặc định là địa chỉ
 * giả nội bộ (MyMemory không kiểm tra tính hợp lệ, chỉ dùng để tách hạn mức).
 */
const MM_EMAIL = process.env.MYMEMORY_EMAIL || 'video-import@lingo.local';
let googleDead = false; // endpoint free của Google hay bị chặn theo IP máy chủ

/**
 * Bộ dịch CHÍNH: endpoint free của Google (không key). Nhanh + chất lượng hơn
 * MyMemory. Thường chạy trên server thật, nhưng bị chặn ở nhiều IP datacenter —
 * hỏng 1 lần thì tắt hẳn, chuyển sang MyMemory.
 */
async function callGoogle(text: string): Promise<string | null> {
  if (googleDead) return null;
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx' +
    '&sl=en&tl=vi&dt=t&q=' +
    encodeURIComponent(text);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      googleDead = true;
      return null;
    }
    const data = (await res.json()) as [Array<[string]>, ...unknown[]];
    return (data[0] ?? []).map((seg) => seg[0]).join('');
  } catch {
    googleDead = true;
    return null;
  }
}

/** Bộ dịch DỰ PHÒNG: MyMemory. Ném lỗi khi hết hạn mức ngày. */
async function callMyMemory(text: string): Promise<string | null> {
  const url =
    'https://api.mymemory.translated.net/get?langpair=en|vi' +
    `&de=${encodeURIComponent(MM_EMAIL)}&q=` +
    encodeURIComponent(text);
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (res.status === 429) throw new Error('MyMemory: hết hạn mức ngày (429)');
  if (!res.ok) return null;
  const data = (await res.json()) as {
    responseStatus: number | string;
    responseData?: { translatedText?: string };
    quotaFinished?: boolean;
  };
  const t = data.responseData?.translatedText ?? '';
  if (data.quotaFinished || /USED ALL AVAILABLE FREE TRANSLATIONS/i.test(t)) {
    throw new Error('MyMemory: hết hạn mức ngày');
  }
  if (!t || Number(data.responseStatus) !== 200) return null;
  if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(t)) return null;
  return t;
}

/** Dịch 1 đoạn text: thử Google trước, rồi MyMemory. */
async function callTranslate(text: string): Promise<string | null> {
  return (await callGoogle(text)) ?? (await callMyMemory(text));
}

/** Dịch 1 câu (đã fallback từ lô hỏng). */
async function translateOne(en: string): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await callTranslate(en);
    if (raw) return cleanTranslation(raw);
    await sleep(500);
  }
  return null;
}

/**
 * Dịch danh sách câu tiếng Anh sang tiếng Việt (máy dịch, gộp lô).
 * - Câu không có chữ cái nào (số, ký hiệu) trả về `null`.
 * - Gộp câu trùng để dịch 1 lần.
 * - `cache` (nếu truyền) được đọc trước + ghi bổ sung.
 * - Khi hết hạn mức: dừng, trả `null` cho phần còn lại.
 */
export async function translateLinesToVi(
  enLines: string[],
  cache?: Map<string, string>,
): Promise<(string | null)[]> {
  const result = new Map<string, string | null>(cache ?? []);
  const todo = [...new Set(enLines.filter((s) => HAS_LETTER.test(s)))].filter(
    (en) => !result.has(en),
  );

  try {
    for (let i = 0; i < todo.length; i += BATCH) {
      const chunk = todo.slice(i, i + BATCH);
      let outs: (string | null)[] = [];

      const raw = await callTranslate(chunk.join('\n'));
      const parts = raw ? raw.split(/\r?\n/) : [];
      if (parts.length === chunk.length) {
        outs = parts.map((p) => cleanTranslation(p) || null);
      } else {
        // lô lệch dòng → dịch từng câu
        for (const en of chunk) {
          outs.push(await translateOne(en));
          await sleep(150);
        }
      }

      chunk.forEach((en, k) => {
        const vi = outs[k] ?? null;
        result.set(en, vi);
        if (vi != null && cache) cache.set(en, vi);
      });
      await sleep(200);
    }
  } catch (err) {
    console.log(`  ⚠ ${(err as Error).message} — dừng dịch máy`);
  }

  return enLines.map((en) => result.get(en) ?? null);
}
