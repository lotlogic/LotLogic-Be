import { Module } from '@nestjs/common';
import { LotController } from './lot.controller';
import { LotService } from './lot.service';

@Module({
  controllers: [LotController],
  providers: [LotService],
})
export class LotModule {}
