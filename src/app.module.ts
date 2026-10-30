import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { RedisModule } from './infra/redis/redis.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { AuthModule } from './modules/auth/auth.module';
import { DuelModule } from './modules/duel/duel.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { GamificationModule } from './modules/gamification/gamification.module';
import { GrammarModule } from './modules/grammar/grammar.module';
import { ExamsModule } from './modules/exams/exams.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { LearnModule } from './modules/learn/learn.module';
import { VideosModule } from './modules/videos/videos.module';
import { MailModule } from './modules/mail/mail.module';
import { MessagesModule } from './modules/messages/messages.module';
import { MinigameModule } from './modules/minigame/minigame.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { NotebookModule } from './modules/notebook/notebook.module';
import { AdminModule } from './modules/admin/admin.module';
import { PracticeModule } from './modules/practice/practice.module';
import { ProgressModule } from './modules/progress/progress.module';
import { PushModule } from './modules/push/push.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { SrsModule } from './modules/srs/srs.module';
import { UsersModule } from './modules/users/users.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: Number(process.env.THROTTLE_TTL ?? 60) * 1000,
            limit: Number(process.env.THROTTLE_LIMIT ?? 100),
          },
        ],
      }),
    }),

    PrismaModule,
    RedisModule,
    MailModule,

    AuthModule,
    UsersModule,
    VocabularyModule,
    SrsModule,
    ProgressModule,
    LearnModule,
    VideosModule,
    GamificationModule,
    GrammarModule,
    ExamsModule,
    LeaderboardModule,
    PushModule,
    NotificationsModule,
    MessagesModule,
    PracticeModule,
    NotebookModule,
    AdminModule,
    OnboardingModule,
    AssistantModule,
    ReferralsModule,
    WalletModule,
    MinigameModule,
    DuelModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
