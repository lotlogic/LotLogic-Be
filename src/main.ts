import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Response } from 'express';
import { BigIntInterceptor } from './interceptors/bigint.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.useGlobalInterceptors(new BigIntInterceptor());
  
  app.useStaticAssets(join(__dirname, '..', '..', 'public'), {
    setHeaders: (res: Response) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  console.log(`🚀 Server is running on http://localhost:${port}`);
}
bootstrap();
