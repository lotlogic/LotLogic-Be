import { Module } from '@nestjs/common';
import { FloorPlanService } from '@modules/floor-plan/floor-plan.service';
import { LotService } from '@modules/lot/lot.service';
import { ZoningService } from '@modules/zoning/zoning.service';
import { FloorPlanController } from '@modules/floor-plan/floor-plan.controller';
import { PrismaModule } from '@/prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  providers: [FloorPlanService, LotService, ZoningService],
  controllers: [FloorPlanController]
})
export class FloorPlanModule {} 