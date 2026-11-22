import {
  containsTargetWord,
  evaluateSentenceFallback,
  parseAiEvaluationJson,
} from './sentence-eval.util';

describe('sentence-eval.util', () => {
  it('detects target word including simple inflections', () => {
    expect(containsTargetWord('She walks to school every day.', 'walk')).toBe(
      true,
    );
    expect(containsTargetWord('I ate an apple.', 'apple')).toBe(true);
    expect(containsTargetWord('I went to school.', 'apple')).toBe(false);
  });

  it('evaluates capitalization, punctuation and target word in fallback mode', () => {
    const ok = evaluateSentenceFallback(
      'book',
      'quyển sách',
      'I read a good book every night.',
    );
    expect(ok.usedTargetWord).toBe(true);
    expect(ok.score).toBe(100);
    expect(ok.isNatural).toBe(true);
    expect(ok.aiPowered).toBe(false);

    const missingWord = evaluateSentenceFallback(
      'book',
      'quyển sách',
      'i like coffee',
    );
    expect(missingWord.usedTargetWord).toBe(false);
    expect(missingWord.corrected).toBe('I like coffee.');
    expect(missingWord.score).toBeLessThan(60);
  });

  it('parses fenced Gemini JSON and falls back cleanly on invalid JSON', () => {
    const fallback = evaluateSentenceFallback(
      'habit',
      'thói quen',
      'Reading is a good habit.',
    );
    const ai = parseAiEvaluationJson(
      '```json\n{"score":92,"isNatural":true,"corrected":"Reading every day is a good habit.","feedbackVi":"Câu tự nhiên và đúng ngữ pháp.","tipVi":"Có thể thêm cụm every day cho sinh động.","usedTargetWord":true}\n```',
      fallback,
    );
    expect(ai.aiPowered).toBe(true);
    expect(ai.score).toBe(92);
    expect(ai.feedbackVi).toBe('Câu tự nhiên và đúng ngữ pháp.');

    expect(parseAiEvaluationJson('not json at all', fallback)).toEqual(
      fallback,
    );
  });
});
