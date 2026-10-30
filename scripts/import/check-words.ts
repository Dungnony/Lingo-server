/**
 * AI cross-check of the vocabulary IN THE DATABASE (so admin edits count):
 * Gemini proofreads each word's Vietnamese meaning, IPA, definition and
 * example, and every word it doubts gets `Word.aiFlag` with the reason. Admins
 * then review only the flagged words in /admin ("AI nghi ngờ"). The AI never
 * approves a word itself — `reviewedAt` stays for a human.
 *
 * Run: npm run data:check-words [-- --level 1 --limit 500 --batch 100 --delay 7000 --recheck]
 * Needs GEMINI_API_KEY and DATABASE_URL (.env). Resumable: only words not yet
 * checked (`aiCheckedAt` null) and not approved are sent, so stopping midway
 * (free-tier quota) just continues next run. `--recheck` re-sends checked ones.
 */
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  type Prisma,
} from '../../src/generated/prisma/client';
import { generateJsonArray, QuotaExhaustedError } from './lib/gemini-json';
import {
  buildCheckPrompt,
  CHECK_RESPONSE_SCHEMA,
  parseCheckOptions,
  parseCheckResults,
  type CheckEntry,
} from './lib/word-check';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const WORD_SELECT = {
  id: true,
  word: true,
  pos: true,
  level: true,
  pronunciation: true,
  meaningVi: true,
  meaningEn: true,
  examples: {
    orderBy: { orderIndex: 'asc' },
    take: 1,
    select: { en: true, vi: true },
  },
} satisfies Prisma.WordSelect;

type CheckedWord = Prisma.WordGetPayload<{ select: typeof WORD_SELECT }>;

function toEntry(w: CheckedWord): CheckEntry {
  return {
    word: w.word,
    pos: w.pos,
    level: w.level,
    ipa: w.pronunciation,
    meaningVi: w.meaningVi,
    meaningEn: w.meaningEn,
    exampleEn: w.examples[0]?.en ?? null,
    exampleVi: w.examples[0]?.vi ?? null,
  };
}

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Chưa có GEMINI_API_KEY — lấy key tại https://aistudio.google.com/apikey rồi đặt vào .env',
    );
  }
  const options = parseCheckOptions(process.argv.slice(2));
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const where: Prisma.WordWhereInput = {
      reviewedAt: null,
      ...(options.recheck ? {} : { aiCheckedAt: null }),
      ...(options.level ? { level: options.level } : {}),
    };
    const total = await prisma.word.count({ where });
    const todo = await prisma.word.findMany({
      where,
      orderBy: [{ level: 'asc' }, { frequencyRank: 'asc' }],
      take: Number.isFinite(options.limit) ? options.limit : undefined,
      select: WORD_SELECT,
    });
    console.log(
      `${total} từ cần kiểm tra, lần này ${todo.length} (${options.batchSize} từ/lần gọi, nghỉ ${options.delayMs}ms)`,
    );

    const genAI = new GoogleGenAI({ apiKey });
    const skipped = new Set<string>();
    let checked = 0;
    let flagged = 0;
    let unanswered = 0;
    try {
      for (let i = 0; i < todo.length; i += options.batchSize) {
        const batch = todo.slice(i, i + options.batchSize);
        try {
          const items = await generateJsonArray(
            genAI,
            buildCheckPrompt(batch.map(toEntry)),
            CHECK_RESPONSE_SCHEMA,
            skipped,
          );
          const results = parseCheckResults(items, batch.length);
          const now = new Date();
          await prisma.$transaction(
            [...results].map(([index, aiFlag]) =>
              prisma.word.update({
                where: { id: batch[index].id },
                data: { aiCheckedAt: now, aiFlag },
              }),
            ),
          );
          checked += results.size;
          flagged += [...results.values()].filter(Boolean).length;
          unanswered += batch.length - results.size;
        } catch (err) {
          if (err instanceof QuotaExhaustedError) throw err;
          // A malformed response only loses this batch; it is retried next run.
          console.log(`  ⚠ lô ${i / options.batchSize + 1} lỗi: ${(err as Error).message}`);
          unanswered += batch.length;
        }
        console.log(
          `  ✓ ${Math.min(i + options.batchSize, todo.length)}/${todo.length} — đáng ngờ ${flagged}`,
        );
        if (i + options.batchSize < todo.length) await sleep(options.delayMs);
      }
    } catch (err) {
      if (!(err instanceof QuotaExhaustedError)) throw err;
      console.log(`⚠ ${err.message} — đã lưu phần làm được, chạy lại sau để làm tiếp.`);
    }
    console.log(
      `\nĐã kiểm tra ${checked} từ, ${flagged} từ AI nghi ngờ (xem ở /admin → bộ lọc "AI nghi ngờ"), ${unanswered} từ chưa có kết quả (sẽ thử lại lần sau).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
