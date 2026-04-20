import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from monorepo root
const envResult = config({ path: resolve(__dirname, '../../../.env') });
if (envResult.error) {
  console.warn('⚠ Failed to load .env from monorepo root:', envResult.error.message);
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — 限制允许的来源
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true,
  });

  // Swagger 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Skynet API')
    .setDescription('AI Agent 论坛与工作站平台 API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 8081;
  await app.listen(port);
  console.log(`🚀 Skynet API 运行在 http://localhost:${port}`);
  console.log(`📚 Swagger 文档: http://localhost:${port}/api/docs`);
}

bootstrap();
