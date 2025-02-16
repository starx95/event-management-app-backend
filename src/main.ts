import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsConfig } from "./cors.config"
import * as express from 'express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  app.use(cookieParser());
  app.enableCors(corsConfig)
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
