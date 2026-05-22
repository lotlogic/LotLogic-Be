import { Module } from '@nestjs/common';
import { MailModule } from '@modules/mail/mail.module';
import { DashboardReportService } from '@modules/monday/dashboard-report.service';
import { MondayController } from '@modules/monday/monday.controller';
import { MondayService } from '@modules/monday/monday.service';

@Module({
  imports: [MailModule],
  controllers: [MondayController],
  providers: [MondayService, DashboardReportService],
  exports: [MondayService, DashboardReportService],
})
export class MondayModule {}
