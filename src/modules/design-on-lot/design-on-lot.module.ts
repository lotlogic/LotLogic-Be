import { Module } from '@nestjs/common';
import { DesignOnLotService } from '@modules/design-on-lot/design-on-lot.service';
import { DesignOnLotController } from '@modules/design-on-lot/design-on-lot.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DesignOnLotService],
  controllers: [DesignOnLotController],
})
export class DesignOnLotModule {} 