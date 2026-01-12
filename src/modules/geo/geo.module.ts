import { Module } from '@nestjs/common';
import { GeoService } from '@modules/geo/geo.service';
import { GeoController } from '@modules/geo/geo.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GeoService],
  controllers: [GeoController],
})
export class GeoModule {}
