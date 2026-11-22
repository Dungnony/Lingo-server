import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LEVEL_COUNT } from '../../common/levels';
import type { AuthUser } from '../../common/types';
import { FastTrackQuizDto, FastTrackSubmitDto } from './dto/fast-track.dto';
import { LearnService } from './learn.service';

class PathQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEVEL_COUNT)
  level?: number;
}

@ApiTags('learn')
@ApiBearerAuth()
@Controller('learn')
export class LearnController {
  constructor(private readonly learn: LearnService) {}

  @Get('path')
  path(@CurrentUser() user: AuthUser, @Query() q: PathQuery) {
    return this.learn.path(user.id, q.level);
  }

  @Get('lessons/:id')
  lesson(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.learn.lesson(user.id, id);
  }

  @Post('lessons/:id/skip')
  skipLesson(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.learn.skipLesson(user.id, id);
  }

  @Post('fast-track/quiz')
  createFastTrackQuiz(
    @CurrentUser() user: AuthUser,
    @Body() dto: FastTrackQuizDto,
  ) {
    return this.learn.createFastTrackQuiz(user.id, dto);
  }

  @Post('fast-track/submit')
  submitFastTrackQuiz(
    @CurrentUser() user: AuthUser,
    @Body() dto: FastTrackSubmitDto,
  ) {
    return this.learn.submitFastTrackQuiz(user.id, dto);
  }
}
