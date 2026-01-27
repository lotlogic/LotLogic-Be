import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { BigIntInterceptor } from '@/interceptors/bigint.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Explicitly include PATCH/OPTIONS so admin mutations work in preflight.
  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-zumo-auth',
      'x-ms-client-principal',
      'x-ms-token-aad-id-token',
    ],
    exposedHeaders: ['x-ms-client-principal', 'x-ms-token-aad-id-token'],
  });
  app.useGlobalInterceptors(new BigIntInterceptor());
  
  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  console.log(`🚀 Server is running on http://localhost:${port}`);
}
bootstrap();
