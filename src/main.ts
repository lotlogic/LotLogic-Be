import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { BigIntInterceptor } from '@/interceptors/bigint.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors();
  app.useGlobalInterceptors(new BigIntInterceptor());
  
  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  // Swagger configuration - ONLY existing API endpoints
  const config = new DocumentBuilder()
    .setTitle('LotLogic API')
    .setDescription('LotLogic Backend API Documentation - All existing endpoints with examples and testing capabilities')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health', 'Health check and system status endpoints')
    .addTag('estate', 'Estate management endpoints')
    .addTag('lot', 'Lot management and search endpoints')
    .addTag('floor-plan', 'House design and floor plan endpoints')
    .addTag('design-on-lot', 'Design compatibility calculation endpoints')
    .addTag('builder', 'Builder management endpoints')
    .addTag('enquiry', 'Customer enquiry management endpoints')
    .addTag('brand', 'Brand configuration and styling endpoints')
    .addTag('mail', 'Email service endpoints')
    .addTag('facade', 'Facade design endpoints (placeholder)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Setup Swagger with more explicit configuration
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        // Enable try it out by default
        req.tryItOutEnabled = true;
        return req;
      },
    },
    customSiteTitle: 'LotLogic API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = configService.get<number>('app.port') ?? 9000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Docker
  
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api/docs`);
  console.log(`🌐 Docker: API Documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
