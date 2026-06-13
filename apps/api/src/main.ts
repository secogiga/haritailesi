import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Request logging — method, path, status, duration
  const httpLogger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const { method, originalUrl } = req;
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const { statusCode } = res;
      if (!originalUrl.startsWith('/api/v1/health')) {
        httpLogger.log(`${method} ${originalUrl} ${statusCode} +${ms}ms`);
      }
    });
    next();
  });

  // Security headers
  app.use(helmet());

  // Cookie parser — required for httpOnly auth cookies
  app.use(cookieParser());

  // CORS — Mutfak, Sahne, Web, Admin'e izin ver
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004').split(','),
    credentials: true,
  });

  // Global prefix + versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger — only in non-production environments
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('haritailesi API')
      .setDescription('Haritailesi Mutfak & Sahne platform API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addServer(`http://localhost:${port}`, 'Local')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);

  if (nodeEnv !== 'production') {
    console.warn(`API listening on http://localhost:${port}/api/v1`);
    console.warn(`Swagger docs at http://localhost:${port}/api/docs`);
  }
}

bootstrap();
