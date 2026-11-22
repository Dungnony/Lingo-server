import { computePlacementLevel } from './placement.util';

describe('computePlacementLevel', () => {
  it('places user with 0/6 at level 1', () => {
    const res = computePlacementLevel([
      { level: 1, isCorrect: false },
      { level: 2, isCorrect: false },
      { level: 3, isCorrect: false },
      { level: 4, isCorrect: false },
      { level: 5, isCorrect: false },
      { level: 6, isCorrect: false },
    ]);
    expect(res).toEqual({ recommendedLevel: 1, correctCount: 0, total: 6 });
  });

  it('places user who clears levels 1..3 at level 3', () => {
    const res = computePlacementLevel([
      { level: 1, isCorrect: true },
      { level: 2, isCorrect: true },
      { level: 3, isCorrect: true },
      { level: 4, isCorrect: false },
      { level: 5, isCorrect: false },
      { level: 6, isCorrect: false },
    ]);
    expect(res).toEqual({ recommendedLevel: 3, correctCount: 3, total: 6 });
  });

  it('tolerates one slip and advances when cumulative hits support the level', () => {
    const res = computePlacementLevel([
      { level: 1, isCorrect: true },
      { level: 2, isCorrect: false },
      { level: 3, isCorrect: true },
      { level: 4, isCorrect: true },
      { level: 5, isCorrect: false },
      { level: 6, isCorrect: false },
    ]);
    expect(res).toEqual({ recommendedLevel: 4, correctCount: 3, total: 6 });
  });

  it('prevents a single lucky guess on level 6 from jumping to level 6', () => {
    const res = computePlacementLevel([
      { level: 1, isCorrect: false },
      { level: 2, isCorrect: false },
      { level: 3, isCorrect: false },
      { level: 4, isCorrect: false },
      { level: 5, isCorrect: false },
      { level: 6, isCorrect: true },
    ]);
    expect(res).toEqual({ recommendedLevel: 1, correctCount: 1, total: 6 });
  });

  it('places user with 6/6 at level 6', () => {
    const res = computePlacementLevel([
      { level: 1, isCorrect: true },
      { level: 2, isCorrect: true },
      { level: 3, isCorrect: true },
      { level: 4, isCorrect: true },
      { level: 5, isCorrect: true },
      { level: 6, isCorrect: true },
    ]);
    expect(res).toEqual({ recommendedLevel: 6, correctCount: 6, total: 6 });
  });
});
