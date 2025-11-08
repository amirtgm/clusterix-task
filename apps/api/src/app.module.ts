import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { auth } from './auth/auth.service';
import { PrismaModule } from './prisma.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule.forRoot({ auth }), // mounts /api/auth/*
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
