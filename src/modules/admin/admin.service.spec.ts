import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import { ADMIN_SOURCE, AdminService } from './admin.service';
import { AdminWordQueryDto, type CreateGrammarDto } from './dto/admin.dto';

function makePrisma() {
  const prisma = {
    word: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    wordExample: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    wordReport: { updateMany: jest.fn() },
    grammarPoint: {
      aggregate: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    englishLevel: { updateMany: jest.fn() },
    video: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  // Array form runs the queries; callback form gets the client itself.
  prisma.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === 'function'
      ? (arg as (tx: typeof prisma) => unknown)(prisma)
      : Promise.all(arg as Promise<unknown>[]),
  );
  return prisma;
}

function firstCallArg(mock: jest.Mock): unknown {
  const calls = mock.mock.calls as unknown[][];
  return calls[0]?.[0];
}

const GRAMMAR: CreateGrammarDto = {
  slug: 'used-to',
  level: 2,
  titleVi: 'Used to',
  titleEn: 'Used to',
  summaryVi: 'Thói quen trong quá khứ',
  explanationVi: 'Giải thích',
  patterns: ['S + used to + V'],
  examples: [{ en: 'I used to swim.', vi: 'Tôi từng bơi.' }],
};

describe('AdminService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AdminService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new AdminService(prisma as unknown as PrismaService);
  });

  describe('words', () => {
    it('searches by English word or Vietnamese meaning within a level', async () => {
      prisma.word.findMany.mockResolvedValue([]);
      prisma.word.count.mockResolvedValue(0);
      const query = Object.assign(new AdminWordQueryDto(), {
        level: 3,
        q: ' run ',
      });

      await service.listWords(query);

      expect(prisma.word.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            level: 3,
            OR: [
              { word: { contains: 'run', mode: 'insensitive' } },
              { meaningVi: { contains: 'run', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('returns 404 when editing a missing word', async () => {
      prisma.word.findUnique.mockResolvedValue(null);
      await expect(
        service.updateWord('w1', { meaningVi: 'chạy' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.word.update).not.toHaveBeenCalled();
    });

    it('updates the first example sentence in place', async () => {
      prisma.word.findUnique.mockResolvedValue({ id: 'w1' });
      prisma.wordExample.findFirst.mockResolvedValue({ id: 'e1' });

      await service.updateWord('w1', {
        meaningVi: ' chạy ',
        example: { en: ' I run. ', vi: '' },
      });

      expect(firstCallArg(prisma.word.update)).toMatchObject({
        where: { id: 'w1' },
        data: { meaningVi: 'chạy' },
      });
      expect(prisma.wordExample.update).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: { en: 'I run.', vi: null, source: ADMIN_SOURCE },
      });
      expect(prisma.wordExample.create).not.toHaveBeenCalled();
    });

    it('creates an example when the word has none', async () => {
      prisma.word.findUnique.mockResolvedValue({ id: 'w1' });
      prisma.wordExample.findFirst.mockResolvedValue(null);

      await service.updateWord('w1', { example: { en: 'Run!', vi: 'Chạy!' } });

      expect(prisma.wordExample.create).toHaveBeenCalledWith({
        data: {
          en: 'Run!',
          vi: 'Chạy!',
          source: ADMIN_SOURCE,
          wordId: 'w1',
          orderIndex: 0,
        },
      });
    });
  });

  describe('word review', () => {
    function query(extra: Partial<AdminWordQueryDto>) {
      return Object.assign(new AdminWordQueryDto(), extra);
    }
    function listWhere(): unknown {
      return (firstCallArg(prisma.word.findMany) as { where: unknown }).where;
    }

    beforeEach(() => {
      prisma.word.findMany.mockResolvedValue([]);
      prisma.word.count.mockResolvedValue(0);
    });

    it('filters words still to review', async () => {
      await service.listWords(query({ reviewed: 'false' }));
      expect(listWhere()).toEqual({ reviewedAt: null });
    });

    it('filters approved words', async () => {
      await service.listWords(query({ reviewed: 'true' }));
      expect(listWhere()).toEqual({ reviewedAt: { not: null } });
    });

    it('filters words with open learner reports', async () => {
      await service.listWords(query({ reported: 'true' }));
      expect(listWhere()).toEqual({
        reports: { some: { resolvedAt: null } },
      });
    });

    it('filters words the AI cross-check flagged', async () => {
      await service.listWords(query({ aiFlagged: 'true' }));
      expect(listWhere()).toEqual({ aiFlag: { not: null } });
    });

    it('clears the AI flag when a word is approved', async () => {
      prisma.word.findUnique.mockResolvedValue({ id: 'w1' });
      await service.updateWord('w1', { reviewed: true });
      expect(firstCallArg(prisma.word.update)).toMatchObject({
        data: { aiFlag: null },
      });
    });

    it('keeps the AI flag when an approval is undone', async () => {
      prisma.word.findUnique.mockResolvedValue({ id: 'w1' });
      await service.updateWord('w1', { reviewed: false });
      const update = firstCallArg(prisma.word.update) as {
        data: Record<string, unknown>;
      };
      expect(update.data.aiFlag).toBeUndefined();
    });

    it('approves a whole page of words at once and closes their reports', async () => {
      prisma.word.updateMany.mockResolvedValue({ count: 2 });

      await expect(service.reviewWords(['w1', 'w2'])).resolves.toEqual({
        reviewed: 2,
      });

      const update = firstCallArg(prisma.word.updateMany) as {
        where: unknown;
        data: { reviewedAt: unknown; aiFlag: unknown };
      };
      expect(update.where).toEqual({ id: { in: ['w1', 'w2'] } });
      expect(update.data.reviewedAt).toBeInstanceOf(Date);
      expect(update.data.aiFlag).toBeNull();
      expect(prisma.wordReport.updateMany).toHaveBeenCalledWith({
        where: { wordId: { in: ['w1', 'w2'] }, resolvedAt: null },
        data: { resolvedAt: update.data.reviewedAt },
      });
    });

    it('approves an edited word and closes its open reports', async () => {
      prisma.word.findUnique.mockResolvedValue({ id: 'w1' });

      await service.updateWord('w1', { meaningVi: 'chạy' });

      const update = firstCallArg(prisma.word.update) as {
        data: { reviewedAt: unknown };
      };
      expect(update.data.reviewedAt).toBeInstanceOf(Date);
      expect(prisma.wordReport.updateMany).toHaveBeenCalledWith({
        where: { wordId: 'w1', resolvedAt: null },
        data: { resolvedAt: update.data.reviewedAt },
      });
    });

    it('undoes an approval without touching reports', async () => {
      prisma.word.findUnique.mockResolvedValue({ id: 'w1' });

      await service.updateWord('w1', { reviewed: false });

      expect(firstCallArg(prisma.word.update)).toMatchObject({
        data: { reviewedAt: null },
      });
      expect(prisma.wordReport.updateMany).not.toHaveBeenCalled();
    });

    it('reports review progress', async () => {
      prisma.word.count
        .mockResolvedValueOnce(8649)
        .mockResolvedValueOnce(120)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(42);

      await expect(service.wordStats()).resolves.toEqual({
        total: 8649,
        reviewed: 120,
        reported: 3,
        aiFlagged: 42,
      });
      expect(prisma.word.count).toHaveBeenNthCalledWith(4, {
        where: { aiFlag: { not: null } },
      });
      expect(prisma.word.count).toHaveBeenNthCalledWith(2, {
        where: { reviewedAt: { not: null } },
      });
      expect(prisma.word.count).toHaveBeenNthCalledWith(3, {
        where: { reports: { some: { resolvedAt: null } } },
      });
    });
  });

  describe('grammar', () => {
    it('appends a new point after the last one and recounts its level', async () => {
      prisma.grammarPoint.aggregate.mockResolvedValue({
        _max: { orderIndex: 71 },
      });
      prisma.grammarPoint.create.mockResolvedValue({ id: 'g1', level: 2 });
      prisma.grammarPoint.count.mockResolvedValue(13);

      await service.createGrammar(GRAMMAR);

      expect(firstCallArg(prisma.grammarPoint.create)).toMatchObject({
        data: { slug: 'used-to', orderIndex: 72 },
      });
      expect(prisma.englishLevel.updateMany).toHaveBeenCalledWith({
        where: { level: 2 },
        data: { totalGrammar: 13 },
      });
    });

    it('starts ordering at 0 when there is no grammar yet', async () => {
      prisma.grammarPoint.aggregate.mockResolvedValue({
        _max: { orderIndex: null },
      });
      prisma.grammarPoint.create.mockResolvedValue({ id: 'g1', level: 2 });
      prisma.grammarPoint.count.mockResolvedValue(1);

      await service.createGrammar(GRAMMAR);

      expect(firstCallArg(prisma.grammarPoint.create)).toMatchObject({
        data: { orderIndex: 0 },
      });
    });

    it('recounts both levels when a point moves level', async () => {
      prisma.grammarPoint.findUnique.mockResolvedValue({ id: 'g1', level: 2 });
      prisma.grammarPoint.update.mockResolvedValue({ id: 'g1', level: 4 });
      prisma.grammarPoint.count.mockResolvedValue(12);

      await service.updateGrammar('g1', { level: 4 });

      const levels = prisma.englishLevel.updateMany.mock.calls.map(
        ([arg]: [{ where: { level: number } }]) => arg.where.level,
      );
      expect(levels).toEqual([2, 4]);
    });

    it('does not recount when the level is unchanged', async () => {
      prisma.grammarPoint.findUnique.mockResolvedValue({ id: 'g1', level: 2 });
      prisma.grammarPoint.update.mockResolvedValue({ id: 'g1', level: 2 });

      await service.updateGrammar('g1', { titleVi: 'Mới' });

      expect(prisma.englishLevel.updateMany).not.toHaveBeenCalled();
    });

    it('returns 404 when deleting a missing point', async () => {
      prisma.grammarPoint.findUnique.mockResolvedValue(null);
      await expect(service.deleteGrammar('g1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.grammarPoint.delete).not.toHaveBeenCalled();
    });

    it('deletes a point and recounts its level', async () => {
      prisma.grammarPoint.findUnique.mockResolvedValue({ id: 'g1', level: 5 });
      prisma.grammarPoint.count.mockResolvedValue(11);

      await expect(service.deleteGrammar('g1')).resolves.toEqual({
        deleted: true,
      });
      expect(prisma.englishLevel.updateMany).toHaveBeenCalledWith({
        where: { level: 5 },
        data: { totalGrammar: 11 },
      });
    });
  });

  describe('videos', () => {
    it('returns 404 when editing a missing video', async () => {
      prisma.video.findUnique.mockResolvedValue(null);
      await expect(
        service.updateVideo('v1', { level: 2 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.video.update).not.toHaveBeenCalled();
    });

    it('updates video metadata', async () => {
      prisma.video.findUnique.mockResolvedValue({ id: 'v1' });
      await service.updateVideo('v1', { level: 2, titleEn: '' });
      expect(firstCallArg(prisma.video.update)).toMatchObject({
        where: { id: 'v1' },
        data: { level: 2, titleEn: null },
      });
    });
  });
});
