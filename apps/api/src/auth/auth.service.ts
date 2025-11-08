import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../prisma/generated/prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  // where BA will serve its routes (defaults to /api/auth)
  basePath: '/api/auth',
  
  // important when FE/BE are on different origins
  trustedOrigins: [process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'],
  database: prismaAdapter(prisma, {
    // set your provider (postgresql/mysql/sqlite/etc.)
    provider: 'postgresql',
  }),
  // you can also set baseURL/secret via env:
  // BETTER_AUTH_URL, BETTER_AUTH_SECRET
});
