import { WordPos } from '../../../src/generated/prisma/client';
import { mapPos } from './pos-map';

describe('mapPos', () => {
  it.each([
    ['noun', WordPos.NOUN],
    ['Verb', WordPos.VERB],
    ['modal auxiliary', WordPos.VERB],
    ['be-verb', WordPos.VERB],
    ['number', WordPos.NUMERAL],
    ['determiner', WordPos.DETERMINER],
    [' adverb ', WordPos.ADVERB],
  ])('maps %p', (raw, expected) => {
    expect(mapPos(raw)).toBe(expected);
  });

  it.each(['', null, undefined, 'infinitive-to'])(
    'falls back to OTHER for %p',
    (raw) => {
      expect(mapPos(raw)).toBe(WordPos.OTHER);
    },
  );
});
