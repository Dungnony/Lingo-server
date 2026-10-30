import { extractEnglishTerms } from './english-terms.util';

describe('extractEnglishTerms', () => {
  it('finds English words inside a Vietnamese question', () => {
    expect(extractEnglishTerms('Từ "Beautiful" nghĩa là gì?')).toEqual([
      'beautiful',
    ]);
  });

  it('keeps apostrophes and hyphens inside words', () => {
    expect(extractEnglishTerms("Khác nhau giữa don't và well-known?")).toEqual([
      'well-known',
      "don't",
      'nhau',
    ]);
  });

  it('ignores stopwords, short tokens and duplicates', () => {
    expect(extractEnglishTerms('the cat and the CAT is on a mat')).toEqual([
      'cat',
      'mat',
    ]);
  });

  it('skips whole words carrying Vietnamese diacritics', () => {
    // "khoảng" must not leak "kho"; plain-ASCII Vietnamese words still pass
    // and simply find no match in the vocabulary table.
    expect(extractEnglishTerms('Học khoảng thế nào cho nhanh')).toEqual([
      'nhanh',
      'cho',
    ]);
  });

  it('returns at most 8 terms, longest first', () => {
    const terms = extractEnglishTerms(
      'one two three four five sixsix seven eight nine tenten',
    );
    expect(terms).toHaveLength(8);
    expect(terms[0]).toBe('sixsix');
  });
});
