import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types';
import { ReportWordDto } from './dto/report-word.dto';
import { WordQueryDto } from './dto/word-query.dto';
import { LevelsService } from './levels.service';
import { WordReportsService } from './word-reports.service';
import { WordsService } from './words.service';

@ApiTags('vocabulary')
@ApiBearerAuth()
@Controller()
export class VocabularyController {
  constructor(
    private readonly words: WordsService,
    private readonly levels: LevelsService,
    private readonly reports: WordReportsService,
  ) {}

  @Get('levels')
  listLevels() {
    return this.levels.list();
  }

  @Get('levels/:level')
  getLevel(@Param('level', ParseIntPipe) level: number) {
    return this.levels.get(level);
  }

  @Get('words')
  listWords(@Query() query: WordQueryDto) {
    return this.words.list(query);
  }

  @Get('words/of-the-day')
  getWordOfTheDay() {
    return this.words.ofTheDay();
  }

  @Get('words/:id')
  getWord(@Param('id', ParseUUIDPipe) id: string) {
    return this.words.get(id);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('words/:id/reports')
  reportWord(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportWordDto,
  ) {
    return this.reports.report(user.id, id, dto);
  }
}
