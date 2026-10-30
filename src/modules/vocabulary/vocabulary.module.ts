import { Module } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { VocabularyController } from './vocabulary.controller';
import { WordReportsService } from './word-reports.service';
import { WordsService } from './words.service';

@Module({
  controllers: [VocabularyController],
  providers: [WordsService, LevelsService, WordReportsService],
  exports: [WordsService, LevelsService],
})
export class VocabularyModule {}
