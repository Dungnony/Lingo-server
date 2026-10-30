import { WordPos } from '../../../src/generated/prisma/client';

/** Part-of-speech labels used by the CEFR-J / Octanove vocabulary profiles. */
const MAP: Record<string, WordPos> = {
  noun: WordPos.NOUN,
  verb: WordPos.VERB,
  'be-verb': WordPos.VERB,
  'do-verb': WordPos.VERB,
  'have-verb': WordPos.VERB,
  'modal auxiliary': WordPos.VERB,
  adjective: WordPos.ADJECTIVE,
  adverb: WordPos.ADVERB,
  pronoun: WordPos.PRONOUN,
  number: WordPos.NUMERAL,
  conjunction: WordPos.CONJUNCTION,
  preposition: WordPos.PREPOSITION,
  determiner: WordPos.DETERMINER,
  article: WordPos.ARTICLE,
  interjection: WordPos.INTERJECTION,
};

/** Unknown or empty labels map to OTHER so no word is dropped. */
export function mapPos(raw: string | undefined | null): WordPos {
  return MAP[(raw ?? '').trim().toLowerCase()] ?? WordPos.OTHER;
}
