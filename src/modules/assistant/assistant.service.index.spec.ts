import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import type { AssistantQuotaService } from './assistant-quota.service';
import { AssistantService } from './assistant.service';

// More FAQ ids than the service defines, so every real source is already stored
// and buildIndex never reaches the (network) embedding call.
const STORED_FAQ_COUNT = 50;

const chunk = (sourceId: string) => ({
  sourceId,
  title: sourceId,
  text: sourceId,
  embedding: [0.1, 0.2],
});

describe('AssistantService index persistence', () => {
  const prisma = {
    grammarPoint: { findMany: jest.fn(), count: jest.fn() },
    assistantIndexChunk: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: AssistantService;

  const buildIndex = () =>
    (service as unknown as { buildIndex(): Promise<void> }).buildIndex();

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.grammarPoint.findMany.mockResolvedValue([]);
    prisma.grammarPoint.count.mockResolvedValue(0);
    prisma.assistantIndexChunk.deleteMany.mockReturnValue('delete-op');
    prisma.assistantIndexChunk.createMany.mockReturnValue('create-op');
    prisma.$transaction.mockResolvedValue([]);
    const config = {
      get: (key: keyof Env) => (key === 'GEMINI_API_KEY' ? 'test-key' : ''),
    } as unknown as ConfigService<Env, true>;
    service = new AssistantService(
      config,
      prisma as unknown as PrismaService,
      {} as AssistantQuotaService,
    );
  });

  it('loads an up-to-date stored index without rewriting it', async () => {
    // First run trims the oversized stored list down to exactly the real sources.
    const faqIds = Array.from(
      { length: STORED_FAQ_COUNT },
      (_, i) => `faq:${i}`,
    );
    prisma.assistantIndexChunk.findMany.mockResolvedValue(faqIds.map(chunk));
    await buildIndex();
    expect(prisma.$transaction).toHaveBeenCalledWith([
      'delete-op',
      'create-op',
    ]);
    const [{ data: exact }] = prisma.assistantIndexChunk.createMany.mock
      .calls[0] as [{ data: ReturnType<typeof chunk>[] }];

    // Second run (e.g. after a restart) finds exactly those chunks stored.
    jest.clearAllMocks();
    prisma.assistantIndexChunk.findMany.mockResolvedValue(exact);
    await buildIndex();

    const status = await service.getStatus();
    expect(status.indexedChunks).toBe(exact.length);
    expect(status.lastError).toBeNull();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('drops chunks whose source no longer exists when persisting', async () => {
    const faqIds = Array.from(
      { length: STORED_FAQ_COUNT },
      (_, i) => `faq:${i}`,
    );
    prisma.assistantIndexChunk.findMany.mockResolvedValue([
      ...faqIds.map(chunk),
      chunk('grammar:deleted-point'),
    ]);

    await buildIndex();

    const [{ data }] = prisma.assistantIndexChunk.createMany.mock.calls[0] as [
      { data: { sourceId: string }[] },
    ];
    const persisted = data.map((c) => c.sourceId);
    expect(persisted).not.toContain('grammar:deleted-point');
    expect(persisted.every((id) => id.startsWith('faq:'))).toBe(true);
    expect(persisted.length).toBe((await service.getStatus()).indexedChunks);
  });
});
