import type { GoogleGenAI, Schema } from '@google/genai';
import { classifyGeminiError } from './gemini-errors';

/** Tried in order. The `-latest` aliases keep working when Google retires a
 * versioned model for new API keys (as happened to gemini-2.5-flash). */
export const SCRIPT_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];

/** A 100-word batch normally answers well within this. A model that hangs
 * past it tends to keep hanging, and waiting on it every batch would stretch
 * a full run to hours, so it is skipped for the rest of the run. */
const REQUEST_TIMEOUT_MS = 120_000;

/** No model is usable any more today: stop the run, keep what was done. */
export class QuotaExhaustedError extends Error {}

/** `AbortSignal.timeout()` rejects with a DOMException, which is not always an
 * `instanceof Error` across realms, so match on the name only. */
function isTimeout(err: unknown): boolean {
  const name = (err as { name?: unknown } | null)?.name;
  return name === 'TimeoutError' || name === 'AbortError';
}

/** Asks for a JSON array matching `schema`. Tries each model in turn; a model
 * out of quota, no longer served or timing out is skipped for the rest of the
 * run, an overloaded one only for this request. */
export async function generateJsonArray(
  genAI: GoogleGenAI,
  prompt: string,
  schema: Schema,
  skipped: Set<string>,
): Promise<unknown[]> {
  let overloaded = false;
  for (const model of SCRIPT_MODELS) {
    if (skipped.has(model)) continue;
    try {
      const res = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      });
      const parsed: unknown = JSON.parse(res.text ?? '[]');
      if (!Array.isArray(parsed)) throw new Error('Gemini không trả về mảng JSON');
      return parsed;
    } catch (err) {
      if (isTimeout(err)) {
        console.log(
          `  ⚠ ${model} không trả lời sau ${REQUEST_TIMEOUT_MS / 1000}s — bỏ qua model này cho lần chạy này`,
        );
        skipped.add(model);
        continue;
      }
      const kind = classifyGeminiError(err);
      if (kind === 'other') throw err;
      if (kind === 'overloaded') {
        console.log(`  ⚠ ${model} đang quá tải — thử model khác cho lô này`);
        overloaded = true;
        continue;
      }
      console.log(
        `  ⚠ ${model} ${kind === 'quota' ? 'hết quota' : 'không còn khả dụng với key này'} — bỏ qua model này`,
      );
      skipped.add(model);
    }
  }
  // Overload is temporary: fail only this batch so the run carries on.
  if (overloaded) throw new Error('Mọi model đang quá tải, lô này sẽ thử lại lần sau');
  throw new QuotaExhaustedError(
    'Không còn model Gemini nào dùng được (hết quota hôm nay hoặc không khả dụng)',
  );
}
