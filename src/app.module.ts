import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { EstateModule } from './modules/estate/estate.module';
import { LotModule } from './modules/lot/lot.module';
import { DesignOnLotModule } from './modules/design-on-lot/design-on-lot.module';

@Module({
  imports: [PrismaModule, EstateModule, LotModule, DesignOnLotModule],
})
export class AppModule {}