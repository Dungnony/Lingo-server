import type { PracticeAttemptedPayload } from '../../events/events';
import type { AchievementsService } from './achievements/achievements.service';
import {
  GamificationListener,
  MAX_PRACTICE_CREDIT_MS,
} from './gamification.listener';
import type { StreakService } from './streak/streak.service';

describe('GamificationListener.onPracticeAttempted', () => {
  const at = '2026-10-17T08:00:00.000Z';
  const payload: PracticeAttemptedPayload = {
    userId: 'u1',
    wordId: 'w1',
    skill: 'PRONUNCIATION',
    isCorrect: null,
    at,
  };
  let recordActivity: jest.Mock;
  let listener: GamificationListener;

  beforeEach(() => {
    recordActivity = jest.fn().mockResolvedValue(undefined);
    listener = new GamificationListener(
      { recordActivity } as unknown as StreakService,
      {} as AchievementsService,
    );
  });

  it('counts a practised word toward the streak and the daily word goal', async () => {
    await listener.onPracticeAttempted(payload);
    expect(recordActivity).toHaveBeenCalledWith('u1', new Date(at), {
      wordsReviewed: 1,
      minutesStudied: 0,
    });
  });

  it('counts the time spent toward a minutes goal', async () => {
    await listener.onPracticeAttempted({ ...payload, durationMs: 90_000 });
    expect(recordActivity).toHaveBeenCalledWith('u1', new Date(at), {
      wordsReviewed: 1,
      minutesStudied: 1.5,
    });
  });

  it('caps one attempt so an idle open tab cannot fill the minutes goal', async () => {
    await listener.onPracticeAttempted({ ...payload, durationMs: 600_000 });
    expect(recordActivity).toHaveBeenCalledWith('u1', new Date(at), {
      wordsReviewed: 1,
      minutesStudied: MAX_PRACTICE_CREDIT_MS / 60_000,
    });
  });

  it('counts ungraded and wrong attempts too, since practice is effort', async () => {
    await listener.onPracticeAttempted({ ...payload, isCorrect: false });
    expect(recordActivity).toHaveBeenCalledTimes(1);
  });

  it('never throws when recording fails (event handlers are fire-and-forget)', async () => {
    recordActivity.mockRejectedValue(new Error('db down'));
    await expect(
      listener.onPracticeAttempted(payload),
    ).resolves.toBeUndefined();
  });
});
