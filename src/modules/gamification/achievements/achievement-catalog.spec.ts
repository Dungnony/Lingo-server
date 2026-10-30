import { AchievementCategory } from '../../../generated/prisma/client';
import { LEVEL_COUNT } from '../../../common/levels';
import {
  ACHIEVEMENT_CATALOG,
  levelAchievementCode,
} from './achievement-catalog';

describe('ACHIEVEMENT_CATALOG', () => {
  it('has unique codes', () => {
    const codes = ACHIEVEMENT_CATALOG.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('has one completion badge per level, with the level as threshold', () => {
    const levelBadges = ACHIEVEMENT_CATALOG.filter(
      (a) => a.category === AchievementCategory.LEVEL,
    );
    expect(levelBadges).toHaveLength(LEVEL_COUNT);
    levelBadges.forEach((a, i) => {
      expect(a.code).toBe(levelAchievementCode(i + 1));
      expect(a.threshold).toBe(i + 1);
    });
  });
});

describe('levelAchievementCode', () => {
  it('embeds the level number', () => {
    expect(levelAchievementCode(3)).toBe('LEVEL3_COMPLETE');
  });
});
