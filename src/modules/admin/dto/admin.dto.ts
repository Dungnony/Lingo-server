import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsBooleanString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { VideoKind } from '../../../generated/prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { LEVEL_COUNT } from '../../../common/levels';

/** Rejects empty and whitespace-only strings for required text fields. */
const NOT_BLANK = /\S/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_LIST_ITEMS = 20;

export class AdminLevelQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEVEL_COUNT)
  level?: number;
}

export class AdminWordQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEVEL_COUNT)
  level?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  /** "true" = only approved words, "false" = only words still to review. */
  @IsOptional()
  @IsBooleanString()
  reviewed?: string;

  /** "true" = only words with open learner reports. */
  @IsOptional()
  @IsBooleanString()
  reported?: string;

  /** "true" = only words the AI cross-check (`data:check-words`) doubts. */
  @IsOptional()
  @IsBooleanString()
  aiFlagged?: string;
}

/** One admin page of words at most (PaginationDto caps pageSize at 100). */
const MAX_BULK_REVIEW = 100;

export class ReviewWordsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_REVIEW)
  @IsUUID('4', { each: true })
  ids!: string[];
}

export class AdminExampleDto {
  @IsString()
  @Matches(NOT_BLANK, { message: 'Câu ví dụ không được để trống' })
  @MaxLength(500)
  en!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  vi?: string;
}

/** Level is intentionally not editable: it is part of the word's unique key
 * and drives lessons, SRS progress and level totals. */
export class UpdateWordDto {
  @IsOptional()
  @IsString()
  @Matches(NOT_BLANK, { message: 'Từ không được để trống' })
  @MaxLength(100)
  word?: string;

  /** Empty string clears the field. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pronunciation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meaningVi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  meaningEn?: string;

  /** Replaces the word's first example sentence (created if missing). */
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminExampleDto)
  example?: AdminExampleDto;

  /** true = approve as is; false = undo an approval. Any content edit also
   * approves the word (see `reviewDecision`). */
  @IsOptional()
  @IsBoolean()
  reviewed?: boolean;
}

export class GrammarExampleDto {
  @IsString()
  @Matches(NOT_BLANK, { message: 'Câu ví dụ không được để trống' })
  @MaxLength(500)
  en!: string;

  @IsString()
  @MaxLength(500)
  vi!: string;
}

export class CreateGrammarDto {
  @IsString()
  @Matches(SLUG, {
    message:
      'Slug chỉ gồm chữ thường, số và dấu gạch ngang (vd present-simple)',
  })
  @MaxLength(80)
  slug!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEVEL_COUNT)
  level!: number;

  @IsString()
  @Matches(NOT_BLANK, { message: 'Tiêu đề tiếng Việt không được để trống' })
  @MaxLength(200)
  titleVi!: string;

  @IsString()
  @Matches(NOT_BLANK, { message: 'Tiêu đề tiếng Anh không được để trống' })
  @MaxLength(200)
  titleEn!: string;

  @IsString()
  @MaxLength(1000)
  summaryVi!: string;

  @IsString()
  @MaxLength(10000)
  explanationVi!: string;

  @IsArray()
  @ArrayMaxSize(MAX_LIST_ITEMS)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  patterns!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LIST_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => GrammarExampleDto)
  examples!: GrammarExampleDto[];
}

/** The slug is the seed's upsert key and the public URL, so it is fixed
 * after creation. */
export class UpdateGrammarDto extends PartialType(
  OmitType(CreateGrammarDto, ['slug'] as const),
) {}

export class AdminVideoQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  @Matches(NOT_BLANK, { message: 'Tiêu đề không được để trống' })
  @MaxLength(200)
  title?: string;

  /** Empty string clears the field. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleEn?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEVEL_COUNT)
  level?: number;

  @IsOptional()
  @IsEnum(VideoKind)
  kind?: VideoKind;
}
