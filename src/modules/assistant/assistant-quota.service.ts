import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../generated/prisma/client';
import { isoDateToUtcDate, localStudyDate } from '../../common/time.util';
import type { Env } from '../../config/env.validation';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Per-user daily question limit for the assistant, so a few heavy users
 * cannot exhaust the Gemini quota shared by everyone. The day follows the
 * user's timezone and the streak cutoff hour, like every other "today". */
@Injectable()
export class AssistantQuotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  get dailyLimit(): number {
    return this.config.get('ASSISTANT_DAILY_LIMIT', { infer: true });
  }

  /** Reserves one question for today; false when the limit is reached. A
   * reserved question still counts if the model call later fails. */
  async tryConsume(userId: string, now = new Date()): Promise<boolean> {
    const localDate = await this.studyDay(userId, now);
    try {
      await this.prisma.assistantDailyUsage.upsert({
        where: { userId_localDate: { userId, localDate } },
        create: { userId, localDate },
        update: {},
      });
    } catch (err) {
      // Two first questions of the day can race to create the row.
      const raced =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002';
      if (!raced) throw err;
    }
    // Conditional increment keeps concurrent requests from overshooting.
    const { count } = await this.prisma.assistantDailyUsage.updateMany({
      where: { userId, localDate, count: { lt: this.dailyLimit } },
      data: { count: { increment: 1 } },
    });
    return count === 1;
  }

  limitReachedMessage(): string {
    return `Bạn đã dùng hết ${this.dailyLimit} câu hỏi trợ lý AI hôm nay. Hạn mức sẽ làm mới vào ngày mai — trong lúc chờ, hãy ôn flashcard hoặc luyện nghe, phát âm nhé!`;
  }

  private async studyDay(userId: string, now: Date): Promise<Date> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const fallback: string = this.config.get('DEFAULT_USER_TIMEZONE', {
      infer: true,
    });
    const timezone: string = user?.timezone ?? fallback;
    const cutoff = this.config.get('STREAK_DAY_CUTOFF_HOUR', { infer: true });
    return isoDateToUtcDate(localStudyDate(now, timezone, cutoff));
  }
}
