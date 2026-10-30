import { HttpException, HttpStatus, type MessageEvent } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { lastValueFrom, toArray } from 'rxjs';
import type { Env } from '../../config/env.validation';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import type { AssistantQuotaService } from './assistant-quota.service';
import { AssistantService } from './assistant.service';

const LIMIT_MESSAGE = 'Bạn đã dùng hết 30 câu hỏi trợ lý AI hôm nay.';

describe('AssistantService daily limit', () => {
  const prisma = {
    chatSession: { findFirst: jest.fn(), create: jest.fn() },
    chatMessage: { count: jest.fn() },
    $transaction: jest.fn(),
  };
  const quota = {
    tryConsume: jest.fn(),
    limitReachedMessage: () => LIMIT_MESSAGE,
  };
  let service: AssistantService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.chatSession.findFirst.mockResolvedValue({ id: 's1', title: null });
    quota.tryConsume.mockResolvedValue(false);
    // A key makes the service "configured"; no request is sent in these tests.
    const config = {
      get: (key: keyof Env) => (key === 'GEMINI_API_KEY' ? 'test-key' : ''),
    } as unknown as ConfigService<Env, true>;
    service = new AssistantService(
      config,
      prisma as unknown as PrismaService,
      quota as unknown as AssistantQuotaService,
    );
  });

  it('streams the limit message without calling the model or saving the turn', async () => {
    const events = await lastValueFrom(
      service.askStream('u1', 'Hello?').pipe(toArray()),
    );

    const payloads = events.map(
      (e: MessageEvent) => JSON.parse(e.data as string) as unknown,
    );
    expect(payloads).toEqual([
      { delta: LIMIT_MESSAGE },
      { done: true, sessionId: 's1' },
    ]);
    expect(prisma.chatMessage.count).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('answers 429 on the non-streaming endpoint', async () => {
    const error = await service.ask('u1', 'Hello?').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect(prisma.chatMessage.count).not.toHaveBeenCalled();
  });
});
