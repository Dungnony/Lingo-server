import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AVATAR_ROUTE, avatarUserIdFromFile } from './avatar.util';
import { UsersService } from './users.service';

const AVATAR_CACHE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Serves avatars from the database. Mounted outside the `/api` prefix (see
 * main.ts) so the URLs keep the `/media/avatars/...` shape the static file
 * server used. Throttling is skipped like it was for static files: a
 * leaderboard page loads many avatars at once.
 */
@ApiTags('users')
@Controller(AVATAR_ROUTE)
export class AvatarsController {
  constructor(private readonly users: UsersService) {}

  @Public()
  @SkipThrottle()
  @Get(':file')
  async get(@Param('file') file: string, @Res() res: Response) {
    const userId = avatarUserIdFromFile(file);
    const avatar = userId ? await this.users.getAvatar(userId) : null;
    if (!avatar) throw new NotFoundException('Không tìm thấy ảnh đại diện');

    res
      .type(avatar.mimeType)
      .set('Cache-Control', `public, max-age=${AVATAR_CACHE_SECONDS}`)
      .set('Last-Modified', avatar.updatedAt.toUTCString())
      .send(Buffer.from(avatar.data));
  }
}
