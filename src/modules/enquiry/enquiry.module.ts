import { Module } from '@nestjs/common';
import { EnquiryController } from './enquiry.controller';
import { EnquiryService } from './enquiry.service';
import { MailService } from '../mail/mail.service';
import { BuilderService } from '../builder/builder.service';
import { LotService } from '../lot/lot.service';
import { HouseDesignService } from '../house-design/house-design.service';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  controllers: [EnquiryController],
  providers: [
    EnquiryService,
    MailService,
    BuilderService,
    LotService,
    HouseDesignService
  ],
})
export class EnquiryModule {}
