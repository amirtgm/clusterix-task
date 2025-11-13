import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import type { RedisOptions } from "bullmq";
import { ZodValidationPipe } from "nestjs-zod";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { createAuth } from "./auth/auth.service";
import {
  configuration,
  type EnvConfig,
  envFilePath,
} from "./config/configuration";
import { NewsModule } from "./news/news.module";
import { PrismaModule } from "./prisma.service";
import { ImportNewsModule } from "./queues/import-news/import-news.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => {
        const connection: RedisOptions = {};
        const redisHost = configService.get("REDIS_HOST", { infer: true });
        const redisPort = configService.get("REDIS_PORT", { infer: true });
        const redisUser = configService.get("REDIS_USER", { infer: true });
        const redisPassword = configService.get("REDIS_PASSWORD", {
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
          frontendOrigin: configService.get("FRONTEND_ORIGIN", { infer: true }),
          betterAuthSecret: configService.get("BETTER_AUTH_SECRET", {
            infer: true,
          }),
          betterAuthUrl: configService.get("BETTER_AUTH_URL", { infer: true }),
        }),
      }),
    }),
    NewsModule,
    ImportNewsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
