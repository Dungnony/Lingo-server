import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate, type Paginated } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { NotebookQueryDto } from './dto/notebook.dto';

/** A word forgotten (rated AGAIN after being learned) this many times counts
 * as "hay sai" — once can be bad luck, twice is a pattern. */
export const DIFFICULT_MIN_LAPSES = 2;

@Injectable()
export class NotebookService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, q: NotebookQueryDto): Promise<Paginated<unknown>> {
    return q.tab === 'saved'
      ? this.listSaved(userId, q)
      : this.listDifficult(userId, q);
  }

  private async listSaved(userId: string, q: NotebookQueryDto) {
    const where = { userId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.savedWord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: q.skip,
        take: q.take,
        include: { word: true },
      }),
      this.prisma.savedWord.count({ where }),
    ]);
    const items = rows.map((r) => ({ ...r.word, savedAt: r.createdAt }));
    return paginate(items, total, q);
  }

  private async listDifficult(userId: string, q: NotebookQueryDto) {
    const where = { userId, lapses: { gte: DIFFICULT_MIN_LAPSES } };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.userWordProgress.findMany({
        where,
        orderBy: [{ lapses: 'desc' }, { lastReviewedAt: 'desc' }],
        skip: q.skip,
        take: q.take,
        include: { word: true },
      }),
      this.prisma.userWordProgress.count({ where }),
    ]);
    const items = rows.map((r) => ({ ...r.word, lapses: r.lapses }));
    return paginate(items, total, q);
  }

  /** Ids of saved words, so word cards anywhere can show their state. */
  async savedIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.savedWord.findMany({
      where: { userId },
      select: { wordId: true },
    });
    return rows.map((r) => r.wordId);
  }

  /** Idempotent: saving an already saved word is a no-op. */
  async save(userId: string, wordId: string) {
    const word = await this.prisma.word.findUnique({
      where: { id: wordId },
      select: { id: true },
    });
    if (!word) throw new NotFoundException('Không tìm thấy từ');
    await this.prisma.savedWord.upsert({
      where: { userId_wordId: { userId, wordId } },
      create: { userId, wordId },
      update: {},
    });
    return { saved: true };
  }

  /** Idempotent: removing a word that is not saved is a no-op. */
  async remove(userId: string, wordId: string) {
    await this.prisma.savedWord.deleteMany({ where: { userId, wordId } });
    return { saved: false };
  }
}
