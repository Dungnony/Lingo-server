import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { paginate } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  grammarCreateData,
  grammarUpdateData,
  reviewDecision,
  videoUpdateData,
  wordUpdateData,
} from './admin-content.util';
import type {
  AdminExampleDto,
  AdminVideoQueryDto,
  AdminWordQueryDto,
  CreateGrammarDto,
  UpdateGrammarDto,
  UpdateVideoDto,
  UpdateWordDto,
} from './dto/admin.dto';

/** Marks example sentences written by hand so they can be told apart from
 * the Gemini-generated seed data. */
export const ADMIN_SOURCE = 'admin';

/** Most recent open reports shown per word in the admin list. */
const REPORTS_PER_WORD = 5;
const OPEN_REPORT = { resolvedAt: null } satisfies Prisma.WordReportWhereInput;
const HAS_OPEN_REPORT = {
  reports: { some: OPEN_REPORT },
} satisfies Prisma.WordWhereInput;
/** A human approval supersedes the AI cross-check's doubts. */
const APPROVED = (now: Date) =>
  ({
    reviewedAt: now,
    aiFlag: null,
  }) satisfies Prisma.WordUpdateManyMutationInput;

const WORD_INCLUDE = {
  examples: { orderBy: { orderIndex: 'asc' }, take: 1 },
  reports: {
    where: OPEN_REPORT,
    orderBy: { createdAt: 'desc' },
    take: REPORTS_PER_WORD,
    select: {
      id: true,
      reason: true,
      note: true,
      createdAt: true,
      user: { select: { displayName: true } },
    },
  },
  _count: { select: { reports: { where: OPEN_REPORT } } },
} satisfies Prisma.WordInclude;

