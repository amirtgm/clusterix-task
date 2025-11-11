import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import type { RedisOptions } from 'bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createAuth } from './auth/auth.service';
import {
  configuration,
  type EnvConfig,
  envFilePath,
} from './config/configuration';
import { PrismaModule } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      load: [configuration],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => {
        const connection: RedisOptions = {};
        const redisHost = configService.get('REDIS_HOST', { infer: true });
        const redisPort = configService.get('REDIS_PORT', { infer: true });
        const redisUser = configService.get('REDIS_USER', { infer: true });
        const redisPassword = configService.get('REDIS_PASSWORD', {
          infer: true,
        });
        connection.url = `redis://${redisUser}:${redisPassword}@${redisHost}:${redisPort}`;
        return { connection };
      },
    }),
    PrismaModule,
    AuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => ({
        auth: createAuth({
          frontendOrigin: configService.get('FRONTEND_ORIGIN', { infer: true }),
          betterAuthSecret: configService.get('BETTER_AUTH_SECRET', {
            infer: true,
          }),
          betterAuthUrl: configService.get('BETTER_AUTH_URL', { infer: true }),
        }),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
