import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './v1/app.module';
import cookieParser from 'cookie-parser';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as express from 'express';
import { HttpExceptionFilter } from './v1/common/filters/http-exception.filter';
import { ResponseInterceptor } from './v1/common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api/v1');
  app.use(cookieParser());
  app.use(express.json());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost.httpAdapter));
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
