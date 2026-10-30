import {
  LEVEL_COUNT,
  LEVELS,
  isValidLevel,
  levelBand,
  levelLabel,
} from './levels';

describe('levels', () => {
  it('lists every level from 1 to LEVEL_COUNT', () => {
    expect(LEVELS).toEqual([1, 2, 3, 4, 5, 6]);
    expect(LEVELS).toHaveLength(LEVEL_COUNT);
  });

  it('labels a level with its name', () => {
    expect(levelLabel(1)).toBe('Level 1 · Beginner');
    expect(levelLabel(6)).toBe('Level 6 · Advanced');
  });

  it('groups levels into bands of two', () => {
    expect(LEVELS.map(levelBand)).toEqual([
      'BEGINNER',
      'BEGINNER',
      'INTERMEDIATE',
      'INTERMEDIATE',
      'ADVANCED',
      'ADVANCED',
    ]);
  });

  it.each([0, 7, 2.5, Number.NaN])('rejects invalid level %p', (level) => {
    expect(isValidLevel(level)).toBe(false);
    expect(() => levelBand(level)).toThrow(RangeError);
    expect(() => levelLabel(level)).toThrow(RangeError);
  });
});
