import { Injectable } from '@nestjs/common';
import { LEVEL_COUNT } from '../../common/levels';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { SubmitOnboardingDto } from './dto/onboarding.dto';
import { buildRecommendationVi } from './study-plan.util';

/** Pace assumed when the user has not set a daily goal yet. */
const DEFAULT_WORDS_PER_DAY = 20;

function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  get(userId: string) {
    return this.prisma.onboardingProfile.findUnique({ where: { userId } });
  }

  async placementQuiz() {
    const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1);
    const buckets = await Promise.all(
      levels.map((level) =>
        this.prisma.word.findMany({
          where: { level, meaningVi: { not: null } },
          orderBy: { frequencyRank: 'asc' },
          take: 30,
          select: {
            id: true,
            level: true,
            word: true,
            pronunciation: true,
            meaningVi: true,
          },
        }),
      ),
    );

    const allMeanings = [
      ...new Set(
        buckets
          .flat()
          .map((w) => w.meaningVi!)
          .filter(Boolean),
      ),
    ];

    const questions = buckets
      .map((words) => {
        if (!words.length) return null;
        const target = words[Math.floor(Math.random() * words.length)];
        const levelMeanings = [
          ...new Set(words.map((w) => w.meaningVi!).filter(Boolean)),
        ];
        const sameLevelDistractors = shuffle(
          levelMeanings.filter((m) => m !== target.meaningVi),
        );
        const fallbackDistractors = shuffle(
          allMeanings.filter(
            (m) => m !== target.meaningVi && !sameLevelDistractors.includes(m),
          ),
        );
        const distractors = [
          ...sameLevelDistractors,
          ...fallbackDistractors,
        ].slice(0, 3);
        if (distractors.length < 1 || !target.meaningVi) return null;

        return {
          wordId: target.id,
          level: target.level,
          prompt: target.word,
          pronunciation: target.pronunciation,
          options: shuffle([target.meaningVi, ...distractors]),
          answer: target.meaningVi,
        };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null)
      .sort((a, b) => a.level - b.level);

    return { questions };
  }

  async submit(userId: string, dto: SubmitOnboardingDto) {
    const recommendedLevel = dto.hasStudiedBefore ? dto.selfAssessedLevel! : 1;
    const recommendationVi = await this.buildRecommendation(
      userId,
      dto,
      recommendedLevel,
    );
    const targetDate = dto.targetDate ? new Date(dto.targetDate) : null;

    return this.prisma.onboardingProfile.upsert({
      where: { userId },
      create: {
        userId,
        hasStudiedBefore: dto.hasStudiedBefore,
        selfAssessedLevel: dto.selfAssessedLevel ?? null,
        goal: dto.goal,
        plansToTakeExam: dto.plansToTakeExam,
        targetLevel: dto.targetLevel ?? null,
        targetDate,
        recommendedLevel,
        recommendationVi,
      },
      update: {
        hasStudiedBefore: dto.hasStudiedBefore,
        selfAssessedLevel: dto.selfAssessedLevel ?? null,
        goal: dto.goal,
        plansToTakeExam: dto.plansToTakeExam,
        targetLevel: dto.targetLevel ?? null,
        targetDate,
        recommendedLevel,
        recommendationVi,
        completedAt: new Date(),
      },
    });
  }

  private async buildRecommendation(
    userId: string,
    dto: SubmitOnboardingDto,
    recommendedLevel: number,
  ): Promise<string> {
    const [wordCounts, settings] = await Promise.all([
      this.prisma.word.groupBy({ by: ['level'], _count: { _all: true } }),
      this.prisma.userSettings.findUnique({
        where: { userId },
        select: { dailyGoalValue: true },
      }),
    ]);

    return buildRecommendationVi({
      hasStudiedBefore: dto.hasStudiedBefore,
      selfAssessedLevel: dto.selfAssessedLevel,
      goal: dto.goal,
      plansToTakeExam: dto.plansToTakeExam,
      targetLevel: dto.targetLevel,
      targetDate: dto.targetDate,
      recommendedLevel,
      wordsPerLevel: new Map(wordCounts.map((c) => [c.level, c._count._all])),
      wordsPerDay: settings?.dailyGoalValue ?? DEFAULT_WORDS_PER_DAY,
      now: new Date(),
    });
  }
}
