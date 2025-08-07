import { Module } from '@nestjs/common';
import { HouseDesignService } from './house-design.service';
import { LotService } from '../lot/lot.service';
import { ZoningService } from '../zoning/zoning.service';
import { HouseDesignController } from './house-design.controller';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  providers: [HouseDesignService, LotService, ZoningService],
  controllers: [HouseDesignController]
})
export class HouseDesignModule {} 