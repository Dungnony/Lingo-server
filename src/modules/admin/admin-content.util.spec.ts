import { VideoKind } from '../../generated/prisma/client';
import {
  blankToNull,
  grammarCreateData,
  grammarUpdateData,
  reviewDecision,
  videoUpdateData,
  wordUpdateData,
} from './admin-content.util';

describe('admin content helpers', () => {
  it('keeps unsent fields undefined and turns blanks into null', () => {
    expect(blankToNull(undefined)).toBeUndefined();
    expect(blankToNull('   ')).toBeNull();
    expect(blankToNull('  /həˈloʊ/ ')).toBe('/həˈloʊ/');
  });

  it('builds a word update that only touches sent fields', () => {
    expect(wordUpdateData({ word: ' hello ', meaningEn: '' })).toEqual({
      word: 'hello',
      pronunciation: undefined,
      meaningVi: undefined,
      meaningEn: null,
    });
  });

  describe('reviewDecision', () => {
    it('marks a word reviewed when its content is edited', () => {
      expect(reviewDecision({ meaningVi: 'quả táo' })).toBe('review');
      expect(reviewDecision({ example: { en: 'I eat.' } })).toBe('review');
    });

    it('marks a word reviewed when approved as is', () => {
      expect(reviewDecision({ reviewed: true })).toBe('review');
    });

    it('lets an admin undo an approval, even while editing', () => {
      expect(reviewDecision({ reviewed: false })).toBe('unreview');
      expect(reviewDecision({ meaningVi: 'x', reviewed: false })).toBe(
        'unreview',
      );
    });

    it('leaves the status alone when nothing is sent', () => {
      expect(reviewDecision({})).toBe('keep');
    });
  });

  it('trims grammar text, drops empty patterns and plain-copies examples', () => {
    const data = grammarCreateData(
      {
        slug: 'present-simple',
        level: 1,
        titleVi: ' Thì hiện tại đơn ',
        titleEn: 'Present Simple',
        summaryVi: 'Tóm tắt',
        explanationVi: 'Giải thích',
        patterns: ['S + V(s/es)', '  '],
        examples: [{ en: ' I go. ', vi: ' Tôi đi. ' }],
      },
      7,
    );
    expect(data).toMatchObject({
      slug: 'present-simple',
      orderIndex: 7,
      titleVi: 'Thì hiện tại đơn',
      patterns: ['S + V(s/es)'],
      examples: [{ en: 'I go.', vi: 'Tôi đi.' }],
    });
  });

  it('leaves grammar fields that were not sent undefined', () => {
    const data = grammarUpdateData({ level: 2 });
    expect(data.level).toBe(2);
    expect(data.patterns).toBeUndefined();
    expect(data.examples).toBeUndefined();
  });

  it('builds a video update and clears an empty English title', () => {
    expect(
      videoUpdateData({
        title: ' Tin tức ',
        titleEn: '',
        kind: VideoKind.NEWS,
      }),
    ).toEqual({
      title: 'Tin tức',
      titleEn: null,
      level: undefined,
      kind: VideoKind.NEWS,
    });
  });
});
