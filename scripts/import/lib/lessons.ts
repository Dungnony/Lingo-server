import { TOPIC_KEYS, TOPICS, type TopicKey } from './topics';

export const MAX_WORDS_PER_LESSON = 15;

export interface LessonPlacement {
  lessonIndex: number;
  lessonOrder: number;
  lessonTitle: string;
}

/**
 * Splits each level into lessons: words grouped by topic (in TOPICS order),
 * at most MAX_WORDS_PER_LESSON per lesson, keeping the input order (easiest
 * first) inside a topic. A topic that needs several lessons gets "(2)", "(3)"…
 * Returns placements aligned with `words`.
 */
export function assignLessons(
  words: readonly { level: number; topic: TopicKey }[],
): LessonPlacement[] {
  const placements: LessonPlacement[] = new Array<LessonPlacement>(
    words.length,
  );
  const levels = [...new Set(words.map((w) => w.level))].sort((a, b) => a - b);

  for (const level of levels) {
    let lessonIndex = 0;
    for (const topic of TOPIC_KEYS) {
      const members = words
        .map((w, i) => ({ w, i }))
        .filter(({ w }) => w.level === level && w.topic === topic);
      for (let start = 0; start < members.length; start += MAX_WORDS_PER_LESSON) {
        lessonIndex += 1;
        const part = start / MAX_WORDS_PER_LESSON + 1;
        const lessonTitle = part === 1 ? TOPICS[topic] : `${TOPICS[topic]} (${part})`;
        members
          .slice(start, start + MAX_WORDS_PER_LESSON)
          .forEach(({ i }, k) => {
            placements[i] = { lessonIndex, lessonOrder: k + 1, lessonTitle };
          });
      }
    }
  }
  return placements;
}
