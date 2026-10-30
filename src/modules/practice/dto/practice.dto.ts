import { PracticeSkill } from '../../../generated/prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/** Same upper bound as a flashcard review (`ReviewDto.durationMs`). */
const MAX_ATTEMPT_DURATION_MS = 600_000;

export class RecordAttemptDto {
  @IsUUID()
  wordId!: string;

  @IsEnum(PracticeSkill)
  skill!: PracticeSkill;

  /** Kết quả chấm ở client; bỏ trống khi không chấm được (vd phát âm trên
   * trình duyệt không hỗ trợ nhận dạng giọng nói). */
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  /** Time spent on this attempt; counts toward a MINUTES daily goal (capped
   * per attempt by the gamification listener). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_ATTEMPT_DURATION_MS)
  durationMs?: number;
}

export class PracticeStatsQueryDto {
  @IsEnum(PracticeSkill)
  skill!: PracticeSkill;
}
