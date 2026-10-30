import { PrismaClient } from '../../src/generated/prisma/client';
import { LEVEL_NAMES } from '../../src/common/levels';

const LEVEL_ROWS: { level: number; nameVi: string; description: string }[] = [
  {
    level: 1,
    nameVi: 'Sơ cấp 1',
    description:
      'Hiểu và dùng các cụm từ quen thuộc hằng ngày: chào hỏi, giới thiệu bản thân, hỏi đáp đơn giản (tương đương CEFR A1).',
  },
  {
    level: 2,
    nameVi: 'Sơ cấp 2',
    description:
      'Giao tiếp trong các tình huống quen thuộc: mua sắm, gia đình, công việc thường ngày (tương đương CEFR A2).',
  },
  {
    level: 3,
    nameVi: 'Tiền trung cấp',
    description:
      'Xử lý phần lớn tình huống khi đi du lịch, kể lại trải nghiệm, nêu ý kiến ngắn (tương đương CEFR B1).',
  },
  {
    level: 4,
    nameVi: 'Trung cấp',
    description:
      'Hiểu ý chính của văn bản phức tạp, trao đổi trôi chảy với người bản xứ về nhiều chủ đề (tương đương CEFR B2).',
  },
  {
    level: 5,
    nameVi: 'Trung cao cấp',
    description:
      'Dùng tiếng Anh linh hoạt cho học thuật và công việc, hiểu nghĩa hàm ẩn trong văn bản dài (tương đương CEFR C1).',
  },
  {
    level: 6,
    nameVi: 'Cao cấp',
    description:
      'Hiểu gần như mọi thứ nghe và đọc được, diễn đạt chính xác cả sắc thái tinh tế (tương đương CEFR C2).',
  },
];

/** 6 cấp độ. `totalWords`/`totalGrammar` được tính lại sau khi seed từ + ngữ pháp. */
export async function seedLevels(prisma: PrismaClient): Promise<void> {
  for (const l of LEVEL_ROWS) {
    const data = { ...l, nameEn: LEVEL_NAMES[l.level] };
    await prisma.englishLevel.upsert({
      where: { level: l.level },
      create: data,
      update: data,
    });
  }
  console.log(`  ✓ ${LEVEL_ROWS.length} cấp độ`);
}

export async function refreshLevelTotals(prisma: PrismaClient): Promise<void> {
  const [words, grammar] = await Promise.all([
    prisma.word.groupBy({ by: ['level'], _count: { _all: true } }),
    prisma.grammarPoint.groupBy({ by: ['level'], _count: { _all: true } }),
  ]);
  const wordsBy = new Map(words.map((w) => [w.level, w._count._all]));
  const grammarBy = new Map(grammar.map((g) => [g.level, g._count._all]));
  for (const l of LEVEL_ROWS) {
    await prisma.englishLevel.update({
      where: { level: l.level },
      data: {
        totalWords: wordsBy.get(l.level) ?? 0,
        totalGrammar: grammarBy.get(l.level) ?? 0,
      },
    });
  }
}
