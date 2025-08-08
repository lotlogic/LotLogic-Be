import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface LotGeoProps {
  width?: number;
  depth?: number;
}

interface LotGeoJson {
  properties?: LotGeoProps;
}

interface DesignOnLotMatch {
  houseDesignId: string;
  floorplanUrl: string | null;
  spacing: {
    front: number | null;
    rear: number | null;
    side: number | null;
  };
  maxCoverageArea: number;
  houseArea: number;
  lotDimensions: {
    width?: number;
    depth?: number;
  };
}

export interface DesignOnLotResult {
  lotId: string;
  zoning: string;
  matches: DesignOnLotMatch[];
}

@Injectable()
export class DesignOnLotService {
  constructor(private prisma: PrismaService) {}

  async calculateCompatibility(lotId: string): Promise<DesignOnLotResult> {
    const lot = await this.prisma.lot.findUnique({
      where: { id: BigInt(lotId) },
      include: { lotZoningRules: { include: { zoningRule: true } } }
    });

    if (!lot) throw new NotFoundException('Lot not found');

    const zoningRule = lot.lotZoningRules[0]?.zoningRule;

    if (!zoningRule) throw new NotFoundException('Zoning rules not found');

    const houseDesigns = await this.prisma.houseDesign.findMany();

    const result: DesignOnLotMatch[] = [];
    for (const design of houseDesigns) {
      const fits = this.checkFit(lot, zoningRule, design);
      if (fits) {
        const geoProps: LotGeoProps =
          typeof lot.geojson === 'object' && lot.geojson && 'properties' in lot.geojson
            ? (lot.geojson as LotGeoJson).properties ?? {}
            : {};
        result.push({
          houseDesignId: design.id.toString(),
          floorplanUrl: design.floorplanUrl,
          spacing: {
            front: zoningRule.minFrontSetback_m ?? null,
            rear: zoningRule.minRearSetback_m ?? null,
            side: zoningRule.minSideSetback_m ?? null
          },
          maxCoverageArea: lot.areaSqm * (zoningRule.minFSR ?? 0.5),
          houseArea: design.areaSqm,
          lotDimensions: {
            width: geoProps?.width,
            depth: geoProps?.depth
          }
        });

        await this.prisma.designOnLot.upsert({
          where: { lotId_houseDesignId: { lotId: BigInt(lotId), houseDesignId: design.id } },
          create: { lotId: BigInt(lotId), houseDesignId: design.id, isCompatible: true, matchedFilters: {} },
          update: { isCompatible: true, matchedFilters: {} }
        });
      }
    }

    return {
      lotId: lot.id.toString(),
      zoning: zoningRule.code,
      matches: result
    };
  }

  checkFit(
    lot: { geojson?: unknown; areaSqm: number },
    zoningRule: { minSideSetback_m?: number | null; minFrontSetback_m?: number | null; minRearSetback_m?: number | null; minFSR?: number | null },
    design: { minLotWidth: number; minLotDepth: number; areaSqm: number }
  ): boolean {
    const geoProps: LotGeoProps =
      typeof lot.geojson === 'object' && lot.geojson && 'properties' in lot.geojson
        ? (lot.geojson as LotGeoJson).properties ?? {}
        : {};
    const width = geoProps?.width ?? 0;
    const depth = geoProps?.depth ?? 0;
    const area = lot.areaSqm;

    const usableWidth = width - 2 * (zoningRule.minSideSetback_m ?? 3);
    const usableDepth = depth - ((zoningRule.minFrontSetback_m ?? 4) + (zoningRule.minRearSetback_m ?? 6));
    const maxFSR = zoningRule.minFSR ?? 0.5;

    return (
      design.minLotWidth <= width &&
      design.minLotDepth <= depth &&
      design.areaSqm <= area * maxFSR &&
      design.areaSqm <= usableWidth * usableDepth
    );
  }
}