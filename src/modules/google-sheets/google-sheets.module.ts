import { Module } from '@nestjs/common';
import { GoogleSheetsController } from '@modules/google-sheets/google-sheets.controller';
import { GoogleSheetsService } from '@modules/google-sheets/google-sheets.service';
import { DashboardReportService } from '@modules/google-sheets/dashboard-report.service';

@Module({
  controllers: [GoogleSheetsController],
  providers: [GoogleSheetsService, DashboardReportService],
  exports: [GoogleSheetsService],
})
export class GoogleSheetsModule {}
