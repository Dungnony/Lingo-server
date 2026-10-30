import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { seedAchievements } from './seed/achievements';
import { seedGrammar } from './seed/grammar';
import { seedLessons } from './seed/lessons';
import { refreshLevelTotals, seedLevels } from './seed/levels';
import { loadWordSeed, seedWords } from './seed/words';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/**
 * Seed dữ liệu tĩnh của Lingo. KHÔNG đụng dữ liệu người dùng.
 * Idempotent: chạy lại nhiều lần vẫn an toàn (dùng upsert / skipDuplicates).
 *
 * Thứ tự: EnglishLevel → Achievement → Lesson → Word (Word tham chiếu
 * EnglishLevel + Lesson) → Grammar → cập nhật tổng số từ/ngữ pháp mỗi cấp.
 * Không seed video: người dùng tự thêm qua trang /watch/add.
 */
async function main(): Promise<void> {
  console.log('Seeding Lingo…');
  await seedLevels(prisma);
  await seedAchievements(prisma);

  const words = loadWordSeed();
  if (!words) {
    console.log(
      '  ⚠ Chưa có data/processed/words.seed.json — bỏ qua từ vựng + bài học.',
    );
    console.log(
      '    Chạy: npm run data:fetch-sources && npm run data:enrich-words && npm run data:build-words',
    );
  } else {
    const lessonMap = await seedLessons(prisma, words);
    await seedWords(prisma, words, lessonMap);
  }
  await seedGrammar(prisma, {
    overwrite: process.env.SEED_GRAMMAR_OVERWRITE === 'true',
  });
  await refreshLevelTotals(prisma);
  console.log('Xong.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
