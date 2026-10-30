import { Module } from '@nestjs/common';
import { PasswordService } from '../auth/password.service';
import { AvatarsController } from './avatars.controller';
import { FollowsController } from './follows/follows.controller';
import { FollowsService } from './follows/follows.service';
import { UserSettingsService } from './user-settings.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, FollowsController, AvatarsController],
  providers: [
    UsersService,
    UserSettingsService,
    PasswordService,
    FollowsService,
  ],
  exports: [UsersService, UserSettingsService],
})
export class UsersModule {}
