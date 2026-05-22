import { Module } from '@nestjs/common';
import { FloorPlanService } from '@modules/floor-plan/floor-plan.service';
import { LotService } from '@modules/lot/lot.service';
import { FloorPlanController } from '@modules/floor-plan/floor-plan.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { DesignOnLotModule } from '@modules/design-on-lot/design-on-lot.module';
@Module({
  imports: [PrismaModule, DesignOnLotModule],
  providers: [FloorPlanService, LotService],
  controllers: [FloorPlanController]
})
export class FloorPlanModule {} 
