import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SrsState } from '../../generated/prisma/client';
import { levelBand } from '../../common/levels';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type {
  FastTrackQuizDto,
  FastTrackSubmitDto,
} from './dto/fast-track.dto';

const LEARNED_INTERVAL_DAYS = 21;
const FAST_TRACK_INTERVAL_DAYS = 30;
const FAST_TRACK_EASE_FACTOR = 2.6;
const FAST_TRACK_QUIZ_SIZE = 5;
const FAST_TRACK_PASS_PCT = 80;
const MS_PER_DAY = 86_400_000;

export type LessonStatus = 'COMPLETED' | 'IN_PROGRESS' | 'AVAILABLE' | 'LOCKED';

export interface LessonNode {
  id: string;
  orderIndex: number;
  title: string;
  wordCount: number;
  learnedWords: number;
  startedWords: number;
  dueWords: number;
  status: LessonStatus;
  previewWords: string[];
}

function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

@Injectable()
export class LearnService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cấp học "hiện tại" = cấp bắt đầu từ recommendedLevel (nếu có) chưa thuộc hết. */
  private async currentLevel(userId: string): Promise<number> {
    const [profile, totals, learned] = await Promise.all([
      this.prisma.onboardingProfile.findUnique({
        where: { userId },
        select: { recommendedLevel: true },
      }),
      this.prisma.word.groupBy({
        by: ['level'],
        _count: true,
        orderBy: { level: 'asc' },
      }),
      this.prisma.userWordProgress.groupBy({
        by: ['level'],
        where: { userId, learnedAt: { not: null } },
        _count: true,
      }),
    ]);
    const learnedBy = new Map(learned.map((l) => [l.level, l._count]));
    const startLevel = profile?.recommendedLevel ?? totals[0]?.level ?? 1;
    for (const t of totals) {
      if (t.level >= startLevel && (learnedBy.get(t.level) ?? 0) < t._count) {
        return t.level;
      }
    }
    for (const t of totals) {
      if ((learnedBy.get(t.level) ?? 0) < t._count) return t.level;
    }
    return startLevel;
  }

  async path(userId: string, level?: number) {
    const lvl = level ?? (await this.currentLevel(userId));

    const [levelInfo, lessons, progressRows, levelSummary] = await Promise.all([
      this.prisma.englishLevel.findUnique({ where: { level: lvl } }),
      this.prisma.lesson.findMany({
        where: { level: lvl },
        orderBy: { orderIndex: 'asc' },
      }),
      this.prisma.userWordProgress.findMany({
        where: { userId, level: lvl },
        select: {
          wordId: true,
          state: true,
          learnedAt: true,
          intervalDays: true,
          dueAt: true,
          isSuspended: true,
          word: { select: { lessonId: true } },
        },
      }),
      this.prisma.lesson.groupBy({ by: ['level'], _count: true }),
    ]);
    if (!levelInfo) throw new NotFoundException('Cấp độ không hợp lệ');

    const now = Date.now();
    const perLesson = new Map<
      string,
      { learned: number; started: number; due: number }
    >();
    for (const p of progressRows) {
      const lid = p.word.lessonId;
      if (!lid) continue;
      const agg = perLesson.get(lid) ?? { learned: 0, started: 0, due: 0 };
      agg.started += 1;
      const isLearned =
        p.learnedAt != null ||
        (p.state === SrsState.REVIEW &&
          p.intervalDays >= LEARNED_INTERVAL_DAYS);
      if (isLearned) agg.learned += 1;
      if (
        !p.isSuspended &&
        p.state !== SrsState.NEW &&
        p.dueAt &&
        p.dueAt.getTime() <= now
      )
        agg.due += 1;
      perLesson.set(lid, agg);
    }

    // preview: 3 từ đầu mỗi bài
    const firstWords = await this.prisma.word.findMany({
      where: {
        lessonId: { in: lessons.map((l) => l.id) },
        lessonOrder: { lte: 3 },
      },
      select: { lessonId: true, word: true, lessonOrder: true },
      orderBy: { lessonOrder: 'asc' },
    });
    const previewBy = new Map<string, string[]>();
    for (const w of firstWords) {
      if (!w.lessonId) continue;
      const arr = previewBy.get(w.lessonId) ?? [];
      arr.push(w.word);
      previewBy.set(w.lessonId, arr);
    }

    const nodes: LessonNode[] = lessons.map((l) => {
      const agg = perLesson.get(l.id) ?? { learned: 0, started: 0, due: 0 };
      // "xong bài" = đã học qua tất cả từ trong bài ít nhất 1 lần (SRS lo phần ôn lại).
      const completed = l.wordCount > 0 && agg.started >= l.wordCount;
      const status: LessonStatus = completed
        ? 'COMPLETED'
        : agg.started > 0
          ? 'IN_PROGRESS'
          : 'AVAILABLE';
      return {
        id: l.id,
        orderIndex: l.orderIndex,
        title: l.title,
        wordCount: l.wordCount,
        learnedWords: agg.learned,
        startedWords: agg.started,
        dueWords: agg.due,
        status,
        previewWords: previewBy.get(l.id) ?? [],
      };
    });

    const totalLessonsBy = new Map(
      levelSummary.map((s) => [s.level, s._count]),
    );

    return {
      level: lvl,
      levelName: levelInfo.nameVi,
      band: levelBand(lvl),
      totalLessons: nodes.length,
      completedLessons: nodes.filter((n) => n.status === 'COMPLETED').length,
      currentLessonId:
        nodes.find((n) => n.status === 'IN_PROGRESS')?.id ??
        nodes.find((n) => n.status === 'AVAILABLE')?.id ??
        null,
      lessons: nodes,
      levels: [...totalLessonsBy.keys()].sort((a, b) => a - b),
    };
  }

  async lesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');

    const words = await this.prisma.word.findMany({
      where: { lessonId },
      orderBy: { lessonOrder: 'asc' },
    });
    const progress = await this.prisma.userWordProgress.findMany({
      where: { userId, wordId: { in: words.map((w) => w.id) } },
      select: { wordId: true, state: true, learnedAt: true, dueAt: true },
    });
    const pBy = new Map(progress.map((p) => [p.wordId, p]));

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        orderIndex: lesson.orderIndex,
        level: lesson.level,
        wordCount: lesson.wordCount,
      },
      words: words.map((w) => ({
        ...w,
        progressState: pBy.get(w.id)?.state ?? 'NEW',
        learnedAt: pBy.get(w.id)?.learnedAt ?? null,
      })),
    };
  }

  /**
   * Đánh dấu nhanh toàn bộ từ trong danh sách bài học là đã biết (SRS interval
   * dài, không phát sự kiện ReviewLog để tránh cày streak/xu khi bỏ qua bài).
   */
  private async markLessonsKnown(
    userId: string,
    lessonIds: readonly string[],
  ): Promise<{ completedLessons: number; skippedWords: number }> {
    const uniqueLessonIds = [...new Set(lessonIds)];
    if (!uniqueLessonIds.length) {
      return { completedLessons: 0, skippedWords: 0 };
    }

    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: uniqueLessonIds } },
      select: { id: true, level: true, wordCount: true },
    });
    const validLessonIds = lessons.map((l) => l.id);
    if (!validLessonIds.length) {
      return { completedLessons: 0, skippedWords: 0 };
    }

    const words = await this.prisma.word.findMany({
      where: { lessonId: { in: validLessonIds } },
      select: { id: true, level: true, lessonId: true },
    });

    const existing = words.length
      ? await this.prisma.userWordProgress.findMany({
          where: { userId, wordId: { in: words.map((w) => w.id) } },
          select: { wordId: true, learnedAt: true },
        })
      : [];
    const existingByWord = new Map(
      existing.map((p) => [p.wordId, p.learnedAt]),
    );

    const toCreate = words.filter((w) => !existingByWord.has(w.id));
    const toUpdateIds = words
      .filter((w) => {
        const learnedAt = existingByWord.get(w.id);
        return learnedAt === null;
      })
      .map((w) => w.id);

    const now = new Date();
    const dueAt = new Date(
      now.getTime() + FAST_TRACK_INTERVAL_DAYS * MS_PER_DAY,
    );

    await this.prisma.$transaction(async (tx) => {
      if (toCreate.length) {
        await tx.userWordProgress.createMany({
          data: toCreate.map((w) => ({
            userId,
            wordId: w.id,
            level: w.level,
            state: SrsState.REVIEW,
            reps: 1,
            lapses: 0,
            easeFactor: FAST_TRACK_EASE_FACTOR,
            intervalDays: FAST_TRACK_INTERVAL_DAYS,
            dueAt,
            lastReviewedAt: now,
            learnedAt: now,
          })),
          skipDuplicates: true,
        });
      }

      if (toUpdateIds.length) {
        await tx.userWordProgress.updateMany({
          where: { userId, wordId: { in: toUpdateIds }, learnedAt: null },
          data: {
            state: SrsState.REVIEW,
            easeFactor: FAST_TRACK_EASE_FACTOR,
            intervalDays: FAST_TRACK_INTERVAL_DAYS,
            dueAt,
            lastReviewedAt: now,
            learnedAt: now,
          },
        });
      }

      const existingLessonProg = await tx.userLessonProgress.findMany({
        where: { userId, lessonId: { in: validLessonIds } },
        select: { lessonId: true, startedAt: true, completedAt: true },
      });
      const progByLesson = new Map(
        existingLessonProg.map((p) => [p.lessonId, p]),
      );

      for (const lesson of lessons) {
        const prev = progByLesson.get(lesson.id);
        await tx.userLessonProgress.upsert({
          where: { userId_lessonId: { userId, lessonId: lesson.id } },
          create: {
            userId,
            lessonId: lesson.id,
            totalWords: lesson.wordCount,
            learnedWords: lesson.wordCount,
            startedAt: now,
            completedAt: now,
          },
          update: {
            totalWords: lesson.wordCount,
            learnedWords: lesson.wordCount,
            startedAt: prev?.startedAt ?? now,
            completedAt: prev?.completedAt ?? now,
          },
        });
      }
    });

    return {
      completedLessons: lessons.length,
      skippedWords: toCreate.length + toUpdateIds.length,
    };
  }

  async skipLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, level: true, orderIndex: true, wordCount: true },
    });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');

    const { skippedWords } = await this.markLessonsKnown(userId, [lesson.id]);
    const next = await this.prisma.lesson.findFirst({
      where: { level: lesson.level, orderIndex: { gt: lesson.orderIndex } },
      orderBy: { orderIndex: 'asc' },
      select: { id: true },
    });

    return {
      lessonId: lesson.id,
      skippedWords,
      totalWords: lesson.wordCount,
      nextLessonId: next?.id ?? null,
    };
  }

  async createFastTrackQuiz(userId: string, dto: FastTrackQuizDto) {
    const uniqueIds = [...new Set(dto.lessonIds)];
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, level: true, title: true },
    });
    if (!lessons.length) {
      throw new NotFoundException('Không tìm thấy bài học');
    }

    const levels = new Set(lessons.map((l) => l.level));
    if (levels.size !== 1) {
      throw new BadRequestException('Các bài học phải cùng một cấp độ');
    }
    const [level] = [...levels];
    const validLessonIds = lessons.map((l) => l.id);

    const words = await this.prisma.word.findMany({
      where: { lessonId: { in: validLessonIds }, meaningVi: { not: null } },
      select: {
        id: true,
        word: true,
        pronunciation: true,
        meaningVi: true,
      },
    });
    if (!words.length) {
      throw new BadRequestException(
        'Chưa đủ từ có nghĩa tiếng Việt để kiểm tra nhanh',
      );
    }

    const progress = await this.prisma.userWordProgress.findMany({
      where: { userId, wordId: { in: words.map((w) => w.id) } },
      select: { wordId: true, learnedAt: true },
    });
    const learnedIds = new Set(
      progress.filter((p) => p.learnedAt != null).map((p) => p.wordId),
    );

    const unstudied = shuffle(words.filter((w) => !learnedIds.has(w.id)));
    const studied = shuffle(words.filter((w) => learnedIds.has(w.id)));
    const picked = [...unstudied, ...studied].slice(
      0,
      Math.min(FAST_TRACK_QUIZ_SIZE, words.length),
    );

    let meaningSource = words.map((w) => w.meaningVi!);
    if (new Set(meaningSource).size < 4) {
      const extra = await this.prisma.word.findMany({
        where: { level, meaningVi: { not: null } },
        orderBy: { frequencyRank: 'asc' },
        select: { meaningVi: true },
        take: 24,
      });
      meaningSource = [
        ...meaningSource,
        ...extra.map((e) => e.meaningVi!).filter(Boolean),
      ];
    }

    const allMeanings = [...new Set(meaningSource)];
    if (allMeanings.length < 4) {
      throw new BadRequestException(
        'Chưa đủ từ có nghĩa tiếng Việt để kiểm tra nhanh',
      );
    }

    const questions = picked.map((w) => {
      const distractors = shuffle(
        allMeanings.filter((m) => m !== w.meaningVi),
      ).slice(0, 3);
      return {
        wordId: w.id,
        prompt: w.word,
        pronunciation: w.pronunciation,
        options: shuffle([w.meaningVi!, ...distractors]),
        answer: w.meaningVi!,
      };
    });

    const answerKey = Object.fromEntries(
      questions.map((q) => [q.wordId, q.answer]),
    );

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        totalQuestions: questions.length,
        format: {
          type: 'fast_track_topic',
          lessonIds: validLessonIds,
          answerKey,
        },
      },
    });

    return {
      attemptId: attempt.id,
      lessonIds: validLessonIds,
      passThresholdPct: FAST_TRACK_PASS_PCT,
      questions,
    };
  }

  async submitFastTrackQuiz(userId: string, dto: FastTrackSubmitDto) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: dto.attemptId },
    });
    if (!attempt || attempt.userId !== userId) {
      throw new NotFoundException('Không tìm thấy bài kiểm tra');
    }

    const format = attempt.format;
    if (
      !format ||
      typeof format !== 'object' ||
      Array.isArray(format) ||
      !('type' in format) ||
      format.type !== 'fast_track_topic' ||
      !('lessonIds' in format) ||
      !Array.isArray(format.lessonIds) ||
      !('answerKey' in format) ||
      !format.answerKey ||
      typeof format.answerKey !== 'object' ||
      Array.isArray(format.answerKey)
    ) {
      throw new BadRequestException('Bài kiểm tra vượt nhanh không hợp lệ');
    }

    if (attempt.completedAt) {
      throw new BadRequestException('Bài kiểm tra này đã được nộp');
    }

    const lessonIds = format.lessonIds.filter(
      (id): id is string => typeof id === 'string',
    );
    const answerKey = format.answerKey as Record<string, string>;

    const seen = new Set<string>();
    const gradedAnswers = dto.answers
      .filter((a) => {
        if (seen.has(a.wordId) || !(a.wordId in answerKey)) return false;
        seen.add(a.wordId);
        return true;
      })
      .map((a) => {
        const expected = answerKey[a.wordId];
        return {
          wordId: a.wordId,
          isCorrect: a.chosen === expected,
          chosen: a.chosen,
          correct: expected,
        };
      });

    const correctCount = gradedAnswers.filter((a) => a.isCorrect).length;
    const total = attempt.totalQuestions || gradedAnswers.length || 1;
    const scorePct = Math.round((correctCount / total) * 1000) / 10;
    const passed = scorePct >= FAST_TRACK_PASS_PCT;

    await this.prisma.$transaction([
      this.prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          completedAt: new Date(),
          totalQuestions: total,
          correctCount,
          scorePct,
        },
      }),
      this.prisma.quizAnswer.createMany({
        data: gradedAnswers.map((a) => ({
          quizAttemptId: attempt.id,
          ...a,
        })),
      }),
    ]);

    const outcome = passed
      ? await this.markLessonsKnown(userId, lessonIds)
      : { completedLessons: 0, skippedWords: 0 };

    return {
      passed,
      scorePct,
      correctCount,
      totalQuestions: total,
      passThresholdPct: FAST_TRACK_PASS_PCT,
      completedLessons: outcome.completedLessons,
      skippedWords: outcome.skippedWords,
    };
  }
}
