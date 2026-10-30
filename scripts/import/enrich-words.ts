/**
 * Sinh phiên âm IPA, nghĩa tiếng Việt, định nghĩa tiếng Anh, 1 câu ví dụ và
 * chủ đề cho từng từ trong wordlist bằng Gemini, lưu vào
 * data/processed/enrich-cache.json (commit file này — không cần gọi lại).
 *
 * Chạy: npm run data:enrich-words [-- --limit 200 --batch 100 --delay 7000]
 * (key đã bật thanh toán có thể dùng --delay 0 để chạy nhanh nhất).
 * Cần GEMINI_API_KEY (đọc từ môi trường hoặc .env). Chạy lại được bất cứ lúc
 * nào: chỉ gọi API cho các từ còn thiếu trong cache, nên dừng giữa chừng
 * (hết quota free tier) thì lần sau chạy tiếp từ chỗ đó.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type { MergedEntry } from './lib/cefr-profile';
import { parseEnrichOptions } from './lib/enrich-options';
import { generateJsonArray, QuotaExhaustedError } from './lib/gemini-json';
import {
  validateEnrichment,
  type EnrichmentCache,
} from './lib/enrichment';
import {
  ENRICH_CACHE_FILE,
  ENV_FILE,
  PROCESSED_DIR,
  loadEnrichmentCache,
  loadMergedEntries,
} from './lib/sources';
import { TOPIC_KEYS } from './lib/topics';

const LEVEL_TO_CEFR = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const RESPONSE_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      ipa: { type: Type.STRING },
      meaningVi: { type: Type.STRING },
      meaningEn: { type: Type.STRING },
      exampleEn: { type: Type.STRING },
      exampleVi: { type: Type.STRING },
      topic: { type: Type.STRING, enum: TOPIC_KEYS },
    },
    required: [
      'word',
      'ipa',
      'meaningVi',
      'meaningEn',
      'exampleEn',
      'exampleVi',
      'topic',
    ],
  },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildPrompt(batch: MergedEntry[]): string {
  const list = batch
    .map(
      (e) =>
        `- ${JSON.stringify(e.word)} (${e.pos.join('/').toLowerCase()}, CEFR ${LEVEL_TO_CEFR[e.level]})`,
    )
    .join('\n');
  return `You are building an English vocabulary course for Vietnamese learners.
For EACH word below return one JSON object with:
- word: copied exactly as given
- ipa: General American IPA between slashes, e.g. /ˈæp.əl/
- meaningVi: the most common Vietnamese meaning(s) for the given part of speech, short (max ~8 words), separated by "; " if several
- meaningEn: a simple learner-dictionary definition in English (max ~15 words)
- exampleEn: one natural example sentence using the word, suited to the CEFR level
- exampleVi: a natural Vietnamese translation of exampleEn
- topic: the single best topic key from: ${TOPIC_KEYS.join(', ')}
Return the objects in the same order as the input. Words:
${list}`;
}

function saveCache(cache: EnrichmentCache): void {
  mkdirSync(PROCESSED_DIR, { recursive: true });
  // Sorted keys keep diffs of the committed file small and stable.
  const sorted = Object.fromEntries(
    Object.keys(cache)
      .sort()
      .map((k) => [k, cache[k]]),
  );
  writeFileSync(ENRICH_CACHE_FILE, `${JSON.stringify(sorted, null, 1)}\n`);
}

async function main(): Promise<void> {
  if (!process.env.GEMINI_API_KEY && existsSync(ENV_FILE)) {
    process.loadEnvFile(ENV_FILE);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Chưa có GEMINI_API_KEY — lấy key tại https://aistudio.google.com/apikey rồi đặt vào .env',
    );
  }
  const { limit, batchSize, delayMs } = parseEnrichOptions(
    process.argv.slice(2),
  );

  const entries = loadMergedEntries();
  const cache = loadEnrichmentCache();
  const todo = entries.filter((e) => !cache[e.word]).slice(0, limit);
  console.log(
    `${entries.length} từ, đã có ${entries.length - entries.filter((e) => !cache[e.word]).length} trong cache, lần này xử lý ${todo.length} (${batchSize} từ/lần gọi, nghỉ ${delayMs}ms)`,
  );

  const genAI = new GoogleGenAI({ apiKey });
  const skipped = new Set<string>();
  let added = 0;
  let rejected = 0;
  try {
    for (let i = 0; i < todo.length; i += batchSize) {
      const batch = todo.slice(i, i + batchSize);
      try {
        const items = await generateJsonArray(
          genAI,
          buildPrompt(batch),
          RESPONSE_SCHEMA,
          skipped,
        );
        const byWord = new Map(
          items.map((it) => [(it as { word?: unknown })?.word, it]),
        );
        for (const e of batch) {
          const ok = validateEnrichment(byWord.get(e.word), e.word);
          if (ok) {
            cache[e.word] = ok;
            added += 1;
          } else {
            rejected += 1;
          }
        }
      } catch (err) {
        if (err instanceof QuotaExhaustedError) throw err;
        // A malformed response only loses this batch; it is retried next run.
        console.log(`  ⚠ lô ${i / batchSize + 1} lỗi: ${(err as Error).message}`);
        rejected += batch.length;
      }
      saveCache(cache);
      console.log(`  ✓ ${Math.min(i + batchSize, todo.length)}/${todo.length}`);
      if (i + batchSize < todo.length) await sleep(delayMs);
    }
  } catch (err) {
    if (!(err instanceof QuotaExhaustedError)) throw err;
    console.log(`⚠ ${err.message} — đã lưu phần làm được, chạy lại sau để làm tiếp.`);
  }

  saveCache(cache);
  console.log(
    `\nThêm ${added} từ, ${rejected} từ chưa hợp lệ (sẽ thử lại lần sau). Chạy tiếp: npm run data:build-words`,
  );
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
