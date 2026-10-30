import { OnboardingGoal } from '../../../generated/prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { LEVEL_COUNT } from '../../../common/levels';

export class SubmitOnboardingDto {
  @IsBoolean()
  hasStudiedBefore!: boolean;

  /** Cấp tự đánh giá đã học tới — bắt buộc nếu `hasStudiedBefore = true`. */
  @ValidateIf((o: SubmitOnboardingDto) => o.hasStudiedBefore)
  @IsInt()
  @Min(1)
  @Max(LEVEL_COUNT)
  selfAssessedLevel?: number;

  @IsEnum(OnboardingGoal)
  goal!: OnboardingGoal;

  @IsBoolean()
  plansToTakeExam!: boolean;

  /** Cấp muốn thi — bắt buộc nếu `plansToTakeExam = true`. */
  @ValidateIf((o: SubmitOnboardingDto) => o.plansToTakeExam)
  @IsInt()
  @Min(1)
  @Max(LEVEL_COUNT)
  targetLevel?: number;

  @ValidateIf((o: SubmitOnboardingDto) => o.plansToTakeExam)
  @IsOptional()
  @IsISO8601()
  targetDate?: string;
}
