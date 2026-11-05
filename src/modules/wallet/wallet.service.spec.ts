import type { PrismaService } from '../../infra/prisma/prisma.service';
import type { StreakService } from '../gamification/streak/streak.service';
import { WalletService } from './wallet.service';

const USER_ID = 'user-1';
const REASON = 'minigame';
const LIMIT = { maxCoins: 100, since: new Date('2026-11-04T20:00:00.000Z') };

function setup({ balance = 50, spentToday = 0 } = {}) {
  const tx = {
    userWallet: {
      upsert: jest.fn(() => Promise.resolve({ balance })),
      update: jest.fn(
        ({ data }: { data: { balance: { increment: number } } }) =>
          Promise.resolve({ balance: balance + data.balance.increment }),
      ),
    },
    coinTransaction: {
      aggregate: jest.fn(() =>
        Promise.resolve({ _sum: { amount: spentToday || null } }),
      ),
      create: jest.fn(() => Promise.resolve({})),
    },
  };
  const prisma = {
    $transaction: jest.fn((run: (client: typeof tx) => Promise<unknown>) =>
      run(tx),
    ),
  };
  const service = new WalletService(
    prisma as unknown as PrismaService,
    {} as StreakService,
  );
  return { service, tx };
}

describe('WalletService.creditWithinLimit', () => {
  it('credits the full amount below the limit', async () => {
    const { service, tx } = setup({ balance: 50, spentToday: 20 });

    const result = await service.creditWithinLimit(USER_ID, 30, REASON, LIMIT);

    expect(result).toEqual({ credited: 30, balance: 80 });
    expect(tx.coinTransaction.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, amount: 30, reason: REASON },
    });
  });

  it('credits the full amount on the first credit of the day', async () => {
    const { service } = setup({ balance: 0 });

    const result = await service.creditWithinLimit(USER_ID, 8, REASON, LIMIT);

    expect(result).toEqual({ credited: 8, balance: 8 });
  });

  it('credits only what is left when the amount crosses the limit', async () => {
    const { service, tx } = setup({ balance: 95, spentToday: 95 });

    const result = await service.creditWithinLimit(USER_ID, 30, REASON, LIMIT);

    expect(result).toEqual({ credited: 5, balance: 100 });
    expect(tx.coinTransaction.create).toHaveBeenCalledWith({
      data: { userId: USER_ID, amount: 5, reason: REASON },
    });
  });

  it('writes nothing once the limit is reached', async () => {
    const { service, tx } = setup({ balance: 100, spentToday: 100 });

    const result = await service.creditWithinLimit(USER_ID, 8, REASON, LIMIT);

    expect(result).toEqual({ credited: 0, balance: 100 });
    expect(tx.userWallet.update).not.toHaveBeenCalled();
    expect(tx.coinTransaction.create).not.toHaveBeenCalled();
  });

  it('writes nothing for a zero amount', async () => {
    const { service, tx } = setup({ balance: 12 });

    const result = await service.creditWithinLimit(USER_ID, 0, REASON, LIMIT);

    expect(result).toEqual({ credited: 0, balance: 12 });
    expect(tx.coinTransaction.create).not.toHaveBeenCalled();
  });

  it('counts only this reason since the start of the period', async () => {
    const { service, tx } = setup();

    await service.creditWithinLimit(USER_ID, 1, REASON, LIMIT);

    expect(tx.coinTransaction.aggregate).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        reason: REASON,
        createdAt: { gte: LIMIT.since },
      },
      _sum: { amount: true },
    });
  });

  it('locks the wallet row before reading the running total', async () => {
    const { service, tx } = setup();

    await service.creditWithinLimit(USER_ID, 1, REASON, LIMIT);

    const [lockOrder] = tx.userWallet.upsert.mock.invocationCallOrder;
    const [readOrder] = tx.coinTransaction.aggregate.mock.invocationCallOrder;
    expect(lockOrder).toBeLessThan(readOrder);
    expect(tx.userWallet.upsert).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      create: { userId: USER_ID },
      update: { balance: { increment: 0 } },
    });
  });
});
