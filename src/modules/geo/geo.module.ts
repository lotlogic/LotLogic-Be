import { Module } from '@nestjs/common';
import { GeoService } from '@modules/geo/geo.service';

@Module({
  providers: [GeoService],
})
export class GeoModule {}
