import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MondayModule } from '@modules/monday/monday.module';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({})
export class StripeModule {
  static forRootAsync(): DynamicModule {
    return {
      module: StripeModule,
      controllers: [StripeController],
      imports: [ConfigModule.forRoot(), MondayModule],
      providers: [
        StripeService,
        {
          provide: 'STRIPE_API_KEY',
          useFactory: async (configService: ConfigService) =>
            configService.get('STRIPE_API_KEY'),
          inject: [ConfigService],
        },
        {
          provide: 'STRIPE_SANDBOX_API_KEY',
          useFactory: async (configService: ConfigService) =>
            configService.get('STRIPE_SANDBOX_API_KEY'),
          inject: [ConfigService],
        },
      ],
    };
  }
}
