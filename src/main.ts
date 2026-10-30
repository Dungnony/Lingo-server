import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';
import { RedisIoAdapter } from './infra/redis/redis-io.adapter';
import { AVATAR_ROUTE } from './modules/users/avatar.util';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  // WebSocket (NotificationsGateway, tin nhắn realtime) chạy chung cổng HTTP
  // — gắn Redis adapter để pub/sub được xuyên suốt khi chạy nhiều instance.
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(config.get('REDIS_URL', { infer: true }));
  app.useWebSocketAdapter(redisIoAdapter);

  const apiPrefix = config.get('API_PREFIX', { infer: true });
  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''), {
    exclude: [{ path: `${AVATAR_ROUTE}/:file`, method: RequestMethod.GET }],
  });

  app.use(
    helmet({
      // Cho phép frontend (origin khác) tải ảnh đại diện ở /media/avatars/*.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('FRONTEND_URL', { infer: true }),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.enableShutdownHooks();

  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Lingo API')
        .setDescription('API học tiếng Anh theo 6 cấp độ (Beginner → Advanced)')
        .setVersion('0.1.0')
        .addBearerAuth()
        .addCookieAuth('lingo_access')
        .build(),
    );
    SwaggerModule.setup(`${apiPrefix.replace(/^\//, '')}/docs`, app, doc);
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  console.log(`Lingo API chạy tại http://localhost:${port}${apiPrefix}`);
}

void bootstrap();
