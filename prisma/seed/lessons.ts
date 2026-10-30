import { PrismaClient } from '../../src/generated/prisma/client';
import type { WordSeedRecord } from './words';

export type LessonMap = Map<string, string>; // "level:lessonIndex" -> lessonId

export const lessonKey = (level: number, orderIndex: number) =>
  `${level}:${orderIndex}`;

/**
 * Lessons in the DB that the new seed no longer produces. Lesson grouping
 * changes whenever more words get a topic, so a level can end up with fewer
 * lessons than before; leftovers would stay empty and could never be
 * completed on the learning path.
 */
export function staleLessonIds(
  existing: readonly { id: string; level: number; orderIndex: number }[],
  keep: ReadonlySet<string>,
): string[] {
  return existing
    .filter((l) => !keep.has(lessonKey(l.level, l.orderIndex)))
    .map((l) => l.id);
}

/**
 * Tạo bảng Lesson từ words.seed.json (đã có lessonIndex/lessonOrder do ETL gán).
 * Trả về map để seedWords gắn lessonId cho từng từ.
 */
export async function seedLessons(
  prisma: PrismaClient,
  records: WordSeedRecord[],
): Promise<LessonMap> {
  const counts = new Map<
    string,
    { level: number; orderIndex: number; n: number; title?: string }
  >();
  for (const w of records) {
    if (!w.lessonIndex) continue;
    const key = lessonKey(w.level, w.lessonIndex);
    const c = counts.get(key) ?? {
      level: w.level,
      orderIndex: w.lessonIndex,
      n: 0,
      title: w.lessonTitle,
    };
    c.n += 1;
    counts.set(key, c);
  }

  const map: LessonMap = new Map();
  for (const [key, c] of [...counts.entries()].sort()) {
    const title = c.title ?? `Bài ${c.orderIndex}`;
    const lesson = await prisma.lesson.upsert({
      where: {
        level_orderIndex: { level: c.level, orderIndex: c.orderIndex },
      },
      create: {
        level: c.level,
        orderIndex: c.orderIndex,
        title,
        wordCount: c.n,
      },
      update: { title, wordCount: c.n },
    });
    map.set(key, lesson.id);
  }

  // Words of a removed lesson get lessonId = null (onDelete: SetNull) and
  // its UserLessonProgress rows are deleted with it (onDelete: Cascade).
  const stale = staleLessonIds(
    await prisma.lesson.findMany({
      select: { id: true, level: true, orderIndex: true },
    }),
    new Set(counts.keys()),
  );
  if (stale.length) {
    await prisma.lesson.deleteMany({ where: { id: { in: stale } } });
  }
  console.log(
    `  ✓ ${map.size} bài học${stale.length ? ` (xoá ${stale.length} bài không còn dùng)` : ''}`,
  );
  return map;
}
