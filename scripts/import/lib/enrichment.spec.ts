import { validateEnrichment } from './enrichment';

const VALID = {
  word: 'apple',
  ipa: '/ˈæp.əl/',
  meaningVi: 'quả táo',
  meaningEn: 'a round fruit with red or green skin',
  exampleEn: 'She eats an apple every day.',
  exampleVi: 'Cô ấy ăn một quả táo mỗi ngày.',
  topic: 'food',
};

describe('validateEnrichment', () => {
  it('accepts a complete item', () => {
    expect(validateEnrichment(VALID, 'apple')).toEqual({
      ipa: '/ˈæp.əl/',
      meaningVi: 'quả táo',
      meaningEn: 'a round fruit with red or green skin',
      exampleEn: 'She eats an apple every day.',
      exampleVi: 'Cô ấy ăn một quả táo mỗi ngày.',
      topic: 'food',
    });
  });

  it.each(['ˈæp.əl', '[ˈæp.əl]', ' /ˈæp.əl/ '])(
    'normalises IPA %p to slashes',
    (ipa) => {
      expect(validateEnrichment({ ...VALID, ipa }, 'apple')?.ipa).toBe(
        '/ˈæp.əl/',
      );
    },
  );

  it('collapses whitespace in text fields', () => {
    const result = validateEnrichment(
      { ...VALID, meaningVi: '  quả\n táo ' },
      'apple',
    );
    expect(result?.meaningVi).toBe('quả táo');
  });

  it.each([
    ['another word', { ...VALID, word: 'banana' }],
    ['an unknown topic', { ...VALID, topic: 'cooking' }],
    ['an inherited property as topic', { ...VALID, topic: 'toString' }],
    ['an empty meaning', { ...VALID, meaningVi: '  ' }],
    ['a missing example', { ...VALID, exampleEn: undefined }],
    ['an empty IPA', { ...VALID, ipa: '//' }],
    ['an overlong field', { ...VALID, meaningEn: 'x'.repeat(301) }],
    ['a non-object', 'apple'],
    ['null', null],
  ])('rejects %s', (_label, item) => {
    expect(validateEnrichment(item, 'apple')).toBeNull();
  });
});
