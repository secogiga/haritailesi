import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security headers
  app.use(helmet());

  // Cookie parser — required for httpOnly auth cookies
  app.use(cookieParser());

  // CORS — Mutfak, Sahne, Web, Admin'e izin ver
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3001,http://localhost:3002,http://localhost:3003').split(','),
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
