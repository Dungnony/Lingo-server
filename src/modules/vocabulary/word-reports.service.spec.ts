import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import { WordReportsService } from './word-reports.service';

function makePrisma() {
  const prisma = {
    word: { findUnique: jest.fn(), update: jest.fn() },
    wordReport: { upsert: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  return prisma;
}

describe('WordReportsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: WordReportsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new WordReportsService(prisma as unknown as PrismaService);
  });

  it('refuses to report a word that does not exist', async () => {
    prisma.word.findUnique.mockResolvedValue(null);
    await expect(
      service.report('u1', 'w1', { reason: 'MEANING' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.wordReport.upsert).not.toHaveBeenCalled();
  });

  it('keeps one report per learner and word, reopening it when sent again', async () => {
    prisma.word.findUnique.mockResolvedValue({ id: 'w1' });

    await expect(
      service.report('u1', 'w1', { reason: 'EXAMPLE', note: '  sai nghĩa ' }),
    ).resolves.toEqual({ reported: true });

    const [[args]] = prisma.wordReport.upsert.mock.calls as [
      [
        {
          where: unknown;
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        },
      ],
    ];
    expect(args.where).toEqual({
      wordId_userId: { wordId: 'w1', userId: 'u1' },
    });
    expect(args.create).toEqual({
      wordId: 'w1',
      userId: 'u1',
      reason: 'EXAMPLE',
      note: 'sai nghĩa',
    });
    expect(args.update).toMatchObject({
      reason: 'EXAMPLE',
      note: 'sai nghĩa',
      resolvedAt: null,
    });
    expect(args.update.createdAt).toBeInstanceOf(Date);
  });

  it('sends a reported word back to the review queue', async () => {
    prisma.word.findUnique.mockResolvedValue({ id: 'w1' });
    await service.report('u1', 'w1', { reason: 'MEANING' });
    expect(prisma.word.update).toHaveBeenCalledWith({
      where: { id: 'w1' },
      data: { reviewedAt: null },
    });
  });

  it('stores a blank note as no note', async () => {
    prisma.word.findUnique.mockResolvedValue({ id: 'w1' });
    await service.report('u1', 'w1', { reason: 'OTHER', note: '   ' });
    const [[args]] = prisma.wordReport.upsert.mock.calls as [
      [{ create: { note: unknown } }],
    ];
    expect(args.create.note).toBeNull();
  });
});
