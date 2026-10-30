export interface ParsedLine {
  index: number;
  startMs: number | null;
  en: string;
  vi: string | null;
}

/** Only pipes separate the translation: dashes are ordinary English punctuation. */
const TRANSLATION_SEPARATOR = /(?:^|\s)[|｜](?:\s|$)/;

/**
 * Bản chép nhập vào, mỗi câu 1 dòng, định dạng:
 *   [mm:ss] English sentence | Bản dịch tiếng Việt
 * - Mốc thời gian `[mm:ss]` hoặc `[h:mm:ss]` là tuỳ chọn.
 * - Ngăn cách bản dịch bằng " | " (tuỳ chọn).
 */
export function parseTranscript(raw: string): ParsedLine[] {
  const out: ParsedLine[] = [];
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let rest = trimmed;
    let startMs: number | null = null;
    const tm = /^\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s*/.exec(rest);
    if (tm) {
      const a = Number(tm[1]);
      const b = Number(tm[2]);
      const c = tm[3] ? Number(tm[3]) : null;
      startMs = (c !== null ? (a * 60 + b) * 60 + c : a * 60 + b) * 1000;
      rest = rest.slice(tm[0].length);
    }

    const sep = TRANSLATION_SEPARATOR.exec(rest);
    let en = rest;
    let vi: string | null = null;
    if (sep) {
      en = rest.slice(0, sep.index).trim();
      vi = rest.slice(sep.index + sep[0].length).trim() || null;
    }
    if (!en) continue;

    out.push({ index: out.length + 1, startMs, en, vi });
  }
  return out;
}
