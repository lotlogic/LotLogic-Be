import { Module } from '@nestjs/common';
import { EnquiryController } from '@modules/enquiry/enquiry.controller';
import { EnquiryService } from '@modules/enquiry/enquiry.service';
import { MailService } from '@modules/mail/mail.service';
import { BuilderService } from '@modules/builder/builder.service';
import { LotService } from '@modules/lot/lot.service';
import { FloorPlanService } from '@modules/floor-plan/floor-plan.service';
import { PrismaModule } from '@/prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  controllers: [EnquiryController],
  providers: [
    EnquiryService,
    MailService,
    BuilderService,
    LotService,
    FloorPlanService
  ],
})
export class EnquiryModule {}
