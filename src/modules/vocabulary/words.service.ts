import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { paginate, type Paginated } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { WordQueryDto } from './dto/word-query.dto';

@Injectable()
export class WordsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: WordQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.WordWhereInput = {};
    if (query.level) where.level = query.level;
    const withExamples = query.withExamples === 'true';
    if (withExamples) where.examples = { some: {} };
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { word: { contains: q, mode: 'insensitive' } },
        { meaningVi: { contains: q, mode: 'insensitive' } },
        { meaningEn: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.word.findMany({
        where,
        orderBy: [{ frequencyRank: 'asc' }, { word: 'asc' }],
        skip: query.skip,
        take: query.take,
        include: withExamples
          ? { examples: { orderBy: { orderIndex: 'asc' } } }
          : undefined,
      }),
      this.prisma.word.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async get(id: string) {
    const word = await this.prisma.word.findUnique({
      where: { id },
      include: { examples: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!word) throw new NotFoundException('Không tìm thấy từ');
    return word;
  }

  /** "Từ vựng hôm nay": chọn CỐ ĐỊNH theo ngày (giống nhau cho mọi user, đổi
   * lúc 0h UTC) — xoay vòng theo `frequencyRank` (chỉ từ phổ biến, có nghĩa)
   * để tránh rơi vào từ hiếm ít ai biết. Không lưu DB, tính trực tiếp mỗi lần
   * gọi nên luôn khớp ngày hiện tại kể cả khi có từ mới được thêm vào. */
  async ofTheDay() {
    const where: Prisma.WordWhereInput = {
      meaningVi: { not: null },
      frequencyRank: { not: null },
    };
    const total = await this.prisma.word.count({ where });
    if (total === 0) throw new NotFoundException('Chưa có dữ liệu từ vựng');

    const dayIndex = Math.floor(Date.now() / 86_400_000);
    const [word] = await this.prisma.word.findMany({
      where,
      orderBy: { frequencyRank: 'asc' },
      skip: dayIndex % total,
      take: 1,
      include: { examples: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!word) throw new NotFoundException('Chưa có dữ liệu từ vựng');
    return word;
  }

  /** Tra nhanh 1 từ tiếng Anh được bấm trực tiếp từ phụ đề video hoặc câu ví dụ
   * ngữ pháp — tự thử cả dạng gốc (bỏ -s/-es/-ed/-ing/-ly) nếu từ chia trong
   * câu không khớp nguyên văn. */
  async lookup(raw?: string) {
    const cleaned = (raw ?? '').toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
    if (!cleaned || cleaned.length > 60) return { word: null };

    const candidates = lookupCandidates(cleaned);
    const rows = await this.prisma.word.findMany({
      where: {
        OR: candidates.map((c) => ({
          word: { equals: c, mode: 'insensitive' as const },
        })),
      },
      include: { examples: { orderBy: { orderIndex: 'asc' } } },
      orderBy: [{ level: 'asc' }, { frequencyRank: 'asc' }],
    });
    if (rows.length === 0) return { word: null };

    for (const candidate of candidates) {
      const hit = rows.find((r) => r.word.toLowerCase() === candidate);
      if (hit) return { word: hit };
    }
    return { word: rows[0] };
  }
}

export function lookupCandidates(word: string): string[] {
  const out = new Set<string>([word]);
  if (word.endsWith('ies') && word.length > 4) {
    out.add(`${word.slice(0, -3)}y`);
  }
  if (word.endsWith('es') && word.length > 3) {
    out.add(word.slice(0, -2));
    out.add(word.slice(0, -1));
  }
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 2) {
    out.add(word.slice(0, -1));
  }
  if (word.endsWith('ied') && word.length > 4) {
    out.add(`${word.slice(0, -3)}y`);
  }
  if (word.endsWith('ed') && word.length > 3) {
    const stem = word.slice(0, -2);
    out.add(stem);
    out.add(word.slice(0, -1));
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      out.add(stem.slice(0, -1));
    }
  }
  if (word.endsWith('ing') && word.length > 4) {
    const stem = word.slice(0, -3);
    out.add(stem);
    out.add(`${stem}e`);
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      out.add(stem.slice(0, -1));
    }
  }
  if (word.endsWith('ly') && word.length > 4) {
    out.add(word.slice(0, -2));
    if (word.endsWith('ily') && word.length > 5) {
      out.add(`${word.slice(0, -3)}y`);
    }
  }
  return [...out];
}
