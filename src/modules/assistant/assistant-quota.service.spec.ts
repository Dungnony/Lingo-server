import type { ConfigService } from '@nestjs/config';
import { Prisma } from '../../generated/prisma/client';
import type { Env } from '../../config/env.validation';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import { AssistantQuotaService } from './assistant-quota.service';

const LIMIT = 3;
const CONFIG: Partial<Env> = {
  ASSISTANT_DAILY_LIMIT: LIMIT,
  STREAK_DAY_CUTOFF_HOUR: 3,
  DEFAULT_USER_TIMEZONE: 'Asia/Ho_Chi_Minh',
};

function makePrisma() {
  return {
    user: { findUnique: jest.fn() },
    assistantDailyUsage: { upsert: jest.fn(), updateMany: jest.fn() },
  };
}

describe('AssistantQuotaService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let quota: AssistantQuotaService;

  beforeEach(() => {
    prisma = makePrisma();
    prisma.user.findUnique.mockResolvedValue({ timezone: 'Asia/Ho_Chi_Minh' });
    prisma.assistantDailyUsage.upsert.mockResolvedValue({});
    const config = {
      get: (key: keyof Env) => CONFIG[key],
    } as unknown as ConfigService<Env, true>;
    quota = new AssistantQuotaService(
      prisma as unknown as PrismaService,
      config,
    );
  });

  it('allows a question while under the limit, incrementing atomically', async () => {
    prisma.assistantDailyUsage.updateMany.mockResolvedValue({ count: 1 });

    await expect(quota.tryConsume('u1')).resolves.toBe(true);

    expect(prisma.assistantDailyUsage.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        localDate: expect.any(Date) as Date,
        count: { lt: LIMIT },
      },
      data: { count: { increment: 1 } },
    });
  });

  it('refuses once the limit is reached', async () => {
    prisma.assistantDailyUsage.updateMany.mockResolvedValue({ count: 0 });
    await expect(quota.tryConsume('u1')).resolves.toBe(false);
  });

  it("counts against the user's local study day, not the UTC day", async () => {
    prisma.assistantDailyUsage.updateMany.mockResolvedValue({ count: 1 });
    // 01:30 in Hanoi on 18 Oct is before the 03:00 cutoff → still 17 Oct.
    await quota.tryConsume('u1', new Date('2026-10-17T18:30:00.000Z'));

    const [[args]] = prisma.assistantDailyUsage.upsert.mock.calls as [
      [{ create: { localDate: Date } }],
    ];
    expect(args.create.localDate.toISOString()).toBe(
      '2026-10-17T00:00:00.000Z',
    );
  });

  it('tolerates two first questions of the day racing to create the row', async () => {
    prisma.assistantDailyUsage.upsert.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    prisma.assistantDailyUsage.updateMany.mockResolvedValue({ count: 1 });
    await expect(quota.tryConsume('u1')).resolves.toBe(true);
  });

  it('rethrows other database errors', async () => {
    prisma.assistantDailyUsage.upsert.mockRejectedValue(new Error('db down'));
    await expect(quota.tryConsume('u1')).rejects.toThrow('db down');
  });

  it('names the limit in the message shown to the user', () => {
    expect(quota.limitReachedMessage()).toContain(String(LIMIT));
  });
});
