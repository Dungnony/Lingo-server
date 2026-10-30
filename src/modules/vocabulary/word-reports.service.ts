import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { ReportWordDto } from './dto/report-word.dto';

/** Learners flag AI-generated word content that looks wrong; admins see the
 * open reports in /admin and close them by fixing or approving the word. */
@Injectable()
export class WordReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async report(userId: string, wordId: string, dto: ReportWordDto) {
    const word = await this.prisma.word.findUnique({
      where: { id: wordId },
      select: { id: true },
    });
    if (!word) throw new NotFoundException('Không tìm thấy từ');

    const note = dto.note?.trim() || null;
    await this.prisma.$transaction([
      // One report per learner and word: sending again replaces it and
      // reopens it, so repeated clicks never pile up duplicates.
      this.prisma.wordReport.upsert({
        where: { wordId_userId: { wordId, userId } },
        create: { wordId, userId, reason: dto.reason, note },
        update: {
          reason: dto.reason,
          note,
          createdAt: new Date(),
          resolvedAt: null,
        },
      }),
      // A reported word needs another look, even if it was approved before.
      this.prisma.word.update({
        where: { id: wordId },
        data: { reviewedAt: null },
      }),
    ]);
    return { reported: true };
  }
}
