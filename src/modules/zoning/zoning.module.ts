import { Module } from '@nestjs/common';
import { ZoningService } from './zoning.service';

@Module({
  providers: [ZoningService],
})
export class ZoningModule {}
