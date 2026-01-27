import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { BrandModule } from '@modules/brand/brand.module';
import { BuilderModule } from '@modules/builder/builder.module';
import { DesignOnLotModule } from '@modules/design-on-lot/design-on-lot.module';
import { EnquiryModule } from '@modules/enquiry/enquiry.module';
import { EstateModule } from '@modules/estate/estate.module';
import { FacadeModule } from '@modules/facade/facade.module';
import { FloorPlanModule } from '@modules/floor-plan/floor-plan.module';
import { GeoModule } from '@modules/geo/geo.module';
import { GoogleSheetsModule } from '@modules/google-sheets/google-sheets.module';
import { LotModule } from '@modules/lot/lot.module';
import { MailModule } from '@modules/mail/mail.module';
import { AdminModule } from '@modules/admin/admin.module';
import { StripeModule } from '@modules/stripe/stripe.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
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
    GeoModule,
    GoogleSheetsModule,
    StripeModule.forRootAsync(),
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
