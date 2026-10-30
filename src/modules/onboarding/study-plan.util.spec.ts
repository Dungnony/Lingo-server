import {
  buildRecommendationVi,
  cumulativeWords,
  type StudyPlanInput,
} from './study-plan.util';

const WORDS_PER_LEVEL = new Map([
  [1, 100],
  [2, 200],
  [3, 300],
]);
const NOW = new Date('2026-01-01T00:00:00Z');

function input(overrides: Partial<StudyPlanInput> = {}): StudyPlanInput {
  return {
    hasStudiedBefore: false,
    goal: 'TRAVEL',
    plansToTakeExam: false,
    recommendedLevel: 1,
    wordsPerLevel: WORDS_PER_LEVEL,
    wordsPerDay: 10,
    now: NOW,
    ...overrides,
  };
}

describe('cumulativeWords', () => {
  it('sums every level up to and including the given one', () => {
    expect(cumulativeWords(WORDS_PER_LEVEL, 1)).toBe(100);
    expect(cumulativeWords(WORDS_PER_LEVEL, 3)).toBe(600);
    expect(cumulativeWords(new Map(), 3)).toBe(0);
  });
});

describe('buildRecommendationVi', () => {
  it('recommends level 1 without an estimate when there is no target', () => {
    const text = buildRecommendationVi(input());
    expect(text).toContain('chưa học tiếng Anh');
    expect(text).toContain('bắt đầu học từ Level 1 · Beginner');
    expect(text).not.toContain('ước tính');
  });

  it('says the target is already reached when it is not above the start', () => {
    const text = buildRecommendationVi(
      input({
        hasStudiedBefore: true,
        selfAssessedLevel: 3,
        recommendedLevel: 3,
        plansToTakeExam: true,
        targetLevel: 2,
      }),
    );
    expect(text).toContain('cao hơn mục tiêu Level 2');
    expect(text).not.toContain('ước tính');
  });

  it('estimates the word gap from the starting level', () => {
    const text = buildRecommendationVi(
      input({
        hasStudiedBefore: true,
        selfAssessedLevel: 1,
        recommendedLevel: 1,
        plansToTakeExam: true,
        targetLevel: 3,
      }),
    );
    // levels 2 + 3 = 500 words at 10/day
    expect(text).toContain('còn khoảng 500 từ mới');
    expect(text).toContain('khoảng 50 ngày (~8 tuần)');
  });

  it('counts every level up to the target for a new learner', () => {
    const text = buildRecommendationVi(
      input({ plansToTakeExam: true, targetLevel: 2 }),
    );
    expect(text).toContain('còn khoảng 300 từ mới');
  });

  it('skips the estimate when no vocabulary is seeded', () => {
    const text = buildRecommendationVi(
      input({
        plansToTakeExam: true,
        targetLevel: 2,
        wordsPerLevel: new Map(),
      }),
    );
    expect(text).not.toContain('ước tính');
  });

  it.each([
    ['2026-03-01', 'khá thoải mái'], // 59 days for a 30-day plan
    ['2026-02-01', 'vừa đủ'], // 31 days
    ['2026-01-20', 'khá gấp'], // 19 days
    ['2025-12-01', 'đã qua rồi'],
  ])('rates the pace for deadline %s', (targetDate, expected) => {
    const text = buildRecommendationVi(
      input({ plansToTakeExam: true, targetLevel: 2, targetDate }),
    );
    expect(text).toContain(expected);
  });
});
