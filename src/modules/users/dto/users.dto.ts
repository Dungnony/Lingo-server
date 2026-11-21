import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GoalType } from '../../../generated/prisma/client';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^(https?:\/\/|\/media\/avatars\/)/, {
    message: 'avatarUrl phải là URL http(s) hoặc đường dẫn avatar nội bộ',
  })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsEnum(GoalType)
  dailyGoalType?: GoalType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  dailyGoalValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  newCardsPerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000)
  maxReviewsPerDay?: number;

  @IsOptional()
  @IsString()
  srsScheduler?: 'sm2' | 'fsrs';

  @IsOptional()
  @IsNumber()
  @Min(0.7)
  @Max(0.99)
  targetRetention?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  reminderHour?: number;

  @IsOptional()
  @IsBoolean()
  weeklyDigestEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  showPhonetics?: boolean;

  @IsOptional()
  @IsBoolean()
  showVietnamese?: boolean;
}

export class SearchUsersQuery {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  q!: string;
}

export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  password?: string;
}
