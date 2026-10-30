import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { WordReportReason } from '../../../generated/prisma/client';

/** Matches the `WordReport.note` column size. */
export const REPORT_NOTE_MAX_LENGTH = 500;

export class ReportWordDto {
  @IsEnum(WordReportReason)
  reason!: WordReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(REPORT_NOTE_MAX_LENGTH)
  note?: string;
}
