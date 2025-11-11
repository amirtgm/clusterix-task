import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { EnvConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // required for Better Auth
  });
  const configService = app.get(ConfigService<EnvConfig, true>);
  app.enableCors({
    origin: configService.get('FRONTEND_ORIGIN', { infer: true }),
    credentials: true,
  });
  await app.listen(
    configService.get('PORT', { infer: true }),
    configService.get('HOST', { infer: true }),
  );
}
bootstrap();
