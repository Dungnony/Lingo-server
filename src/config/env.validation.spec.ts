import { validateEnv } from './env.validation';

const REQUIRED = {
  DATABASE_URL: 'postgresql://lingo:lingo@localhost:5432/lingo?schema=public',
  REDIS_URL: 'redis://localhost:6379/0',
  JWT_ACCESS_SECRET: 'a'.repeat(16),
  JWT_REFRESH_SECRET: 'b'.repeat(16),
  GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
};

describe('validateEnv', () => {
  it('accepts the required variables and fills defaults', () => {
    const env = validateEnv(REQUIRED);
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(8000);
    expect(env.API_PREFIX).toBe('/api');
    expect(env.FRONTEND_URL).toBe('http://localhost:3000');
    expect(env.ASSISTANT_DAILY_LIMIT).toBe(30);
    expect(env.SRS_DEFAULT_TARGET_RETENTION).toBe(0.9);
  });

  it('accepts non-http URL schemes for the database and Redis', () => {
    const env = validateEnv({
      ...REQUIRED,
      DATABASE_URL: 'postgres://u:p@db.example.com/lingo?sslmode=require',
      REDIS_URL: 'rediss://:secret@cache.example.com:6380/0',
    });
    expect(env.DATABASE_URL).toContain('postgres://');
    expect(env.REDIS_URL).toContain('rediss://');
  });

  it('coerces numeric strings', () => {
    const env = validateEnv({ ...REQUIRED, PORT: '9000', MAIL_PORT: '465' });
    expect(env.PORT).toBe(9000);
    expect(env.MAIL_PORT).toBe(465);
  });

  it('turns boolean flags into booleans, including their defaults', () => {
    expect(validateEnv(REQUIRED).COOKIE_SECURE).toBe(false);
    expect(validateEnv(REQUIRED).SEED_RESET).toBe(false);
    expect(
      validateEnv({ ...REQUIRED, COOKIE_SECURE: 'true' }).COOKIE_SECURE,
    ).toBe(true);
  });

  it('rejects a missing required variable and names it', () => {
    const withoutDb: Record<string, string> = { ...REQUIRED };
    delete withoutDb.DATABASE_URL;
    expect(() => validateEnv(withoutDb)).toThrow(/DATABASE_URL/);
  });

  it.each([
    ['JWT_ACCESS_SECRET', 'too-short'],
    ['FRONTEND_URL', 'not a url'],
    ['NODE_ENV', 'staging'],
    ['COOKIE_SECURE', 'yes'],
    ['STREAK_DAY_CUTOFF_HOUR', '24'],
    ['SRS_DEFAULT_TARGET_RETENTION', '0.5'],
  ])('rejects an invalid %s', (key, value) => {
    expect(() => validateEnv({ ...REQUIRED, [key]: value })).toThrow(
      new RegExp(key),
    );
  });
});