const VIDEO_SELECT = {
  id: true,
  youtubeId: true,
  title: true,
  titleEn: true,
  level: true,
  kind: true,
  createdAt: true,
  createdBy: { select: { id: true, displayName: true } },
} satisfies Prisma.VideoSelect;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listWords(query: AdminWordQueryDto) {
    const where: Prisma.WordWhereInput = {};
    if (query.level) where.level = query.level;
    if (query.reviewed === 'true') where.reviewedAt = { not: null };
    if (query.reviewed === 'false') where.reviewedAt = null;
    if (query.reported === 'true') Object.assign(where, HAS_OPEN_REPORT);
    if (query.aiFlagged === 'true') where.aiFlag = { not: null };
    const q = query.q?.trim();
    if (q) {
      where.OR = [
        { word: { contains: q, mode: 'insensitive' } },
        { meaningVi: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.word.findMany({
        where,
        orderBy: [{ frequencyRank: 'asc' }, { word: 'asc' }],
        skip: query.skip,
        take: query.take,
        include: WORD_INCLUDE,
      }),
      this.prisma.word.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  /** Review progress for the admin header. */
  async wordStats() {
    const [total, reviewed, reported, aiFlagged] = await Promise.all([
      this.prisma.word.count(),
      this.prisma.word.count({ where: { reviewedAt: { not: null } } }),
      this.prisma.word.count({ where: HAS_OPEN_REPORT }),
      this.prisma.word.count({ where: { aiFlag: { not: null } } }),
    ]);
    return { total, reviewed, reported, aiFlagged };
  }

  /** Approves many words as they are (e.g. a page the admin skimmed). */
  async reviewWords(ids: string[]) {
    const now = new Date();
    const [{ count }] = await this.prisma.$transaction([
      this.prisma.word.updateMany({
        where: { id: { in: ids } },
        data: APPROVED(now),
      }),
      this.prisma.wordReport.updateMany({
        where: { wordId: { in: ids }, ...OPEN_REPORT },
        data: { resolvedAt: now },
      }),
    ]);
    return { reviewed: count };
  }

  async updateWord(id: string, dto: UpdateWordDto) {
    await this.requireWord(id);
    const decision = reviewDecision(dto);
    const now = new Date();
    const review =
      decision === 'review'
        ? APPROVED(now)
        : decision === 'unreview'
          ? { reviewedAt: null }
          : {};
    await this.prisma.$transaction(async (tx) => {
      await tx.word.update({
        where: { id },
        data: { ...wordUpdateData(dto), ...review },
      });
      if (dto.example) await this.replaceFirstExample(tx, id, dto.example);
      // Approving a word answers whatever learners reported about it.
      if (decision === 'review') {
        await tx.wordReport.updateMany({
          where: { wordId: id, ...OPEN_REPORT },
          data: { resolvedAt: now },
        });
      }
    });
    return this.prisma.word.findUnique({
      where: { id },
      include: WORD_INCLUDE,
    });
  }

  listGrammar(level?: number) {
    return this.prisma.grammarPoint.findMany({
      where: level ? { level } : undefined,
      orderBy: [{ level: 'asc' }, { orderIndex: 'asc' }],
    });
  }

  async createGrammar(dto: CreateGrammarDto) {
    const { _max } = await this.prisma.grammarPoint.aggregate({
      _max: { orderIndex: true },
    });
    const point = await this.prisma.grammarPoint.create({
      data: grammarCreateData(dto, (_max.orderIndex ?? -1) + 1),
    });
    await this.refreshGrammarTotals([point.level]);
    return point;
  }

  async updateGrammar(id: string, dto: UpdateGrammarDto) {
    const before = await this.requireGrammar(id);
    const point = await this.prisma.grammarPoint.update({
      where: { id },
      data: grammarUpdateData(dto),
    });
    if (point.level !== before.level) {
      await this.refreshGrammarTotals([before.level, point.level]);
    }
    return point;
  }

  async deleteGrammar(id: string) {
    const point = await this.requireGrammar(id);
    await this.prisma.grammarPoint.delete({ where: { id } });
    await this.refreshGrammarTotals([point.level]);
    return { deleted: true };
  }

  async listVideos(query: AdminVideoQueryDto) {
    const q = query.q?.trim();
    const where: Prisma.VideoWhereInput = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { titleEn: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
        select: VIDEO_SELECT,
      }),
      this.prisma.video.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  async updateVideo(id: string, dto: UpdateVideoDto) {
    const exists = await this.prisma.video.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Không tìm thấy video');
    return this.prisma.video.update({
      where: { id },
      data: videoUpdateData(dto),
      select: VIDEO_SELECT,
    });
  }

  private async requireWord(id: string) {
    const word = await this.prisma.word.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!word) throw new NotFoundException('Không tìm thấy từ');
    return word;
  }

  private async requireGrammar(id: string) {
    const point = await this.prisma.grammarPoint.findUnique({
      where: { id },
      select: { id: true, level: true },
    });
    if (!point) throw new NotFoundException('Không tìm thấy điểm ngữ pháp');
    return point;
  }

  private async replaceFirstExample(
    tx: Prisma.TransactionClient,
    wordId: string,
    example: AdminExampleDto,
  ) {
    const data = {
      en: example.en.trim(),
      vi: example.vi?.trim() || null,
      source: ADMIN_SOURCE,
    };
    const first = await tx.wordExample.findFirst({
      where: { wordId },
      orderBy: { orderIndex: 'asc' },
      select: { id: true },
    });
    if (first) {
      await tx.wordExample.update({ where: { id: first.id }, data });
    } else {
      await tx.wordExample.create({ data: { ...data, wordId, orderIndex: 0 } });
    }
  }

  /** Keeps `EnglishLevel.totalGrammar` (shown on level cards) in sync. */
  private async refreshGrammarTotals(levels: number[]) {
    for (const level of new Set(levels)) {
      const totalGrammar = await this.prisma.grammarPoint.count({
        where: { level },
      });
      await this.prisma.englishLevel.updateMany({
        where: { level },
        data: { totalGrammar },
      });
    }
  }
}
