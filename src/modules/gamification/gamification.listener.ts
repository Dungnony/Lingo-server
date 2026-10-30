import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AppEvent,
  type LevelCompletedPayload,
  type PracticeAttemptedPayload,
  type StreakUpdatedPayload,
  type WordReviewedPayload,
} from '../../events/events';
import { AchievementsService } from './achievements/achievements.service';
import { StreakService } from './streak/streak.service';

/** One practised word counts like one reviewed flashcard. */
const PRACTICE_WORDS_CREDIT = 1;
/** Longest time one practice attempt can add to a minutes goal, so a tab
 * left open between attempts does not count as study time. */
export const MAX_PRACTICE_CREDIT_MS = 120_000;
const MS_PER_MINUTE = 60_000;

@Injectable()
export class GamificationListener {
  private readonly logger = new Logger(GamificationListener.name);

  constructor(
    private readonly streak: StreakService,
    private readonly achievements: AchievementsService,
  ) {}

  @OnEvent(AppEvent.WordReviewed, { async: true })
  async onWordReviewed(p: WordReviewedPayload): Promise<void> {
    try {
      await this.streak.recordActivity(p.userId, new Date(p.at), {
        wordsReviewed: 1,
        wordsLearned: p.becameLearned ? 1 : 0,
        minutesStudied: p.durationMs ? p.durationMs / 60_000 : 0,
      });
      await this.achievements.onWordReviewed(p.userId);
    } catch (err) {
      this.logger.error(`onWordReviewed: ${(err as Error).message}`);
    }
  }

  /** Listening, pronunciation and dictation practice keep the streak alive and
   * count toward the daily goal: one word for a WORDS goal, the time spent
   * (capped) for a MINUTES goal. */
  @OnEvent(AppEvent.PracticeAttempted, { async: true })
  async onPracticeAttempted(p: PracticeAttemptedPayload): Promise<void> {
    const creditedMs = Math.min(p.durationMs ?? 0, MAX_PRACTICE_CREDIT_MS);
    try {
      await this.streak.recordActivity(p.userId, new Date(p.at), {
        wordsReviewed: PRACTICE_WORDS_CREDIT,
        minutesStudied: creditedMs / MS_PER_MINUTE,
      });
    } catch (err) {
      this.logger.error(`onPracticeAttempted: ${(err as Error).message}`);
    }
  }

  @OnEvent(AppEvent.StreakUpdated, { async: true })
  async onStreakUpdated(p: StreakUpdatedPayload): Promise<void> {
    try {
      await this.achievements.onStreakUpdated(p.userId, p.currentStreak);
    } catch (err) {
      this.logger.error(`onStreakUpdated: ${(err as Error).message}`);
    }
  }

  @OnEvent(AppEvent.LevelCompleted, { async: true })
  async onLevelCompleted(p: LevelCompletedPayload): Promise<void> {
    try {
      await this.achievements.onLevelCompleted(p.userId, p.level);
    } catch (err) {
      this.logger.error(`onLevelCompleted: ${(err as Error).message}`);
    }
  }
}
