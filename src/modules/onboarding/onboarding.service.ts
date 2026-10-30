import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { SubmitOnboardingDto } from './dto/onboarding.dto';
import { buildRecommendationVi } from './study-plan.util';

/** Pace assumed when the user has not set a daily goal yet. */
const DEFAULT_WORDS_PER_DAY = 20;

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  get(userId: string) {
    return this.prisma.onboardingProfile.findUnique({ where: { userId } });
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
