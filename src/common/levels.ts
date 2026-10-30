/** Lingo's 6 English levels. Level 1 is the easiest. */
export const LEVEL_COUNT = 6;

export const LEVELS: readonly number[] = Array.from(
  { length: LEVEL_COUNT },
  (_, i) => i + 1,
);

export const LEVEL_NAMES: Readonly<Record<number, string>> = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Pre-Intermediate',
  4: 'Intermediate',
  5: 'Upper-Intermediate',
  6: 'Advanced',
};

export type LevelBand = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export function isValidLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
}

function assertLevel(level: number): void {
  if (!isValidLevel(level)) {
    throw new RangeError(
      `Level must be an integer from 1 to ${LEVEL_COUNT}, got ${level}`,
    );
  }
}

/** "Level 3 · Pre-Intermediate" */
export function levelLabel(level: number): string {
  assertLevel(level);
  return `Level ${level} · ${LEVEL_NAMES[level]}`;
}

/** Bands group levels in pairs: 1–2, 3–4, 5–6. */
export function levelBand(level: number): LevelBand {
  assertLevel(level);
  if (level <= 2) return 'BEGINNER';
  if (level <= 4) return 'INTERMEDIATE';
  return 'ADVANCED';
}
