import { MAX_WORDS_PER_LESSON, assignLessons } from './lessons';
import type { TopicKey } from './topics';

const w = (level: number, topic: TopicKey) => ({ level, topic });

describe('assignLessons', () => {
  it('orders lessons by topic and restarts numbering per level', () => {
    const placements = assignLessons([
      w(1, 'food'),
      w(1, 'greetings'),
      w(2, 'food'),
      w(1, 'food'),
    ]);
    expect(placements).toEqual([
      { lessonIndex: 2, lessonOrder: 1, lessonTitle: 'Ăn uống' },
      { lessonIndex: 1, lessonOrder: 1, lessonTitle: 'Chào hỏi & giao tiếp' },
      { lessonIndex: 1, lessonOrder: 1, lessonTitle: 'Ăn uống' },
      { lessonIndex: 2, lessonOrder: 2, lessonTitle: 'Ăn uống' },
    ]);
  });

  it('splits a large topic into numbered lessons', () => {
    const words = Array.from({ length: MAX_WORDS_PER_LESSON + 2 }, () =>
      w(3, 'animals'),
    );
    const placements = assignLessons(words);
    expect(placements[0]).toEqual({
      lessonIndex: 1,
      lessonOrder: 1,
      lessonTitle: 'Động vật',
    });
    expect(placements[MAX_WORDS_PER_LESSON]).toEqual({
      lessonIndex: 2,
      lessonOrder: 1,
      lessonTitle: 'Động vật (2)',
    });
    expect(placements.at(-1)?.lessonOrder).toBe(2);
  });

  it('returns nothing for no words', () => {
    expect(assignLessons([])).toEqual([]);
  });
});
