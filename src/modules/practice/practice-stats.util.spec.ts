import { summarizeAttempts } from './practice-stats.util';

const row = (wordId: string, isCorrect: boolean | null) => ({
  wordId,
  isCorrect,
});

describe('summarizeAttempts', () => {
  it('counts attempts, distinct words and accuracy over graded rows', () => {
    expect(
      summarizeAttempts([
        row('a', true),
        row('a', false),
        row('b', true),
        row('c', true),
      ]),
    ).toEqual({
      totalAttempts: 4,
      distinctWordsCount: 3,
      correctCount: 3,
      accuracyPct: 75,
    });
  });

  it('ignores ungraded attempts (recorded without scoring) in accuracy', () => {
    expect(
      summarizeAttempts([row('a', null), row('b', true), row('c', false)]),
    ).toEqual({
      totalAttempts: 3,
      distinctWordsCount: 3,
      correctCount: 1,
      accuracyPct: 50,
    });
  });

  it('has no accuracy when nothing was graded', () => {
    expect(summarizeAttempts([row('a', null), row('a', null)])).toEqual({
      totalAttempts: 2,
      distinctWordsCount: 1,
      correctCount: 0,
      accuracyPct: null,
    });
    expect(summarizeAttempts([])).toEqual({
      totalAttempts: 0,
      distinctWordsCount: 0,
      correctCount: 0,
      accuracyPct: null,
    });
  });
});
