import { Module } from '@nestjs/common';
import { LotController } from '@modules/lot/lot.controller';
import { LotService } from '@modules/lot/lot.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { DesignOnLotModule } from '@modules/design-on-lot/design-on-lot.module';

@Module({
  imports: [PrismaModule, DesignOnLotModule],
  controllers: [LotController],
  providers: [LotService],
  exports: [LotService],
})
export class LotModule {}
