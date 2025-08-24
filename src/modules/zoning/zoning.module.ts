import { Module } from '@nestjs/common';
import { ZoningService } from '@modules/zoning/zoning.service';

@Module({
  providers: [ZoningService],
  exports: [ZoningService],
})
export class ZoningModule {}
