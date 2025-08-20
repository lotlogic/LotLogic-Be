import { Module } from '@nestjs/common';
import { FloorPlanService } from './floor-plan.service';
import { LotService } from '../lot/lot.service';
import { ZoningService } from '../zoning/zoning.service';
import { FloorPlanController } from './floor-plan.controller';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  providers: [FloorPlanService, LotService, ZoningService],
  controllers: [FloorPlanController]
})
export class FloorPlanModule {} 