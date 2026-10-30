import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_DELAY_MS,
  parseEnrichOptions,
} from './enrich-options';

describe('parseEnrichOptions', () => {
  it('uses defaults when no flag is given', () => {
    expect(parseEnrichOptions([])).toEqual({
      limit: Number.POSITIVE_INFINITY,
      batchSize: DEFAULT_BATCH_SIZE,
      delayMs: DEFAULT_DELAY_MS,
    });
  });

  it('reads every flag', () => {
    expect(
      parseEnrichOptions(['--limit', '50', '--batch', '120', '--delay', '0']),
    ).toEqual({ limit: 50, batchSize: 120, delayMs: 0 });
  });

  it.each([
    [['--limit', '0']],
    [['--limit', 'abc']],
    [['--batch', '0']],
    [['--batch', '201']],
    [['--batch', '2.5']],
    [['--delay', '-1']],
    [['--delay']],
  ])('rejects %p', (argv) => {
    expect(() => parseEnrichOptions(argv)).toThrow();
  });
});
