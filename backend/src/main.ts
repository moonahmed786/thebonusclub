import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { APP_CONFIG, AppConfig } from './config/app-config';
import { AppLogger } from './shared/logger/app-logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app);
  const config = app.get<AppConfig>(APP_CONFIG);
  await app.listen(config.port);
  app.get(AppLogger).info('API listening', { port: config.port, swagger: config.swaggerEnabled ? '/api-docs' : 'disabled' });
}

void bootstrap();
