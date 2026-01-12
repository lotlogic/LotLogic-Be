import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

type GoogleGeocodingResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
};

type ActLandUseZoneRow = {
  objectId: number;
  zoneCode: string;
  properties: unknown;
};

type ActBlockRow = {
  objectId: number;
  blockKey: bigint;
  blockNumber: number;
  sectionNumber: number;
  derivedAreaSqm: bigint | null;
  properties: unknown;
};

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  async geocodeAddress(address: string): Promise<{
    formattedAddress: string;
    location: { lat: number; lng: number };
  }> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GOOGLE_MAPS_API_KEY is not configured',
      );
    }

    const trimmed = address.trim();
    if (!trimmed) {
      throw new BadRequestException('address is required');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', trimmed);
    url.searchParams.set(
      'region',
      process.env.GOOGLE_GEOCODING_REGION?.trim() || 'au',
    );
    url.searchParams.set(
      'components',
      process.env.GOOGLE_GEOCODING_COMPONENTS?.trim() || 'country:AU',
    );
    url.searchParams.set('key', apiKey);

    const res = await fetch(url);
    if (!res.ok) {
      throw new InternalServerErrorException(
        `Google geocoding failed (${res.status})`,
      );
    }

    const body = (await res.json()) as GoogleGeocodingResponse;
    if (body.status !== 'OK') {
      if (body.status === 'ZERO_RESULTS') {
        throw new NotFoundException('No geocoding results for that address');
      }
      throw new BadRequestException(
        body.error_message
          ? `Google geocoding error: ${body.error_message}`
          : `Google geocoding error: ${body.status}`,
      );
    }

    const first = body.results?.[0];
    const lat = first?.geometry?.location?.lat;
    const lng = first?.geometry?.location?.lng;
    const formattedAddress = first?.formatted_address ?? trimmed;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new InternalServerErrorException(
        'Google geocoding response missing lat/lng',
      );
    }

    return { formattedAddress, location: { lat, lng } };
  }

  async findActBlockByPoint(params: {
    lat: number;
    lng: number;
  }): Promise<ActBlockRow | null> {
    const { lat, lng } = params;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('lat and lng must be valid numbers');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('lat/lng out of range');
    }

    const rows = await this.prisma.$queryRaw<ActBlockRow[]>`
      SELECT
        "objectId",
        "blockKey",
        "blockNumber",
        "sectionNumber",
        "derivedAreaSqm",
        "properties"
      FROM "actBlock"
      WHERE
        "geometry" && ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        AND ST_Covers("geometry", ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
      ORDER BY COALESCE("derivedAreaSqm", 9223372036854775807) ASC
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async findActLandUseZoneByPoint(params: {
    lat: number;
    lng: number;
  }): Promise<ActLandUseZoneRow | null> {
    const { lat, lng } = params;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('lat and lng must be valid numbers');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('lat/lng out of range');
    }

    const rows = await this.prisma.$queryRaw<ActLandUseZoneRow[]>`
      SELECT
        "objectId",
        "zoneCode",
        "properties"
      FROM "actLandUseZone"
      WHERE
        "geometry" && ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        AND ST_Covers("geometry", ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
      ORDER BY ST_Area("geometry") ASC
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async lookupActLandUseZone(params: {
    address?: string;
    lat?: number;
    lng?: number;
  }): Promise<{
    location: { lat: number; lng: number };
    formattedAddress?: string;
    source: 'block' | 'zone';
    block: ActBlockRow | null;
    zone: ActLandUseZoneRow | null;
  }> {
    let location: { lat: number; lng: number } | null = null;
    let formattedAddress: string | undefined;

    if (typeof params.address === 'string' && params.address.trim()) {
      const geocoded = await this.geocodeAddress(params.address);
      location = geocoded.location;
      formattedAddress = geocoded.formattedAddress;
    } else if (
      typeof params.lat === 'number' &&
      typeof params.lng === 'number'
    ) {
      location = { lat: params.lat, lng: params.lng };
    } else {
      throw new BadRequestException('Provide either address OR lat+lng');
    }

    const [block, zone] = await Promise.all([
      this.findActBlockByPoint(location),
      this.findActLandUseZoneByPoint(location),
    ]);

    if (!block && !zone) {
      throw new NotFoundException(
        'No ACT block or land use zone found for that location (did you import the GeoJSON datasets?)',
      );
    }

    return {
      ...(formattedAddress ? { formattedAddress } : {}),
      location,
      source: block ? 'block' : 'zone',
      block,
      zone,
    };
  }
}
