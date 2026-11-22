import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import { LearnService } from './learn.service';

function makePrisma() {
  const models = {
    onboardingProfile: { findUnique: jest.fn() },
    word: { groupBy: jest.fn(), findMany: jest.fn() },
    userWordProgress: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
    },
    englishLevel: { findUnique: jest.fn() },
    lesson: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      groupBy: jest.fn(),
    },
    userLessonProgress: { findMany: jest.fn(), upsert: jest.fn() },
    quizAttempt: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    quizAnswer: { createMany: jest.fn() },
  };
  return {
    ...models,
    $transaction: jest.fn(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: typeof models) => Promise<unknown>)(models);
      }
      return Promise.all(arg as Promise<unknown>[]);
    }),
  };
}

describe('LearnService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: LearnService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new LearnService(prisma as unknown as PrismaService);
  });

  it('honors OnboardingProfile.recommendedLevel when level is omitted', async () => {
    prisma.onboardingProfile.findUnique.mockResolvedValue({
      recommendedLevel: 3,
    });
    prisma.word.groupBy.mockResolvedValue([
      { level: 1, _count: 100 },
      { level: 2, _count: 100 },
      { level: 3, _count: 200 },
    ]);
    prisma.userWordProgress.groupBy.mockResolvedValue([]);
    prisma.englishLevel.findUnique.mockResolvedValue({
      level: 3,
      nameVi: 'Trung cấp',
    });
    prisma.lesson.findMany.mockResolvedValue([
      { id: 'l3-1', orderIndex: 1, title: 'Chủ đề 3', wordCount: 10 },
    ]);
    prisma.userWordProgress.findMany.mockResolvedValue([]);
    prisma.lesson.groupBy.mockResolvedValue([
      { level: 1, _count: 10 },
      { level: 3, _count: 20 },
    ]);
    prisma.word.findMany.mockResolvedValue([]);

    const res = await service.path('u1');

    expect(res.level).toBe(3);
    expect(prisma.englishLevel.findUnique).toHaveBeenCalledWith({
      where: { level: 3 },
    });
  });

  it('marks all unstarted lessons as AVAILABLE (never LOCKED) even when lesson 1 is incomplete', async () => {
    prisma.englishLevel.findUnique.mockResolvedValue({
      level: 1,
      nameVi: 'Sơ cấp',
    });
    prisma.lesson.findMany.mockResolvedValue([
      { id: 'l1', orderIndex: 1, title: 'Chào hỏi', wordCount: 15 },
      { id: 'l2', orderIndex: 2, title: 'Gia đình', wordCount: 15 },
      { id: 'l3', orderIndex: 3, title: 'Đồ ăn', wordCount: 15 },
    ]);
    prisma.userWordProgress.findMany.mockResolvedValue([
      {
        wordId: 'w1',
        state: 'LEARNING',
        learnedAt: null,
        intervalDays: 1,
        dueAt: null,
        isSuspended: false,
        word: { lessonId: 'l1' },
      },
    ]);
    prisma.lesson.groupBy.mockResolvedValue([{ level: 1, _count: 3 }]);
    prisma.word.findMany.mockResolvedValue([
      { lessonId: 'l1', word: 'hello', lessonOrder: 1 },
      { lessonId: 'l2', word: 'mother', lessonOrder: 1 },
      { lessonId: 'l3', word: 'apple', lessonOrder: 1 },
    ]);

    const res = await service.path('u1', 1);

    expect(res.lessons.map((l) => l.status)).toEqual([
      'IN_PROGRESS',
      'AVAILABLE',
      'AVAILABLE',
    ]);
    expect(res.lessons.some((l) => l.status === 'LOCKED')).toBe(false);
  });

  it('skipLesson batches createMany + updateMany and returns nextLessonId', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: 'l1',
      level: 1,
      orderIndex: 1,
      wordCount: 3,
    });
    prisma.lesson.findMany.mockResolvedValue([
      { id: 'l1', level: 1, wordCount: 3 },
    ]);
    prisma.word.findMany.mockResolvedValue([
      { id: 'w1', level: 1, lessonId: 'l1' },
      { id: 'w2', level: 1, lessonId: 'l1' },
      { id: 'w3', level: 1, lessonId: 'l1' },
    ]);
    prisma.userWordProgress.findMany.mockResolvedValue([
      { wordId: 'w1', learnedAt: null },
      { wordId: 'w2', learnedAt: new Date('2026-01-01T00:00:00Z') },
    ]);
    prisma.userLessonProgress.findMany.mockResolvedValue([]);
    prisma.lesson.findFirst.mockResolvedValue({ id: 'l2' });

    const res = await service.skipLesson('u1', 'l1');

    expect(prisma.userWordProgress.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.userWordProgress.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ userId: 'u1', wordId: 'w3' })],
        skipDuplicates: true,
      }),
    );
    expect(prisma.userWordProgress.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.userWordProgress.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', wordId: { in: ['w1'] }, learnedAt: null },
      }),
    );
    expect(prisma.userLessonProgress.upsert).toHaveBeenCalledTimes(1);
    expect(res).toEqual({
      lessonId: 'l1',
      skippedWords: 2,
      totalWords: 3,
      nextLessonId: 'l2',
    });
  });

  it('createFastTrackQuiz generates up to 5 questions with 4 unique options including the answer', async () => {
    const words = Array.from({ length: 7 }, (_, i) => ({
      id: `w${i + 1}`,
      word: `word${i + 1}`,
      pronunciation: `/w${i + 1}/`,
      meaningVi: `nghĩa ${i + 1}`,
    }));
    prisma.lesson.findMany.mockResolvedValue([
      { id: 'l1', level: 1, title: 'Chào hỏi' },
      { id: 'l2', level: 1, title: 'Chào hỏi (2)' },
    ]);
    prisma.word.findMany.mockResolvedValue(words);
    prisma.userWordProgress.findMany.mockResolvedValue([]);
    prisma.quizAttempt.create.mockResolvedValue({ id: 'attempt-1' });

    const res = await service.createFastTrackQuiz('u1', {
      lessonIds: ['l1', 'l2'],
    });

    expect(res.attemptId).toBe('attempt-1');
    expect(res.passThresholdPct).toBe(80);
    expect(res.questions).toHaveLength(5);
    for (const q of res.questions) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
    }
  });

  it('submitFastTrackQuiz marks lessons known when scorePct >= 80 and skips marking when < 80', async () => {
    const answerKey = {
      w1: 'a1',
      w2: 'a2',
      w3: 'a3',
      w4: 'a4',
      w5: 'a5',
    };
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: 'attempt-pass',
      userId: 'u1',
      totalQuestions: 5,
      completedAt: null,
      format: {
        type: 'fast_track_topic',
        lessonIds: ['l1', 'l2'],
        answerKey,
      },
    });
    prisma.quizAttempt.update.mockResolvedValue({});
    prisma.quizAnswer.createMany.mockResolvedValue({ count: 5 });
    prisma.lesson.findMany.mockResolvedValue([
      { id: 'l1', level: 1, wordCount: 2 },
      { id: 'l2', level: 1, wordCount: 2 },
    ]);
    prisma.word.findMany.mockResolvedValue([
      { id: 'w1', level: 1, lessonId: 'l1' },
      { id: 'w2', level: 1, lessonId: 'l2' },
    ]);
    prisma.userWordProgress.findMany.mockResolvedValue([]);
    prisma.userLessonProgress.findMany.mockResolvedValue([]);

    const passRes = await service.submitFastTrackQuiz('u1', {
      attemptId: 'attempt-pass',
      answers: [
        { wordId: 'w1', chosen: 'a1' },
        { wordId: 'w2', chosen: 'a2' },
        { wordId: 'w3', chosen: 'a3' },
        { wordId: 'w4', chosen: 'a4' },
        { wordId: 'w5', chosen: 'wrong' },
      ],
    });

    expect(passRes).toEqual({
      passed: true,
      scorePct: 80,
      correctCount: 4,
      totalQuestions: 5,
      passThresholdPct: 80,
      completedLessons: 2,
      skippedWords: 2,
    });
    expect(prisma.userWordProgress.createMany).toHaveBeenCalledTimes(1);

    // Fail case: 3/5 = 60% < 80%
    prisma.userWordProgress.createMany.mockClear();
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: 'attempt-fail',
      userId: 'u1',
      totalQuestions: 5,
      completedAt: null,
      format: {
        type: 'fast_track_topic',
        lessonIds: ['l1', 'l2'],
        answerKey,
      },
    });

    const failRes = await service.submitFastTrackQuiz('u1', {
      attemptId: 'attempt-fail',
      answers: [
        { wordId: 'w1', chosen: 'a1' },
        { wordId: 'w2', chosen: 'a2' },
        { wordId: 'w3', chosen: 'a3' },
        { wordId: 'w4', chosen: 'wrong' },
        { wordId: 'w5', chosen: 'wrong' },
      ],
    });

    expect(failRes).toEqual({
      passed: false,
      scorePct: 60,
      correctCount: 3,
      totalQuestions: 5,
      passThresholdPct: 80,
      completedLessons: 0,
      skippedWords: 0,
    });
    expect(prisma.userWordProgress.createMany).not.toHaveBeenCalled();

    // Rejects mismatched or already completed attempt
    prisma.quizAttempt.findUnique.mockResolvedValue({
      id: 'attempt-done',
      userId: 'u1',
      totalQuestions: 5,
      completedAt: new Date(),
      format: { type: 'fast_track_topic', lessonIds: ['l1'], answerKey },
    });
    await expect(
      service.submitFastTrackQuiz('u1', {
        attemptId: 'attempt-done',
        answers: [{ wordId: 'w1', chosen: 'a1' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
