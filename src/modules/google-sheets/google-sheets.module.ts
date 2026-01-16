import { Module } from '@nestjs/common';
import { GoogleSheetsController } from '@modules/google-sheets/google-sheets.controller';
import { GoogleSheetsService } from '@modules/google-sheets/google-sheets.service';

@Module({
  controllers: [GoogleSheetsController],
  providers: [GoogleSheetsService],
  exports: [GoogleSheetsService],
})
export class GoogleSheetsModule {}

