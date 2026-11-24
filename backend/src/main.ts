import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    // use to drop console log and debug on production
    console.log = () => {};
    console.debug = () => {};
  }
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser to configure custom limits
  });

  // Increase body size limit for file uploads and base64 images (100MB to handle base64 which is ~33% larger)
  const bodyLimit = process.env.BODY_LIMIT ?? '15mb';
  const express = require('express');
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ limit: bodyLimit, extended: true }));
  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw errors if non-whitelisted values are provided
      transform: true, // Transform payloads to be objects typed according to their DTO classes
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit conversion
      },
    }),
  );

  // Enable CORS for frontend origin
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Transbridge MSB API')
    .setDescription(
      'API documentation for MSB admin authentication and management',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
