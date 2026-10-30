// Prisma CLI configuration (migrate, generate, db seed). Prisma 7 no longer reads
// .env on its own, so dotenv loads it here; the app itself reads env through
// @nestjs/config.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
