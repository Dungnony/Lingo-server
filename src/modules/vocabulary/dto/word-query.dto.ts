import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { LEVEL_COUNT } from '../../../common/levels';

export class WordQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEVEL_COUNT)
  level?: number;

  /** tìm theo từ tiếng Anh / nghĩa tiếng Việt / định nghĩa tiếng Anh */
  @IsOptional()
  @IsString()
  q?: string;

  /** "true" = only words that have at least one example sentence (used by
   * the dictation page), returned with their examples. */
  @IsOptional()
  @IsBooleanString()
  withExamples?: string;
}
