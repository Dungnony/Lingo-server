export interface SentenceEvaluation {
  score: number;
  isNatural: boolean;
  corrected: string;
  feedbackVi: string;
  tipVi: string;
  usedTargetWord: boolean;
  aiPowered: boolean;
}

export function containsTargetWord(
  sentence: string,
  targetWord: string,
): boolean {
  const lowerSentence = sentence.toLowerCase();
  const cleanTarget = targetWord.trim().toLowerCase();
  if (!cleanTarget) return false;
  if (lowerSentence.includes(cleanTarget)) {
    const escaped = cleanTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`).test(lowerSentence)) {
      return true;
    }
  }
  const tokens: string[] = lowerSentence.match(/[a-z]+/g) ?? [];
  if (!cleanTarget.includes(' ') && cleanTarget.length >= 4) {
    const stem = cleanTarget.slice(0, cleanTarget.length - 1);
    return tokens.some((tok) => tok.startsWith(stem));
  }
  return tokens.includes(cleanTarget);
}

export function evaluateSentenceFallback(
  targetWord: string,
  meaningVi: string | null,
  sentence: string,
): SentenceEvaluation {
  const trimmed = sentence.trim().replace(/\s+/g, ' ');
  const usedTargetWord = containsTargetWord(trimmed, targetWord);
  const words = trimmed.split(/\s+/).filter(Boolean);
  const hasCapital = /^[A-Z]/.test(trimmed);
  const hasEndingPunct = /[.!?]$/.test(trimmed);

  let corrected = trimmed;
  if (corrected.length > 0 && !hasCapital) {
    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
  }
  if (corrected.length > 0 && !hasEndingPunct) {
    corrected = `${corrected}.`;
  }

  let score = usedTargetWord ? 60 : 25;
  if (words.length >= 4) score += 20;
  else if (words.length === 3) score += 10;
  if (hasCapital) score += 10;
  if (hasEndingPunct) score += 10;
  score = Math.max(0, Math.min(100, score));

  const notes: string[] = [];
  if (!usedTargetWord) {
    notes.push(`Câu chưa dùng từ mục tiêu "${targetWord}".`);
  }
  if (words.length < 4) {
    notes.push('Câu hơi ngắn, nên thêm chủ ngữ/vị ngữ để rõ nghĩa hơn.');
  }
  if (!hasCapital) {
    notes.push('Chữ cái đầu câu nên viết hoa.');
  }
  if (!hasEndingPunct) {
    notes.push('Cuối câu nên có dấu chấm, dấu hỏi hoặc dấu chấm than.');
  }

  const feedbackVi = notes.length
    ? notes.join(' ')
    : `Câu hoàn chỉnh, có dùng từ "${targetWord}" đúng hình thức cơ bản.`;

  const meaningHint = meaningVi ? ` (nghĩa: ${meaningVi})` : '';
  const tipVi = usedTargetWord
    ? `Thử mở rộng thêm ngữ cảnh (thời gian, địa điểm hoặc lý do) với "${targetWord}"${meaningHint} để câu tự nhiên hơn.`
    : `Đặt một câu có đầy đủ chủ ngữ + động từ và đưa từ "${targetWord}"${meaningHint} vào ngữ cảnh thực tế.`;

  return {
    score,
    isNatural: usedTargetWord && words.length >= 4 && score >= 75,
    corrected,
    feedbackVi,
    tipVi,
    usedTargetWord,
    aiPowered: false,
  };
}

export function parseAiEvaluationJson(
  raw: string,
  fallback: SentenceEvaluation,
): SentenceEvaluation {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return fallback;
    }
    const obj = parsed as Record<string, unknown>;
    const rawScore = Number(obj.score);
    const score = Number.isFinite(rawScore)
      ? Math.max(0, Math.min(100, Math.round(rawScore)))
      : fallback.score;
    const isNatural =
      typeof obj.isNatural === 'boolean' ? obj.isNatural : score >= 75;
    const corrected =
      typeof obj.corrected === 'string' && obj.corrected.trim()
        ? obj.corrected.trim()
        : fallback.corrected;
    const feedbackVi =
      typeof obj.feedbackVi === 'string' && obj.feedbackVi.trim()
        ? obj.feedbackVi.trim()
        : fallback.feedbackVi;
    const tipVi =
      typeof obj.tipVi === 'string' && obj.tipVi.trim()
        ? obj.tipVi.trim()
        : fallback.tipVi;
    const usedTargetWord =
      typeof obj.usedTargetWord === 'boolean'
        ? obj.usedTargetWord
        : fallback.usedTargetWord;

    return {
      score,
      isNatural,
      corrected,
      feedbackVi,
      tipVi,
      usedTargetWord,
      aiPowered: true,
    };
  } catch {
    return fallback;
  }
}
