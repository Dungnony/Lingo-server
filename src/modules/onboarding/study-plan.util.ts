import type { OnboardingGoal } from '../../generated/prisma/client';
import { levelLabel } from '../../common/levels';

const MS_PER_DAY = 86_400_000;
/** Deadline is "comfortable" when it leaves at least 20% slack. */
const COMFORTABLE_PACE_RATIO = 1.2;

const GOAL_VI: Record<OnboardingGoal, string> = {
  TRAVEL: 'giao tiếp khi du lịch',
  WORK: 'phục vụ công việc',
  EXAM: 'thi chứng chỉ (IELTS, TOEIC…)',
  ACADEMIC: 'du học',
  ENTERTAINMENT: 'xem phim, nghe nhạc không cần phụ đề',
  INTEREST: 'sở thích cá nhân, tìm hiểu văn hoá',
  OTHER: 'mục tiêu riêng của bạn',
};

export interface StudyPlanInput {
  hasStudiedBefore: boolean;
  selfAssessedLevel?: number;
  goal: OnboardingGoal;
  plansToTakeExam: boolean;
  targetLevel?: number;
  /** ISO date string */
  targetDate?: string;
  recommendedLevel: number;
  /** Number of words in the database for each level. */
  wordsPerLevel: ReadonlyMap<number, number>;
  wordsPerDay: number;
  now: Date;
}

/** Total words of every level from 1 up to `level` inclusive. */
export function cumulativeWords(
  wordsPerLevel: ReadonlyMap<number, number>,
  level: number,
): number {
  let total = 0;
  for (const [lv, count] of wordsPerLevel) {
    if (lv <= level) total += count;
  }
  return total;
}

/**
 * Luật đơn giản, không cần AI: cấp đề xuất = cấp tự đánh giá (ôn/củng cố
 * tiếp từ đó) hoặc cấp 1 nếu chưa học bao giờ. Nếu có đặt cấp muốn đạt,
 * ước tính số từ mới còn thiếu (đếm từ thật trong DB theo từng cấp) chia cho
 * nhịp học hiện tại ra số ngày cần học, rồi so với hạn nếu có đặt.
 *
 * Ghi rõ từng mục (trình độ hiện tại / mục tiêu / lộ trình đề xuất) trên
 * dòng riêng thay vì gộp thành 1 câu văn xuôi, để không đọc nhầm cấp hiện
 * tại với cấp mục tiêu.
 */
export function buildRecommendationVi(input: StudyPlanInput): string {
  const currentLevelText = input.hasStudiedBefore
    ? `đã học tới khoảng ${levelLabel(input.selfAssessedLevel ?? input.recommendedLevel)}`
    : 'chưa học tiếng Anh bài bản trước đây';

  const lines = [
    `📋 Trình độ hiện tại: ${currentLevelText}.`,
    `🎯 Mục tiêu: ${GOAL_VI[input.goal]}${
      input.plansToTakeExam && input.targetLevel
        ? `, muốn đạt ${levelLabel(input.targetLevel)}`
        : ''
    }.`,
    '',
    `👉 Lộ trình đề xuất: ${
      input.hasStudiedBefore ? 'ôn lại, củng cố chắc' : 'bắt đầu học'
    } từ ${levelLabel(input.recommendedLevel)}.`,
  ];

  if (!input.plansToTakeExam || !input.targetLevel) return lines.join('\n');

  if (input.targetLevel <= input.recommendedLevel) {
    lines.push(
      `Bạn đã ở cấp tương đương hoặc cao hơn mục tiêu ${levelLabel(input.targetLevel)} rồi — tập trung ôn chắc để dùng tiếng Anh tự tin hơn.`,
    );
    return lines.join('\n');
  }

  const baseWords = input.hasStudiedBefore
    ? cumulativeWords(input.wordsPerLevel, input.recommendedLevel)
    : 0;
  const wordGap =
    cumulativeWords(input.wordsPerLevel, input.targetLevel) - baseWords;
  // No vocabulary seeded yet: an estimate of "0 words" would be misleading.
  if (wordGap <= 0) return lines.join('\n');

  const perDay = Math.max(1, input.wordsPerDay);
  const estDays = Math.max(1, Math.ceil(wordGap / perDay));
  const estWeeks = Math.ceil(estDays / 7);
  lines.push(
    `Từ ${levelLabel(input.recommendedLevel)} lên tới ${levelLabel(input.targetLevel)} còn khoảng ${wordGap} từ mới — với nhịp ${perDay} từ/ngày, ước tính cần khoảng ${estDays} ngày (~${estWeeks} tuần) học đều mỗi ngày.`,
  );

  if (input.targetDate) {
    const daysUntil = Math.ceil(
      (new Date(input.targetDate).getTime() - input.now.getTime()) / MS_PER_DAY,
    );
    if (daysUntil > 0) {
      const pace =
        daysUntil >= estDays * COMFORTABLE_PACE_RATIO
          ? 'khá thoải mái'
          : daysUntil >= estDays
            ? 'vừa đủ — nên học đều mỗi ngày, đừng bỏ ngày nào'
            : 'khá gấp — có thể cần tăng nhịp học mỗi ngày trong phần Cài đặt';
      lines.push(
        `Còn ${daysUntil} ngày tới hạn bạn đặt, nhịp học hiện tại là ${pace}.`,
      );
    } else {
      lines.push('Hạn bạn đặt đã qua rồi — cân nhắc đặt lại mục tiêu mới nhé.');
    }
  }

  return lines.join('\n');
}
