import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, WordPos, type Prisma } from '../../src/generated/prisma/client';

export interface WordSeedRecord {
  word: string;
  /** IPA, vd "/ˈæp.əl/" */
  pronunciation?: string | null;
  level: number;
  pos?: string[];
  frequencyRank?: number | null;
  meaningVi?: string | null;
  meaningEn?: string | null;
  audioUrl?: string | null;
  source?: string;
  lessonIndex?: number;
  lessonOrder?: number;
  /** Tên bài học theo chủ đề; không có thì lessons.ts tự đặt "Bài N". */
  lessonTitle?: string;
  examples?: {
    en: string;
    vi?: string | null;
    orderIndex?: number;
    source?: string | null;
  }[];
}

export const SEED_FILE = join(
  __dirname,
  '..',
  '..',
  'data',
  'processed',
  'words.seed.json',
);
const CHUNK = 1000;

export function loadWordSeed(): WordSeedRecord[] | null {
  try {
    return JSON.parse(readFileSync(SEED_FILE, 'utf8')) as WordSeedRecord[];
  } catch {
    return null;
  }
}

function normPos(values: string[] | undefined): WordPos[] {
  if (!values) return [];
  return values
    .map((v) => v.toUpperCase())
    .filter((v): v is WordPos => v in WordPos);
}

const wordKey = (word: string, level: number) => `${word}|${level}`;

function toRow(
  rec: WordSeedRecord,
  lessonId: string | null,
): Prisma.WordCreateManyInput {
  return {
    word: rec.word,
    pronunciation: rec.pronunciation ?? null,
    level: rec.level,
    pos: normPos(rec.pos),
    frequencyRank: rec.frequencyRank ?? null,
    meaningVi: rec.meaningVi ?? null,
    meaningEn: rec.meaningEn ?? null,
    audioUrl: rec.audioUrl ?? null,
    source: rec.source ?? null,
    lessonId,
    lessonOrder: rec.lessonOrder ?? null,
  };
}

export async function seedWords(
  prisma: PrismaClient,
  raw: WordSeedRecord[],
  lessonMap: Map<string, string>,
): Promise<void> {
  const reset = process.env.SEED_RESET === 'true';
  if (reset) {
    await prisma.word.deleteMany({});
    console.log('  (SEED_RESET) đã xoá toàn bộ Word cũ');
  } else if ((await prisma.word.count()) >= raw.length) {
    console.log(
      `  ✓ Word đã có ${raw.length}+ dòng — bỏ qua (đặt SEED_RESET=true để nạp lại)`,
    );
    return;
  }

  // Nạp hàng loạt (bỏ qua trùng @@unique). Muốn CẬP NHẬT thì dùng SEED_RESET=true.
  const rows = raw.map((r) =>
    toRow(r, lessonMap.get(`${r.level}:${r.lessonIndex ?? 0}`) ?? null),
  );
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const res = await prisma.word.createMany({
      data: rows.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
    inserted += res.count;
  }
  console.log(`  ✓ ${inserted}/${raw.length} từ vựng`);

  const withEx = raw.filter((r) => r.examples?.length);
  if (!withEx.length) return;

  const found = await prisma.word.findMany({
    select: { id: true, word: true, level: true },
  });
  const idOf = new Map(found.map((w) => [wordKey(w.word, w.level), w.id]));
  const exData: Prisma.WordExampleCreateManyInput[] = [];
  for (const r of withEx) {
    const wid = idOf.get(wordKey(r.word, r.level));
    if (!wid) continue;
    r.examples!.forEach((e, i) =>
      exData.push({
        wordId: wid,
        en: e.en,
        vi: e.vi ?? null,
        orderIndex: e.orderIndex ?? i,
        source: e.source ?? 'gemini',
      }),
    );
  }
  await prisma.wordExample.deleteMany({
    where: { wordId: { in: [...new Set(exData.map((e) => e.wordId))] } },
  });
  for (let i = 0; i < exData.length; i += CHUNK) {
    await prisma.wordExample.createMany({ data: exData.slice(i, i + CHUNK) });
  }
  console.log(`  ✓ ${exData.length} câu ví dụ`);
}
