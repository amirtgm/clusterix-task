import { z } from 'zod';

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  HOST: z.string(),
  PORT: z.coerce.number().int().min(0).max(65535),
  FRONTEND_ORIGIN: z.url(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters long'),
  BETTER_AUTH_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().min(0).max(65535),
  REDIS_USER: z.string().min(1),
  REDIS_PASSWORD: z
    .string()
    .min(12, 'REDIS_PASSWORD must be at least 12 characters long'),
  NEWS_API_KEY: z.string().min(1),
  GUARDIAN_API_KEY: z.string().min(1),
  NYT_API_KEY: z.string().min(1),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const configuration = () => {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    HOST: process.env.HOST,
    PORT: process.env.PORT,
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_USER: process.env.REDIS_USER,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    NEWS_API_KEY: process.env.NEWS_API_KEY,
    GUARDIAN_API_KEY: process.env.GUARDIAN_API_KEY,
    NYT_API_KEY: process.env.NYT_API_KEY,
  });
  if (!parsed.success) {
    const formattedError = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Config validation error: ${formattedError}`);
  }
  return parsed.data;
};

// Use the app-local env files. The app will load `.env.development` during
// development and `.env.prod` in production when run from the `apps/api` folder.
export const envFilePath =
  nodeEnv === 'production' ? '.env.prod' : '.env.development';
