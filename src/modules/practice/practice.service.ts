import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GoogleGenAI } from '@google/genai';
import { PracticeSkill } from '../../generated/prisma/client';
import type { Env } from '../../config/env.validation';
import { AppEvent, type PracticeAttemptedPayload } from '../../events/events';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { EvaluateSentenceDto, RecordAttemptDto } from './dto/practice.dto';
import { summarizeAttempts } from './practice-stats.util';
import {
  evaluateSentenceFallback,
  parseAiEvaluationJson,
  type SentenceEvaluation,
} from './sentence-eval.util';

@Injectable()
export class PracticeService {
  private readonly logger = new Logger(PracticeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly config: ConfigService<Env, true>,
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

  async evaluateSentence(
    userId: string,
    dto: EvaluateSentenceDto,
  ): Promise<SentenceEvaluation> {
    const word = await this.prisma.word.findUnique({
      where: { id: dto.wordId },
      select: { id: true, word: true, meaningVi: true, pos: true, level: true },
    });
    if (!word) throw new NotFoundException('Không tìm thấy từ');

    const fallback = evaluateSentenceFallback(
      word.word,
      word.meaningVi,
      dto.sentence,
    );

    const apiKey = this.config.get('GEMINI_API_KEY', { infer: true });
    let evaluation = fallback;

    if (apiKey) {
      const prompt = [
        'Bạn là giáo viên tiếng Anh thân thiện cho người Việt (trả về JSON thuần).',
        `Từ mục tiêu: "${word.word}" (${word.pos.join(', ') || 'từ vựng'}, level ${word.level}, nghĩa tiếng Việt: "${word.meaningVi ?? 'không rõ'}").`,
        `Câu của học viên: ${JSON.stringify(dto.sentence.trim())}`,
        'Hãy chấm câu theo schema JSON sau:',
        '{"score": 0-100, "isNatural": boolean, "corrected": "câu tiếng Anh tự nhiên đã sửa nếu cần", "feedbackVi": "nhận xét ngắn gọn bằng tiếng Việt (1-2 câu)", "tipVi": "gợi ý cách dùng tự nhiên hơn bằng tiếng Việt (1 câu)", "usedTargetWord": boolean}',
      ].join('\n');

      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        if (response.text) {
          evaluation = parseAiEvaluationJson(response.text, fallback);
        }
      } catch (err) {
        this.logger.warn(
          `evaluateSentence AI fallback: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const attempt = await this.prisma.practiceAttempt.create({
      data: {
        userId,
        wordId: word.id,
        skill: PracticeSkill.WRITING,
        isCorrect: evaluation.score >= 70,
      },
    });

    const payload: PracticeAttemptedPayload = {
      userId,
      wordId: word.id,
      skill: PracticeSkill.WRITING,
      isCorrect: attempt.isCorrect,
      durationMs: undefined,
      at: attempt.createdAt.toISOString(),
    };
    this.events.emit(AppEvent.PracticeAttempted, payload);

    return evaluation;
  }
}
