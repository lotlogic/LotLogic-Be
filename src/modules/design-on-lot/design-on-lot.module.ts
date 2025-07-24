import { Module } from '@nestjs/common';
import { DesignOnLotService } from './design-on-lot.service';
import { DesignOnLotController } from './design-on-lot.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DesignOnLotService],
  controllers: [DesignOnLotController],
})
export class DesignOnLotModule {} 