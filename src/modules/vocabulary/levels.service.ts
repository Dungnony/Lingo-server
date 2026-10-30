import { Injectable, NotFoundException } from '@nestjs/common';
import { levelBand } from '../../common/levels';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class LevelsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const [levels, counts] = await this.prisma.$transaction([
      this.prisma.englishLevel.findMany({ orderBy: { level: 'asc' } }),
      this.prisma.word.groupBy({
        by: ['level'],
        _count: true,
        orderBy: { level: 'asc' },
      }),
    ]);
    const countByLevel = new Map(counts.map((c) => [c.level, c._count]));
    return levels.map((l) => ({
      ...l,
      band: levelBand(l.level),
      wordsInDb: countByLevel.get(l.level) ?? 0,
    }));
  }

  async get(level: number) {
    const row = await this.prisma.englishLevel.findUnique({ where: { level } });
    if (!row) throw new NotFoundException('Cấp độ không hợp lệ');
    const wordsInDb = await this.prisma.word.count({ where: { level } });
    return { ...row, band: levelBand(level), wordsInDb };
  }
}
