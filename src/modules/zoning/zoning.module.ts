import { Module } from '@nestjs/common';
import { ZoningService } from './zoning.service';

@Module({
  providers: [ZoningService],
  exports: [ZoningService],
})
export class ZoningModule {}
