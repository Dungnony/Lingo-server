import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ReviewRating, StudySource } from '../../../generated/prisma/client';
import { LEVEL_COUNT } from '../../../common/levels';

export class ReviewDto {
  @IsUUID()
  wordId!: string;

  @IsEnum(ReviewRating)
  rating!: ReviewRating;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600_000)
  durationMs?: number;

  @IsOptional()
  @IsUUID()
  studySessionId?: string;
}

export class QueueQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEVEL_COUNT)
  level?: number;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  /** "true" = only words saved in the user's notebook. */
  @IsOptional()
  @IsBooleanString()
  notebook?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class StartSessionDto {
  @IsEnum(StudySource)
  source!: StudySource;
}
