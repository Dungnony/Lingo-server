import {
  buildCheckPrompt,
  MAX_FLAG_LENGTH,
  parseCheckOptions,
  parseCheckResults,
  type CheckEntry,
} from './word-check';

const ENTRY: CheckEntry = {
  word: 'bank',
  pos: ['NOUN'],
  level: 1,
  ipa: '/bæŋk/',
  meaningVi: 'ngân hàng',
  meaningEn: 'a place that keeps money',
  exampleEn: 'I went to the bank.',
  exampleVi: 'Tôi đã đến ngân hàng.',
};

describe('parseCheckOptions', () => {
  it('defaults to every unchecked word at any level', () => {
    const o = parseCheckOptions([]);
    expect(o.level).toBeUndefined();
    expect(o.recheck).toBe(false);
    expect(o.limit).toBe(Number.POSITIVE_INFINITY);
  });

  it('reads level, recheck and the shared limit/batch/delay flags', () => {
    expect(
      parseCheckOptions(['--level', '2', '--recheck', '--batch', '50']),
    ).toMatchObject({ level: 2, recheck: true, batchSize: 50 });
  });

  it('rejects a level outside 1..LEVEL_COUNT', () => {
    expect(() => parseCheckOptions(['--level', '7'])).toThrow('--level');
  });
});

describe('buildCheckPrompt', () => {
  it('numbers entries and includes every field to check', () => {
    const prompt = buildCheckPrompt([ENTRY, { ...ENTRY, word: 'run' }]);
    expect(prompt).toContain('"k":"1"');
    expect(prompt).toContain('"k":"2"');
    for (const text of ['bank', '/bæŋk/', 'ngân hàng', 'I went to the bank.']) {
      expect(prompt).toContain(text);
    }
  });
});

describe('parseCheckResults', () => {
  it('maps each numbered answer to no flag (ok) or the issue text', () => {
    const results = parseCheckResults(
      [
        { k: '1', ok: true, issue: '' },
        { k: '2', ok: false, issue: '  Nghĩa sai: phải là "bờ sông"  ' },
      ],
      2,
    );
    expect(results).toEqual(
      new Map<number, string | null>([
        [0, null],
        [1, 'Nghĩa sai: phải là "bờ sông"'],
      ]),
    );
  });

  it('skips malformed, unknown or duplicate answers so they are retried', () => {
    const results = parseCheckResults(
      [
        { k: '9', ok: true },
        { k: '1', ok: 'yes' },
        { k: '2', ok: false, issue: '   ' },
        null,
        { k: '3', ok: true },
        { k: '3', ok: false, issue: 'ignored duplicate' },
      ],
      3,
    );
    expect(results).toEqual(new Map([[2, null]]));
  });

  it('caps an issue at the column size', () => {
    const results = parseCheckResults(
      [{ k: '1', ok: false, issue: 'x'.repeat(MAX_FLAG_LENGTH + 50) }],
      1,
    );
    expect(results.get(0)).toHaveLength(MAX_FLAG_LENGTH);
  });
});
