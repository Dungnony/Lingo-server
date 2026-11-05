import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { startOfLocalDayInstant } from '../../common/time.util';
import type { Env } from '../../config/env.validation';
import { GameMode, type Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import {
  MINIGAME_QUESTION_COUNT,
  type FinishMinigameDto,
  type MinigameAnswerDto,
} from './dto/minigame.dto';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const POOL_SIZE = 800;
const MATCH_PAIRS = 8;
/** Thời gian tối thiểu hợp lý để lật xong `MATCH_PAIRS` cặp thẻ — chặn báo
 * điểm gian dối kiểu "hoàn thành trong 0 giây" (không thể xác minh chi
 * tiết từng lượt lật như MC vì việc so khớp đã lộ hết ở phía client ngay
 * lúc tải dữ liệu, nhưng vẫn chặn được trường hợp lộ liễu nhất). */
const MATCH_MIN_MS_PER_PAIR = 500;
/** Coins one user can earn from minigames per study day. MATCH scores are
 * self-reported, so this is what bounds farming; play past it still ranks. */
export const MINIGAME_DAILY_COIN_LIMIT = 100;
const COIN_REASON = 'minigame';
/** Keeps a session reopened long after it started inside the Int32 column. */
const MAX_RECORDED_DURATION_MS = 86_400_000;

interface StoredQuestion {
  wordId: string;
  prompt: string;
  pronunciation: string | null;
  audioUrl: string | null;
  options: string[];
  correctIndex: number;
}

export interface MatchCard {
  cardId: string;
  wordId: string;
  kind: 'word' | 'meaning';
  content: string;
}

/** Scores convert to coins, so each question counts once: the first answer
 * wins and repeats or words outside the session are ignored. */
function gradeAnswers(
  questions: readonly StoredQuestion[],
  answers: readonly MinigameAnswerDto[],
): { score: number; totalAsked: number } {
  const unanswered = new Map(questions.map((q) => [q.wordId, q]));
  let score = 0;
  let totalAsked = 0;
  for (const answer of answers) {
    const question = unanswered.get(answer.wordId);
    if (!question) continue;
    unanswered.delete(answer.wordId);
    totalAsked += 1;
    if (question.correctIndex === answer.chosenIndex) score += 1;
  }
  return { score, totalAsked };
}

/** "Ghép cặp": không có gì bí mật để so khớp lại (khác trắc nghiệm — xem
 * ghi chú ở `startMatchGame`), chỉ chặn báo cáo gian dối lộ liễu nhất
 * (hoàn thành nhanh hơn mức vật lý có thể) bằng `MATCH_MIN_MS_PER_PAIR`.
 * Điểm = số cặp trừ đi số lần lật sai, tối thiểu 1 nếu hoàn thành. */
function gradeMatch(
  mistakes: number,
  durationMs: number,
): { score: number; totalAsked: number } {
  const plausible = durationMs >= MATCH_PAIRS * MATCH_MIN_MS_PER_PAIR;
  return {
    score: plausible ? Math.max(1, MATCH_PAIRS - mistakes) : 0,
    totalAsked: MATCH_PAIRS,
  };
}

function elapsedMs(startedAt: Date, now: Date): number {
  const elapsed = now.getTime() - startedAt.getTime();
  return Math.min(Math.max(0, elapsed), MAX_RECORDED_DURATION_MS);
}

/**
 * 3 minigame — "Dịch tốc độ" (TRANSLATE), "Nghe đoán từ" (LISTENING),
 * "Ghép cặp" (MATCH) — Giai đoạn 1 theo lộ trình trong FEATURES.md: chơi 1
 * mình, tính giờ, có bảng xếp hạng ngày/tuần RIÊNG theo từng mode.
 *
 * TRANSLATE/LISTENING dùng CHUNG engine trắc nghiệm, chỉ khác việc client có
 * ẩn từ/phiên âm hay không (server luôn trả đủ, FE tự quyết định ẩn/hiện theo
 * mode — y hệt cách `QuizService`/`quiz-runner.tsx` đã làm cho câu nghe).
 * LISTENING không cần `audioUrl`: client đọc từ bằng giọng đọc trình duyệt.
 * Khác `QuizService` (tin thẳng `isCorrect` client tự báo): ở đây server
 * LƯU SẴN đáp án đúng lúc bắt đầu (`MinigameSession.questions`), và tự so
 * khớp lúc nộp bài — cần thiết vì kết quả game này quy đổi ra xu thật.
 *
 * MATCH (lật thẻ tìm cặp) khác hẳn 2 mode trên — không có "đáp án bí mật"
 * để giấu (việc so khớp 2 thẻ vốn công khai ngay khi tải dữ liệu, bản chất
 * trò chơi trí nhớ), nên `finish()` chỉ chặn được báo cáo gian dối LỘ LIỄU
 * nhất (thời gian hoàn thành nhanh hơn mức vật lý có thể), xem
 * `gradeMatch()`.
 */
@Injectable()
export class MinigameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async start(userId: string, mode: GameMode = GameMode.TRANSLATE) {
    if (mode === GameMode.MATCH) return this.startMatchGame(userId);

    const pool = await this.prisma.word.findMany({
      where: {
        meaningVi: { not: null },
      },
      orderBy: { frequencyRank: 'asc' },
      take: POOL_SIZE,
    });
    if (pool.length < 4) {
      throw new BadRequestException('Chưa đủ từ vựng để chơi minigame');
    }

    const picked = shuffle(pool).slice(
      0,
      Math.min(MINIGAME_QUESTION_COUNT, pool.length),
    );
    const allMeanings = pool.map((w) => w.meaningVi!).filter(Boolean);

    const questions: StoredQuestion[] = picked.map((w) => {
      const distractors = shuffle(
        allMeanings.filter((m) => m !== w.meaningVi),
      ).slice(0, 3);
      const options = shuffle([w.meaningVi!, ...distractors]);
      return {
        wordId: w.id,
        prompt: w.word,
        pronunciation: w.pronunciation,
        audioUrl: w.audioUrl,
        options,
        correctIndex: options.indexOf(w.meaningVi!),
      };
    });

    const session = await this.prisma.minigameSession.create({
      data: {
        userId,
        mode,
        questions: questions as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      sessionId: session.id,
      mode,
      questions: questions.map((q) => ({
        wordId: q.wordId,
        prompt: q.prompt,
        pronunciation: q.pronunciation,
        audioUrl: q.audioUrl,
        options: q.options,
      })),
    };
  }

  /** "Ghép cặp": chọn `MATCH_PAIRS` từ, tạo 2 thẻ/từ (mặt từ tiếng Anh + mặt
   * nghĩa), trộn vị trí rồi trả về NGUYÊN mảng thẻ (kèm `wordId`) — khác
   * TRANSLATE/LISTENING, ở đây không giấu được "đáp án" vì việc so khớp 2
   * thẻ vốn công khai ngay khi tải dữ liệu (bản chất trò lật thẻ trí nhớ),
   * nên không cần giấu `wordId` như giấu `correctIndex` ở 2 mode kia. */
  private async startMatchGame(userId: string) {
    const pool = await this.prisma.word.findMany({
      where: { meaningVi: { not: null } },
      orderBy: { frequencyRank: 'asc' },
      take: POOL_SIZE,
    });
    if (pool.length < MATCH_PAIRS) {
      throw new BadRequestException('Chưa đủ từ vựng để chơi minigame');
    }
    const picked = shuffle(pool).slice(0, MATCH_PAIRS);
    const cards: MatchCard[] = shuffle(
      picked.flatMap((w, i) => [
        {
          cardId: `${i}-w`,
          wordId: w.id,
          kind: 'word' as const,
          content: w.word,
        },
        {
          cardId: `${i}-m`,
          wordId: w.id,
          kind: 'meaning' as const,
          content: w.meaningVi!,
        },
      ]),
    );

    const session = await this.prisma.minigameSession.create({
      data: {
        userId,
        mode: GameMode.MATCH,
        questions: cards as unknown as Prisma.InputJsonValue,
      },
    });

    return { sessionId: session.id, mode: GameMode.MATCH, cards };
  }

  async finish(
    userId: string,
    sessionId: string,
    dto: FinishMinigameDto,
    now = new Date(),
  ) {
    const session = await this.prisma.minigameSession.findUnique({
      where: { id: sessionId },
      include: { user: { select: { timezone: true } } },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Không tìm thấy lượt chơi');
    }

    const durationMs = elapsedMs(session.startedAt, now);
    const graded =
      session.mode === GameMode.MATCH
        ? gradeMatch(dto.mistakes ?? 0, durationMs)
        : gradeAnswers(
            session.questions as unknown as StoredQuestion[],
            dto.answers ?? [],
          );
    const { score, totalAsked } = graded;

    await this.closeSession(sessionId, { score, totalAsked, durationMs });

    // 1 xu / câu đúng — đơn giản, minh bạch cho giai đoạn kiểm chứng gameplay.
    const { credited, balance } = await this.wallet.creditWithinLimit(
      userId,
      score,
      COIN_REASON,
      {
        maxCoins: MINIGAME_DAILY_COIN_LIMIT,
        since: startOfLocalDayInstant(
          now,
          session.user.timezone,
          this.config.get('STREAK_DAY_CUTOFF_HOUR', { infer: true }),
        ),
      },
    );

    return {
      score,
      totalAsked,
      coinsEarned: credited,
      coinLimitReached: credited < score,
      balance,
    };
  }

  /** Atomic claim on `finishedAt`: of several concurrent finishes only one
   * succeeds, so a session can never be paid out twice. */
  private async closeSession(
    sessionId: string,
    result: { score: number; totalAsked: number; durationMs: number },
  ): Promise<void> {
    const { count } = await this.prisma.minigameSession.updateMany({
      where: { id: sessionId, finishedAt: null },
      data: { ...result, finishedAt: new Date() },
    });
    if (count === 0) {
      throw new BadRequestException('Lượt chơi này đã kết thúc rồi');
    }
  }

  async leaderboard(
    period: 'daily' | 'weekly' = 'daily',
    mode: GameMode = GameMode.TRANSLATE,
  ) {
    const now = new Date();
    const since =
      period === 'weekly'
        ? new Date(now.getTime() - 7 * 86_400_000)
        : new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
          );

    // Xếp hạng riêng theo TỪNG mode — ghép cả 2 vào 1 bảng sẽ không công
    // bằng vì độ khó (số từ có audio ít hơn số từ có nghĩa) khác nhau.
    const rows = await this.prisma.minigameSession.findMany({
      where: { finishedAt: { gte: since }, mode },
      orderBy: [{ score: 'desc' }, { durationMs: 'asc' }],
      take: 20,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    return rows.map((r, i) => ({
      rank: i + 1,
      userId: r.user.id,
      displayName: r.user.displayName,
      avatarUrl: r.user.avatarUrl,
      score: r.score ?? 0,
      totalAsked: r.totalAsked ?? 0,
      durationMs: r.durationMs ?? 0,
    }));
  }
}
