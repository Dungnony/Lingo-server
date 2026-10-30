import { YoutubeTranscript } from 'youtube-transcript';

export interface TimedLine {
  en: string;
  startMs: number;
}

const EN_LANGS = ['en', 'en-US', 'en-GB'];
const FETCH_TIMEOUT_MS = 20_000;
const MIN_LETTERS_PER_LINE = 2;
const MIN_LINES = 3;

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
};

/** youtube-transcript returns entities that are sometimes double-encoded
 * (`&amp;#39;`), so decode `&amp;` first and then the rest. */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&(?:quot|#39|lt|gt|nbsp|amp);/g, (m) => HTML_ENTITIES[m] ?? m);
}

/**
 * Normalises one caption segment: decodes entities, drops sound cues such as
 * "[Music]" / "(applause)" / "♪", and joins wrapped lines. Returns null when
 * nothing worth studying is left.
 */
export function cleanCaptionText(raw: string): string | null {
  const text = decodeEntities(raw)
    .replace(/\[[^\]]*\]|\([^)]*\)/g, ' ')
    .replace(/[♪♫]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const letters = text.match(/\p{L}/gu)?.length ?? 0;
  return letters >= MIN_LETTERS_PER_LINE ? text : null;
}

/** Thư viện youtube-transcript không có timeout riêng — có thể treo vô thời hạn
 *  nếu mạng chặn/nghẽn. Ép timeout ở đây để 1 video lỗi không làm treo cả request. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timeout sau ${ms}ms`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

/**
 * Lấy bản chép tiếng Anh có mốc thời gian thật từ phụ đề YouTube.
 * Trả [] nếu video không có phụ đề tiếng Anh.
 */
export async function fetchTimedTranscript(
  youtubeId: string,
): Promise<TimedLine[]> {
  for (const lang of EN_LANGS) {
    try {
      const segs = await withTimeout(
        YoutubeTranscript.fetchTranscript(youtubeId, { lang }),
        FETCH_TIMEOUT_MS,
      );
      const out: TimedLine[] = [];
      for (const s of segs) {
        const en = cleanCaptionText(s.text);
        if (en) out.push({ en, startMs: Math.round(s.offset) });
      }
      if (out.length >= MIN_LINES) return out;
    } catch {
      /* thử biến thể ngôn ngữ khác */
    }
  }
  return [];
}
