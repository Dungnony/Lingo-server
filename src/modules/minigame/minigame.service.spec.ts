import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GameMode } from '../../generated/prisma/client';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import type { WalletService } from '../wallet/wallet.service';
import { MinigameService } from './minigame.service';

const USER_ID = 'user-1';
const SESSION_ID = 'session-1';
const QUESTIONS = [
  { wordId: 'w1', correctIndex: 0 },
  { wordId: 'w2', correctIndex: 1 },
  { wordId: 'w3', correctIndex: 2 },
];
const MATCH_PAIRS = 8;
const DURATION_MS = 60_000;

function setup(mode: GameMode = GameMode.TRANSLATE) {
  const session: { finishedAt: Date | null } & Record<string, unknown> = {
    id: SESSION_ID,
    userId: USER_ID,
    mode,
    questions: QUESTIONS,
    finishedAt: null,
  };
  const updateMany = jest.fn(
    ({
      where,
      data,
    }: {
      where: { finishedAt: null };
      data: { finishedAt: Date } & Record<string, unknown>;
    }) => {
      if (where.finishedAt !== null || session.finishedAt) {
        return Promise.resolve({ count: 0 });
      }
      Object.assign(session, data);
      return Promise.resolve({ count: 1 });
    },
  );
  const prisma = {
    minigameSession: {
      findUnique: jest.fn(() => Promise.resolve({ ...session })),
      updateMany,
    },
  };
  const credit = jest.fn((_userId: string, amount: number) =>
    Promise.resolve(amount),
  );
  const service = new MinigameService(
    prisma as unknown as PrismaService,
    { credit } as unknown as WalletService,
  );
  return { service, session, credit };
}

describe('MinigameService.finish', () => {
  it('scores correct answers and credits one coin per point', async () => {
    const { service, session, credit } = setup();

    const result = await service.finish(USER_ID, SESSION_ID, {
      durationMs: DURATION_MS,
      answers: [
        { wordId: 'w1', chosenIndex: 0 },
        { wordId: 'w2', chosenIndex: 1 },
        { wordId: 'w3', chosenIndex: 0 },
      ],
    });

    expect(result).toMatchObject({ score: 2, totalAsked: 3, coinsEarned: 2 });
    expect(credit).toHaveBeenCalledTimes(1);
    expect(session.finishedAt).toBeInstanceOf(Date);
  });

  it('counts a repeated correct answer only once', async () => {
    const { service } = setup();
    const repeated = { wordId: 'w1', chosenIndex: 0 };

    const result = await service.finish(USER_ID, SESSION_ID, {
      durationMs: DURATION_MS,
      answers: [repeated, repeated, repeated],
    });

    expect(result).toMatchObject({ score: 1, totalAsked: 1, coinsEarned: 1 });
  });

  it('keeps the first answer to a question', async () => {
    const { service } = setup();

    const result = await service.finish(USER_ID, SESSION_ID, {
      durationMs: DURATION_MS,
      answers: [
        { wordId: 'w1', chosenIndex: 3 },
        { wordId: 'w1', chosenIndex: 0 },
      ],
    });

    expect(result).toMatchObject({ score: 0, totalAsked: 1 });
  });

  it('ignores answers to words outside the session', async () => {
    const { service } = setup();

    const result = await service.finish(USER_ID, SESSION_ID, {
      durationMs: DURATION_MS,
      answers: [{ wordId: 'not-in-session', chosenIndex: 0 }],
    });

    expect(result).toMatchObject({ score: 0, totalAsked: 0 });
  });

  it('credits a quiz session once when finished concurrently', async () => {
    const { service, credit } = setup();
    const dto = {
      durationMs: DURATION_MS,
      answers: [{ wordId: 'w1', chosenIndex: 0 }],
    };

    const results = await Promise.allSettled([
      service.finish(USER_ID, SESSION_ID, dto),
      service.finish(USER_ID, SESSION_ID, dto),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(credit).toHaveBeenCalledTimes(1);
  });

  it('credits a match session once when finished concurrently', async () => {
    const { service, credit } = setup(GameMode.MATCH);
    const dto = { durationMs: DURATION_MS, mistakes: 2 };

    const results = await Promise.allSettled([
      service.finish(USER_ID, SESSION_ID, dto),
      service.finish(USER_ID, SESSION_ID, dto),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(credit).toHaveBeenCalledTimes(1);
    expect(credit.mock.calls[0][1]).toBe(MATCH_PAIRS - 2);
  });

  it('rejects a session that has already finished', async () => {
    const { service, session, credit } = setup();
    session.finishedAt = new Date();

    await expect(
      service.finish(USER_ID, SESSION_ID, {
        durationMs: DURATION_MS,
        answers: [],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(credit).not.toHaveBeenCalled();
  });

  it("hides another user's session", async () => {
    const { service, credit } = setup();

    await expect(
      service.finish('someone-else', SESSION_ID, {
        durationMs: DURATION_MS,
        answers: [],
      }),
    ).rejects.toThrow(NotFoundException);
    expect(credit).not.toHaveBeenCalled();
  });
});
