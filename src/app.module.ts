import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LotModule } from './modules/lot/lot.module';
import { PrismaModule } from './prisma/prisma.module';
import { EstateModule } from './modules/estate/estate.module';
import { EnquiryModule } from './modules/enquiry/enquiry.module';
import { DesignOnLotModule } from './modules/design-on-lot/design-on-lot.module';
import { HouseDesignModule } from './modules/house-design/house-design.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
      PrismaModule,
      EstateModule,
      LotModule,
      DesignOnLotModule,
      HouseDesignModule,
      EnquiryModule,
      MailModule
    ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}