import { lookupCandidates } from './words.service';

describe('lookupCandidates', () => {
  it('includes the original word and singular base forms', () => {
    expect(lookupCandidates('books')).toContain('book');
    expect(lookupCandidates('boxes')).toContain('box');
    expect(lookupCandidates('studies')).toContain('study');
  });

  it('derives base forms for past tense and -ing forms', () => {
    expect(lookupCandidates('studied')).toContain('study');
    expect(lookupCandidates('stopped')).toContain('stop');
    expect(lookupCandidates('making')).toContain('make');
    expect(lookupCandidates('running')).toContain('run');
  });

  it('derives adjective base forms for -ly adverbs', () => {
    expect(lookupCandidates('quickly')).toContain('quick');
    expect(lookupCandidates('happily')).toContain('happy');
  });
});
