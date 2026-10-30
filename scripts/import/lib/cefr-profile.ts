import type { WordPos } from '../../../src/generated/prisma/client';
import { parseCsv } from './csv';
import { mapPos } from './pos-map';

/** CEFR band → Lingo level (1 Beginner … 6 Advanced). */
export const CEFR_TO_LEVEL: Readonly<Record<string, number>> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

const STARTS_WITH_LETTER = /^\p{L}/u;

export interface ProfileRow {
  word: string;
  pos: WordPos;
  level: number;
  source: string;
}

export interface MergedEntry {
  word: string;
  level: number;
  pos: WordPos[];
  sources: string[];
  /** 1-based, easiest level first then alphabetical. */
  frequencyRank: number;
}

/**
 * The profiles list spelling variants in one cell ("a.m./A.M./am/AM");
 * the first one is the canonical form.
 */
export function normalizeHeadword(raw: string): string {
  return raw.split('/')[0].trim().replace(/\s+/g, ' ');
}

/** Parses a profile CSV whose first three columns are headword, pos, CEFR. */
export function parseProfile(text: string, source: string): ProfileRow[] {
  const [header, ...rows] = parseCsv(text);
  const cols = header?.map((h) => h.trim().toLowerCase()) ?? [];
  const iWord = cols.indexOf('headword');
  const iPos = cols.indexOf('pos');
  const iCefr = cols.indexOf('cefr');
  if (iWord < 0 || iPos < 0 || iCefr < 0) {
    throw new Error(
      `${source}: thiếu cột headword/pos/CEFR (header: ${header?.join(',')})`,
    );
  }

  const out: ProfileRow[] = [];
  for (const r of rows) {
    const word = normalizeHeadword(r[iWord] ?? '');
    const level = CEFR_TO_LEVEL[(r[iCefr] ?? '').trim().toUpperCase()];
    // Contraction suffixes ("'m", "'re") are not words a learner studies alone.
    if (!STARTS_WITH_LETTER.test(word) || !level) continue;
    out.push({ word, pos: mapPos(r[iPos]), level, source });
  }
  return out;
}

function compareWords(a: string, b: string): number {
  return (
    a.localeCompare(b, 'en', { sensitivity: 'base' }) || (a < b ? -1 : 1)
  );
}

/**
 * One entry per headword: a word listed at several levels (one per sense or
 * part of speech) is taught at the easiest one, with every part of speech.
 */
export function mergeProfiles(rows: ProfileRow[]): MergedEntry[] {
  const byWord = new Map<
    string,
    { level: number; pos: Set<WordPos>; sources: Set<string> }
  >();
  for (const r of rows) {
    const e = byWord.get(r.word);
    if (!e) {
      byWord.set(r.word, {
        level: r.level,
        pos: new Set([r.pos]),
        sources: new Set([r.source]),
      });
      continue;
    }
    e.level = Math.min(e.level, r.level);
    e.pos.add(r.pos);
    e.sources.add(r.source);
  }

  return [...byWord.entries()]
    .map(([word, e]) => ({ word, ...e }))
    .sort((a, b) => a.level - b.level || compareWords(a.word, b.word))
    .map((e, i) => ({
      word: e.word,
      level: e.level,
      pos: [...e.pos],
      sources: [...e.sources],
      frequencyRank: i + 1,
    }));
}
