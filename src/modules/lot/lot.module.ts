import { Module } from '@nestjs/common';
import { LotController } from '@modules/lot/lot.controller';
import { LotService } from '@modules/lot/lot.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LotController],
  providers: [LotService],
  exports: [LotService],
})
export class LotModule {}
