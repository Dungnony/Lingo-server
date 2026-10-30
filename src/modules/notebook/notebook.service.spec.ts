import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import { NotebookQueryDto } from './dto/notebook.dto';
import { DIFFICULT_MIN_LAPSES, NotebookService } from './notebook.service';

function query(tab: 'saved' | 'difficult'): NotebookQueryDto {
  return Object.assign(new NotebookQueryDto(), { tab, page: 1, pageSize: 20 });
}

function makePrisma() {
  const prisma = {
    word: { findUnique: jest.fn() },
    savedWord: {
      findMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    userWordProgress: { findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  return prisma;
}

describe('NotebookService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: NotebookService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new NotebookService(prisma as unknown as PrismaService);
  });

  it('refuses to save a word that does not exist', async () => {
    prisma.word.findUnique.mockResolvedValue(null);
    await expect(service.save('u1', 'w1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.savedWord.upsert).not.toHaveBeenCalled();
  });

  it('saves idempotently with an upsert', async () => {
    prisma.word.findUnique.mockResolvedValue({ id: 'w1' });
    await expect(service.save('u1', 'w1')).resolves.toEqual({ saved: true });
    expect(prisma.savedWord.upsert).toHaveBeenCalledWith({
      where: { userId_wordId: { userId: 'u1', wordId: 'w1' } },
      create: { userId: 'u1', wordId: 'w1' },
      update: {},
    });
  });

  it('removes without failing when the word was not saved', async () => {
    prisma.savedWord.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('u1', 'w1')).resolves.toEqual({
      saved: false,
    });
  });

  it('lists saved words newest first with their save date', async () => {
    const savedAt = new Date('2026-10-01T00:00:00Z');
    prisma.savedWord.findMany.mockResolvedValue([
      { createdAt: savedAt, word: { id: 'w1', word: 'apple' } },
    ]);
    prisma.savedWord.count.mockResolvedValue(1);

    const page = await service.list('u1', query('saved'));

    expect(page.items).toEqual([{ id: 'w1', word: 'apple', savedAt }]);
    expect(page.total).toBe(1);
    expect(prisma.savedWord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('lists difficult words from SRS lapses above the threshold', async () => {
    prisma.userWordProgress.findMany.mockResolvedValue([
      { lapses: 3, word: { id: 'w2', word: 'though' } },
    ]);
    prisma.userWordProgress.count.mockResolvedValue(1);

    const page = await service.list('u1', query('difficult'));

    expect(page.items).toEqual([{ id: 'w2', word: 'though', lapses: 3 }]);
    expect(prisma.userWordProgress.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', lapses: { gte: DIFFICULT_MIN_LAPSES } },
      }),
    );
  });

  it('returns saved word ids', async () => {
    prisma.savedWord.findMany.mockResolvedValue([
      { wordId: 'w1' },
      { wordId: 'w2' },
    ]);
    await expect(service.savedIds('u1')).resolves.toEqual(['w1', 'w2']);
  });
});
