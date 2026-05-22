import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from '@modules/geo/geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('act-zone')
  async getActLandUseZone(
    @Query('address') address?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const latNum =
      typeof lat === 'string' && lat.trim() ? Number(lat.trim()) : undefined;
    const lngNum =
      typeof lng === 'string' && lng.trim() ? Number(lng.trim()) : undefined;

    return await this.geoService.lookupActLandUseZone({
      address,
      lat: latNum,
      lng: lngNum,
    });
  }
}

