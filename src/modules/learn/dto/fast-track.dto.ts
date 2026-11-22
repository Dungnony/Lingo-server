import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class FastTrackQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  lessonIds!: string[];
}

export class FastTrackAnswerItemDto {
  @IsUUID('4')
  wordId!: string;

  @IsString()
  chosen!: string;
}

export class FastTrackSubmitDto {
  @IsUUID('4')
  attemptId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => FastTrackAnswerItemDto)
  answers!: FastTrackAnswerItemDto[];
}
