import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { BigIntInterceptor } from '@/interceptors/bigint.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const allowMethods = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
  const allowHeaders =
    'Content-Type,Authorization,x-zumo-auth,x-ms-client-principal,x-ms-token-aad-id-token';

  // Some Azure layers respond to OPTIONS early; set the key headers ourselves.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', allowMethods);
    res.header('Access-Control-Allow-Headers', allowHeaders);
    res.header(
      'Vary',
      'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
    );
    if (req.method === 'OPTIONS') {
      res.status(204).send();
      return;
    }
    next();
  });

  // Explicitly include PATCH/DELETE/OPTIONS so admin mutations work in preflight.
  app.enableCors({
    origin: true,
    methods: allowMethods.split(','),
    allowedHeaders: allowHeaders.split(','),
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
