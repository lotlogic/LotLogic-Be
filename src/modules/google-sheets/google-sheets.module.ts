import { Module } from '@nestjs/common';
import { GoogleSheetsController } from '@modules/google-sheets/google-sheets.controller';
import { GoogleSheetsService } from '@modules/google-sheets/google-sheets.service';
import { DashboardReportService } from '@modules/google-sheets/dashboard-report.service';
import { MailModule } from '@modules/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [GoogleSheetsController],
  providers: [GoogleSheetsService, DashboardReportService],
  exports: [GoogleSheetsService],
})
export class GoogleSheetsModule {}
