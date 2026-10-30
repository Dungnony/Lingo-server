import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import {
  AdminLevelQueryDto,
  AdminVideoQueryDto,
  AdminWordQueryDto,
  CreateGrammarDto,
  ReviewWordsDto,
  UpdateGrammarDto,
  UpdateVideoDto,
  UpdateWordDto,
} from './dto/admin.dto';

/** Content management. Every route requires the `admin` role (checked by the
 * global RolesGuard); grant it with `npm run user:set-role`. */
@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('words')
  listWords(@Query() q: AdminWordQueryDto) {
    return this.admin.listWords(q);
  }

  @Get('words/stats')
  wordStats() {
    return this.admin.wordStats();
  }

  @Post('words/review')
  reviewWords(@Body() dto: ReviewWordsDto) {
    return this.admin.reviewWords(dto.ids);
  }

  @Patch('words/:id')
  updateWord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWordDto,
  ) {
    return this.admin.updateWord(id, dto);
  }

  @Get('grammar')
  listGrammar(@Query() q: AdminLevelQueryDto) {
    return this.admin.listGrammar(q.level);
  }

  @Post('grammar')
  createGrammar(@Body() dto: CreateGrammarDto) {
    return this.admin.createGrammar(dto);
  }

  @Patch('grammar/:id')
  updateGrammar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGrammarDto,
  ) {
    return this.admin.updateGrammar(id, dto);
  }

  @Delete('grammar/:id')
  deleteGrammar(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteGrammar(id);
  }

  @Get('videos')
  listVideos(@Query() q: AdminVideoQueryDto) {
    return this.admin.listVideos(q);
  }

  @Patch('videos/:id')
  updateVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVideoDto,
  ) {
    return this.admin.updateVideo(id, dto);
  }
}
