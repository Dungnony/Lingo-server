const MIN_TERM_LENGTH = 3;
const MAX_TERMS = 8;
const ASCII_WORD = /^[a-z]+(?:['-][a-z]+)*$/;

/** Very common function words that would only add noise to a dictionary lookup. */
const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'are',
  'was',
  'were',
  'you',
  'this',
  'that',
  'with',
  'what',
  'how',
  'why',
  'from',
]);

/**
 * Picks the English-looking words of a (mostly Vietnamese) question so they
 * can be looked up in the vocabulary table. Tokens carrying Vietnamese
 * diacritics are ignored; longer tokens come first because they are the most
 * likely to be the word actually being asked about.
 */
export function extractEnglishTerms(message: string): string[] {
  // Split on whole words first: matching ASCII runs directly would cut
  // "khoảng" into "kho" and look that up.
  const tokens = message
    .toLowerCase()
    .split(/[^\p{L}'-]+/u)
    .map((t) => t.replace(/^['-]+|['-]+$/g, ''));
  const terms = new Set(
    tokens.filter(
      (t) =>
        ASCII_WORD.test(t) && t.length >= MIN_TERM_LENGTH && !STOPWORDS.has(t),
    ),
  );
  return [...terms].sort((a, b) => b.length - a.length).slice(0, MAX_TERMS);
}
