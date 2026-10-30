import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types';
import { NotebookQueryDto } from './dto/notebook.dto';
import { NotebookService } from './notebook.service';

@ApiTags('notebook')
@ApiBearerAuth()
@Controller('notebook')
export class NotebookController {
  constructor(private readonly notebook: NotebookService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: NotebookQueryDto) {
    return this.notebook.list(user.id, q);
  }

  // Registered before ':wordId' routes so "ids" is never parsed as a UUID.
  @Get('ids')
  ids(@CurrentUser() user: AuthUser) {
    return this.notebook.savedIds(user.id);
  }

  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Post(':wordId')
  save(
    @CurrentUser() user: AuthUser,
    @Param('wordId', ParseUUIDPipe) wordId: string,
  ) {
    return this.notebook.save(user.id, wordId);
  }

  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Delete(':wordId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('wordId', ParseUUIDPipe) wordId: string,
  ) {
    return this.notebook.remove(user.id, wordId);
  }
}
