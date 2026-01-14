import { Module } from '@nestjs/common';
import { GeoService } from '@modules/geo/geo.service';
import { GeoController } from '@modules/geo/geo.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { LotCheckRulesService } from '@modules/geo/lotcheck-rules.service';

@Module({
  imports: [PrismaModule],
  providers: [GeoService, LotCheckRulesService],
  controllers: [GeoController],
})
export class GeoModule {}
