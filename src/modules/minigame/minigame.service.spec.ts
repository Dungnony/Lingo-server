import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { GameMode } from '../../generated/prisma/client';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import type { WalletService } from '../wallet/wallet.service';
import type { FinishMinigameDto } from './dto/minigame.dto';
import { MINIGAME_DAILY_COIN_LIMIT, MinigameService } from './minigame.service';

const USER_ID = 'user-1';
const SESSION_ID = 'session-1';
const QUESTIONS = [
  { wordId: 'w1', correctIndex: 0 },
  { wordId: 'w2', correctIndex: 1 },
  { wordId: 'w3', correctIndex: 2 },
];
const MATCH_PAIRS = 8;
const MINUTE_MS = 60_000;
// 12:00 in Ho Chi Minh City, so its study day (cutoff 03:00) began 9 hours ago.
const NOW = new Date('2026-11-05T05:00:00.000Z');
const STUDY_DAY_START = new Date('2026-11-04T20:00:00.000Z');
const STARTED_AT = new Date(NOW.getTime() - MINUTE_MS);

function setup(mode: GameMode = GameMode.TRANSLATE) {
  const session: {
    startedAt: Date;
    finishedAt: Date | null;
    durationMs?: number;
  } & Record<string, unknown> = {
    id: SESSION_ID,
    userId: USER_ID,
    mode,
    questions: QUESTIONS,
    startedAt: STARTED_AT,
    finishedAt: null,
    user: { timezone: 'Asia/Ho_Chi_Minh' },
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
  const creditWithinLimit = jest.fn((_userId: string, amount: number) =>
    Promise.resolve({ credited: amount, balance: amount }),
  );
  const config = { get: () => 3 } as unknown as ConfigService<Env, true>;
  const service = new MinigameService(
    prisma as unknown as PrismaService,
    { creditWithinLimit } as unknown as WalletService,
    config,
  );
  return { service, session, creditWithinLimit };
}

describe('MinigameService.finish', () => {
  it('scores correct answers and credits one coin per point', async () => {
    const { service, session, creditWithinLimit } = setup();

    const result = await service.finish(
      USER_ID,
      SESSION_ID,
      {
        answers: [
          { wordId: 'w1', chosenIndex: 0 },
          { wordId: 'w2', chosenIndex: 1 },
          { wordId: 'w3', chosenIndex: 0 },
        ],
      },
      NOW,
    );

    expect(result).toMatchObject({
      score: 2,
      totalAsked: 3,
      coinsEarned: 2,
      coinLimitReached: false,
    });
    expect(creditWithinLimit).toHaveBeenCalledTimes(1);
    expect(session.finishedAt).toBeInstanceOf(Date);
  });

  it('counts a repeated correct answer only once', async () => {
    const { service } = setup();
    const repeated = { wordId: 'w1', chosenIndex: 0 };

    const result = await service.finish(
      USER_ID,
      SESSION_ID,
      { answers: [repeated, repeated, repeated] },
      NOW,
    );

    expect(result).toMatchObject({ score: 1, totalAsked: 1, coinsEarned: 1 });
  });

  it('keeps the first answer to a question', async () => {
    const { service } = setup();

    const result = await service.finish(
      USER_ID,
      SESSION_ID,
      {
        answers: [
          { wordId: 'w1', chosenIndex: 3 },
          { wordId: 'w1', chosenIndex: 0 },
        ],
      },
      NOW,
    );

    expect(result).toMatchObject({ score: 0, totalAsked: 1 });
  });

  it('ignores answers to words outside the session', async () => {
    const { service } = setup();

    const result = await service.finish(
      USER_ID,
      SESSION_ID,
      { answers: [{ wordId: 'not-in-session', chosenIndex: 0 }] },
      NOW,
    );

    expect(result).toMatchObject({ score: 0, totalAsked: 0 });
  });

  it('credits a quiz session once when finished concurrently', async () => {
    const { service, creditWithinLimit } = setup();
    const dto = { answers: [{ wordId: 'w1', chosenIndex: 0 }] };

    const results = await Promise.allSettled([
      service.finish(USER_ID, SESSION_ID, dto, NOW),
      service.finish(USER_ID, SESSION_ID, dto, NOW),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(creditWithinLimit).toHaveBeenCalledTimes(1);
  });

  it('credits a match session once when finished concurrently', async () => {
    const { service, creditWithinLimit } = setup(GameMode.MATCH);
    const dto = { mistakes: 2 };

    const results = await Promise.allSettled([
      service.finish(USER_ID, SESSION_ID, dto, NOW),
      service.finish(USER_ID, SESSION_ID, dto, NOW),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    expect(creditWithinLimit).toHaveBeenCalledTimes(1);
    expect(creditWithinLimit.mock.calls[0][1]).toBe(MATCH_PAIRS - 2);
  });

  it('rejects a session that has already finished', async () => {
    const { service, session, creditWithinLimit } = setup();
    session.finishedAt = new Date();

    await expect(
      service.finish(USER_ID, SESSION_ID, { answers: [] }, NOW),
    ).rejects.toThrow(BadRequestException);
    expect(creditWithinLimit).not.toHaveBeenCalled();
  });

  it("hides another user's session", async () => {
    const { service, creditWithinLimit } = setup();

    await expect(
      service.finish('someone-else', SESSION_ID, { answers: [] }, NOW),
    ).rejects.toThrow(NotFoundException);
    expect(creditWithinLimit).not.toHaveBeenCalled();
  });

  describe('duration', () => {
    const CLAIMS_ONE_MINUTE = {
      mistakes: 0,
      durationMs: MINUTE_MS,
    } as FinishMinigameDto;

    it('pays nothing for a match finished too fast, whatever the client claims', async () => {
      const { service, session } = setup(GameMode.MATCH);
      session.startedAt = new Date(NOW.getTime() - 1000);

      const result = await service.finish(
        USER_ID,
        SESSION_ID,
        CLAIMS_ONE_MINUTE,
        NOW,
      );

      expect(result).toMatchObject({ score: 0, coinsEarned: 0 });
    });

    it('pays a match that really took long enough', async () => {
      const { service } = setup(GameMode.MATCH);

      const result = await service.finish(
        USER_ID,
        SESSION_ID,
        { mistakes: 3 },
        NOW,
      );

      expect(result).toMatchObject({
        score: MATCH_PAIRS - 3,
        totalAsked: MATCH_PAIRS,
      });
    });

    it('records the server-measured duration for the leaderboard', async () => {
      const { service, session } = setup(GameMode.MATCH);

      await service.finish(
        USER_ID,
        SESSION_ID,
        { ...CLAIMS_ONE_MINUTE, durationMs: 1 } as FinishMinigameDto,
        NOW,
      );

      expect(session.durationMs).toBe(MINUTE_MS);
    });

    it('keeps the duration of an abandoned session inside the Int32 column', async () => {
      const { service, session } = setup();
      session.startedAt = new Date(NOW.getTime() - 60 * 86_400_000);

      await service.finish(USER_ID, SESSION_ID, { answers: [] }, NOW);

      expect(session.durationMs).toBeLessThanOrEqual(2 ** 31 - 1);
    });

    it('treats a start time ahead of the server clock as zero', async () => {
      const { service, session } = setup();
      session.startedAt = new Date(NOW.getTime() + 5000);

      await service.finish(USER_ID, SESSION_ID, { answers: [] }, NOW);

      expect(session.durationMs).toBe(0);
    });
  });

  describe('daily coin limit', () => {
    const CORRECT_ANSWER = { answers: [{ wordId: 'w1', chosenIndex: 0 }] };

    it('asks the wallet to cap coins from the start of the study day', async () => {
      const { service, creditWithinLimit } = setup();

      await service.finish(USER_ID, SESSION_ID, CORRECT_ANSWER, NOW);

      expect(creditWithinLimit).toHaveBeenCalledWith(USER_ID, 1, 'minigame', {
        maxCoins: MINIGAME_DAILY_COIN_LIMIT,
        since: STUDY_DAY_START,
      });
    });

    it('keeps the score but reports fewer coins at the limit', async () => {
      const { service, creditWithinLimit } = setup();
      creditWithinLimit.mockResolvedValue({ credited: 0, balance: 42 });

      const result = await service.finish(
        USER_ID,
        SESSION_ID,
        CORRECT_ANSWER,
        NOW,
      );

      expect(result).toEqual({
        score: 1,
        totalAsked: 1,
        coinsEarned: 0,
        coinLimitReached: true,
        balance: 42,
      });
    });

    it('does not report the limit when the score itself is zero', async () => {
      const { service, creditWithinLimit } = setup();
      creditWithinLimit.mockResolvedValue({ credited: 0, balance: 42 });

      const result = await service.finish(
        USER_ID,
        SESSION_ID,
        { answers: [] },
        NOW,
      );

      expect(result).toMatchObject({ coinLimitReached: false });
    });
  });
});
