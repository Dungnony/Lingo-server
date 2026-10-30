import { WordPos } from '../../../src/generated/prisma/client';
import {
  mergeProfiles,
  normalizeHeadword,
  parseProfile,
  type ProfileRow,
} from './cefr-profile';

describe('normalizeHeadword', () => {
  it('keeps the first spelling variant', () => {
    expect(normalizeHeadword('a.m./A.M./am/AM')).toBe('a.m.');
  });

  it('trims and collapses spaces', () => {
    expect(normalizeHeadword('  ice   cream ')).toBe('ice cream');
  });
});

describe('parseProfile', () => {
  it('maps CEFR bands to levels and skips unusable rows', () => {
    const csv = [
      'headword,pos,CEFR,notes',
      'abandon,verb,B1,',
      'exterior,noun,C1,',
      'batter,,C2,one who bats',
      ',noun,A1,',
      "'m,verb,A1,",
      'odd,adjective,Z9,',
    ].join('\n');
    expect(parseProfile(csv, 'test')).toEqual([
      { word: 'abandon', pos: WordPos.VERB, level: 3, source: 'test' },
      { word: 'exterior', pos: WordPos.NOUN, level: 5, source: 'test' },
      { word: 'batter', pos: WordPos.OTHER, level: 6, source: 'test' },
    ]);
  });

  it('fails clearly when a required column is missing', () => {
    expect(() => parseProfile('word,pos\nx,noun', 'bad.csv')).toThrow(
      /bad\.csv/,
    );
  });
});

describe('mergeProfiles', () => {
  const row = (
    word: string,
    level: number,
    pos: WordPos = WordPos.NOUN,
    source = 'cefrj',
  ): ProfileRow => ({ word, level, pos, source });

  it('keeps the easiest level and every part of speech of a headword', () => {
    const [entry] = mergeProfiles([
      row('back', 2, WordPos.NOUN),
      row('back', 1, WordPos.ADVERB),
      row('back', 5, WordPos.VERB, 'octanove'),
    ]);
    expect(entry).toEqual({
      word: 'back',
      level: 1,
      pos: [WordPos.NOUN, WordPos.ADVERB, WordPos.VERB],
      sources: ['cefrj', 'octanove'],
      frequencyRank: 1,
    });
  });

  it('ranks by level, then alphabetically ignoring case', () => {
    const merged = mergeProfiles([
      row('zoo', 1),
      row('Monday', 1),
      row('apple', 1),
      row('abroad', 2),
    ]);
    expect(merged.map((e) => [e.word, e.frequencyRank])).toEqual([
      ['apple', 1],
      ['Monday', 2],
      ['zoo', 3],
      ['abroad', 4],
    ]);
  });

  it('keeps differently-cased headwords apart', () => {
    const merged = mergeProfiles([row('may', 1), row('May', 1)]);
    expect(merged.map((e) => e.word)).toEqual(['May', 'may']);
  });
});
