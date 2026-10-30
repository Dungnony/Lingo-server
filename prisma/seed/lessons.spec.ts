import { lessonKey, staleLessonIds } from './lessons';

describe('staleLessonIds', () => {
  const existing = [
    { id: 'a', level: 1, orderIndex: 1 },
    { id: 'b', level: 1, orderIndex: 86 },
    { id: 'c', level: 2, orderIndex: 1 },
  ];

  it('returns lessons the new seed no longer contains', () => {
    const keep = new Set([lessonKey(1, 1), lessonKey(2, 1)]);
    expect(staleLessonIds(existing, keep)).toEqual(['b']);
  });

  it('keeps everything when the seed still covers every lesson', () => {
    const keep = new Set(existing.map((l) => lessonKey(l.level, l.orderIndex)));
    expect(staleLessonIds(existing, keep)).toEqual([]);
  });

  it('treats the same order index on another level as a different lesson', () => {
    const keep = new Set([lessonKey(1, 1), lessonKey(1, 86)]);
    expect(staleLessonIds(existing, keep)).toEqual(['c']);
  });
});
