import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { LotModule } from '@modules/lot/lot.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { EstateModule } from '@modules/estate/estate.module';
import { EnquiryModule } from '@modules/enquiry/enquiry.module';
import { DesignOnLotModule } from '@modules/design-on-lot/design-on-lot.module';
import { FloorPlanModule } from '@modules/floor-plan/floor-plan.module';
import { MailModule } from '@modules/mail/mail.module';
import { BuilderModule } from '@modules/builder/builder.module';
import { FacadeModule } from '@modules/facade/facade.module';
import { BrandModule } from '@modules/brand/brand.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configs from './config';
import { LoggingMiddleware } from './middlewares/log.middleware';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configs,
      envFilePath: [
        `.env.${process.env.NODE_ENV || ''}`,
        '.env',
      ],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('app.throttle_ttl') || 60,  // in seconds
            limit: config.get<number>('app.throttle_limit') || 10, // requests per window
          },
        ],
      }),
    }),

    PrismaModule,
    EstateModule,
    LotModule,
    DesignOnLotModule,
    FloorPlanModule,
    EnquiryModule,
    MailModule,
    BuilderModule,
    FacadeModule,
    BrandModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // enable global rate limiting
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
