import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
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
