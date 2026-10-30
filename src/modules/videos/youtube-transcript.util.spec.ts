import { cleanCaptionText } from './youtube-transcript.util';

describe('cleanCaptionText', () => {
  it('decodes HTML entities, including double-encoded ones', () => {
    expect(cleanCaptionText('I&amp;#39;m &quot;fine&quot;')).toBe(
      'I\'m "fine"',
    );
  });

  it('drops sound cues and music notes', () => {
    expect(cleanCaptionText('[Music] ♪ hello (applause) world ♪')).toBe(
      'hello world',
    );
  });

  it('joins wrapped lines', () => {
    expect(cleanCaptionText('how are\n  you today?')).toBe(
      'how are you today?',
    );
  });

  it.each(['[Music]', '♪ ♪', '  ', '1 2 3', 'a'])(
    'returns null for %p',
    (raw) => {
      expect(cleanCaptionText(raw)).toBeNull();
    },
  );
});
