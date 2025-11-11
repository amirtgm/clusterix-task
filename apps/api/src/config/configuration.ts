import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  FRONTEND_ORIGIN: z.url().default('http://localhost:5173'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters long'),
  BETTER_AUTH_URL: z.url(),
  DATABASE_URL: z.string().min(1),
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
  });
  if (!parsed.success) {
    const formattedError = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Config validation error: ${formattedError}`);
  }
  return parsed.data;
};

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const envFilePath =
  nodeEnv === 'production' ? '.env.prod' : '.env.development';
