import { parseTranscript } from './transcript.util';

describe('parseTranscript', () => {
  it('reads timestamps, English text and the Vietnamese translation', () => {
    const lines = parseTranscript(
      '[00:05] Hello there! | Xin chào!\n[1:02:03] See you soon.',
    );
    expect(lines).toEqual([
      { index: 1, startMs: 5_000, en: 'Hello there!', vi: 'Xin chào!' },
      { index: 2, startMs: 3_723_000, en: 'See you soon.', vi: null },
    ]);
  });

  it('keeps dashes inside English sentences', () => {
    const [line] = parseTranscript('It was cold — very cold — outside.');
    expect(line.en).toBe('It was cold — very cold — outside.');
    expect(line.vi).toBeNull();
  });

  it('accepts the full-width pipe separator', () => {
    const [line] = parseTranscript('Good night ｜ Chúc ngủ ngon');
    expect(line).toMatchObject({ en: 'Good night', vi: 'Chúc ngủ ngon' });
  });

  it('skips blank lines and lines without English text', () => {
    const lines = parseTranscript('\n   \n | chỉ có bản dịch\nOK');
    expect(lines.map((l) => l.en)).toEqual(['OK']);
    expect(lines[0].index).toBe(1);
  });
});
