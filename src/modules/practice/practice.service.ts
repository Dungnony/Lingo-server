import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PracticeSkill } from '../../generated/prisma/client';
import { AppEvent, type PracticeAttemptedPayload } from '../../events/events';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { RecordAttemptDto } from './dto/practice.dto';
import { summarizeAttempts } from './practice-stats.util';

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async record(userId: string, dto: RecordAttemptDto) {
    const word = await this.prisma.word.findUnique({
      where: { id: dto.wordId },
      select: { id: true },
    });
    if (!word) throw new NotFoundException('Không tìm thấy từ');

    // Every skill can be graded on the client; omitted = recorded ungraded.
    const attempt = await this.prisma.practiceAttempt.create({
      data: {
        userId,
        wordId: dto.wordId,
        skill: dto.skill,
        isCorrect: dto.isCorrect ?? null,
      },
    });

    const payload: PracticeAttemptedPayload = {
      userId,
      wordId: dto.wordId,
      skill: dto.skill,
      isCorrect: attempt.isCorrect,
      durationMs: dto.durationMs,
      at: attempt.createdAt.toISOString(),
    };
    this.events.emit(AppEvent.PracticeAttempted, payload);

    return { ok: true };
  }

  async stats(userId: string, skill: PracticeSkill) {
    const rows = await this.prisma.practiceAttempt.findMany({
      where: { userId, skill },
      select: { wordId: true, isCorrect: true },
    });
    return summarizeAttempts(rows);
  }
}
