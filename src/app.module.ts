import { Module } from '@nestjs/common';
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
      BrandModule
    ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}