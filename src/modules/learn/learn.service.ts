import { Injectable, NotFoundException } from '@nestjs/common';
import { SrsState } from '../../generated/prisma/client';
import { levelBand } from '../../common/levels';
import { PrismaService } from '../../infra/prisma/prisma.service';

const LEARNED_INTERVAL_DAYS = 21;

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

@Injectable()
export class LearnService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cấp học "hiện tại" = cấp thấp nhất chưa thuộc hết. */
  private async currentLevel(userId: string): Promise<number> {
    const [totals, learned] = await Promise.all([
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
    for (const t of totals) {
      if ((learnedBy.get(t.level) ?? 0) < t._count) return t.level;
    }
    return totals[0]?.level ?? 1;
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

    let prevCompleted = true;
    const nodes: LessonNode[] = lessons.map((l) => {
      const agg = perLesson.get(l.id) ?? { learned: 0, started: 0, due: 0 };
      // "xong bài" = đã học qua tất cả từ trong bài ít nhất 1 lần (SRS lo phần ôn lại).
      const completed = l.wordCount > 0 && agg.started >= l.wordCount;
      let status: LessonStatus;
      if (completed) status = 'COMPLETED';
      else if (agg.started > 0) status = 'IN_PROGRESS';
      else if (prevCompleted) status = 'AVAILABLE';
      else status = 'LOCKED';
      prevCompleted = completed;
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
}
