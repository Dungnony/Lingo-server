export interface PracticeStats {
  totalAttempts: number;
  distinctWordsCount: number;
  correctCount: number;
  /** null when no attempt was graded (e.g. pronunciation recorded only). */
  accuracyPct: number | null;
}

/**
 * Aggregates practice attempts of one skill. Accuracy only counts graded
 * attempts: a pronunciation take recorded in a browser without speech
 * recognition is stored with `isCorrect = null` and must not drag it down.
 */
export function summarizeAttempts(
  rows: readonly { wordId: string; isCorrect: boolean | null }[],
): PracticeStats {
  const graded = rows.filter((r) => r.isCorrect !== null);
  const correctCount = graded.filter((r) => r.isCorrect).length;
  return {
    totalAttempts: rows.length,
    distinctWordsCount: new Set(rows.map((r) => r.wordId)).size,
    correctCount,
    accuracyPct:
      graded.length > 0
        ? Math.round((correctCount / graded.length) * 100)
        : null,
  };
}
