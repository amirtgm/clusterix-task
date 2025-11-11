import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../prisma/generated/prisma/client';

const prisma = new PrismaClient();

type AuthFactoryConfig = {
  frontendOrigin: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
};

export const createAuth = (config: AuthFactoryConfig) =>
  betterAuth({
    basePath: '/api/auth',
    emailAndPassword: {
      enabled: true,
    },
    baseURL: config.betterAuthUrl,
    secret: config.betterAuthSecret,
    trustedOrigins: [config.frontendOrigin],
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
  });
