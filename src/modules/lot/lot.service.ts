import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface DatabaseLot {
  id: bigint;
  blockKey: string;
  blockNumber: number | null;
  sectionNumber: number | null;
  areaSqm: number;
  frontageM: number | null;
  lotType: string | null;
  roadFacing: string | null;
  precinct: string | null;
  zoning: string;
  address: string | null;
  district: string | null;
  division: string | null;
  lifecycleStage: string | null;
  ruleOverrides: unknown;
  estateId: bigint | null;
  overlays: string[];
  geojson: any;
  geometry: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class LotService {
  constructor(private prisma: PrismaService) {}

  async createLot(data: {
    blockKey: string;
    geojson: any;
    estateId?: string;
  }) {
    return await this.prisma.lot.create({
      data: {
        blockKey: data.blockKey,
        geojson: data.geojson,
        estateId: data.estateId ? BigInt(data.estateId) : null,
        areaSqm: 0, // You might want to calculate this
        zoning: '', // You might want to set this
      },
    });
  }

  async findAllLots() {
    const lots = await this.prisma.$queryRaw<DatabaseLot[]>`
      SELECT
        id,
        "blockKey",
        "blockNumber",
        "sectionNumber",
        "areaSqm",
        "frontageM",
        "lotType",
        "roadFacing",
        "precinct",
        zoning,
        address,
        district,
        division,
        "lifecycleStage",
        "ruleOverrides",
        "estateId",
        overlays,
        geojson,
        ST_AsGeoJSON(geometry) as geometry,
        ST_AsGeoJSON("frontageCoordinate") as "frontageCoordinate",
        "createdAt",
        "updatedAt"
      FROM
        lot
      ORDER BY id
    `;

    return lots.map((lot) => ({
      ...lot,
      id: lot.id.toString(),
      estateId: lot.estateId?.toString(),
      geometry: JSON.parse(lot.geometry)
    }));
  }

  async findLot(lotId: number | bigint) {
    const lot: any = await this.prisma.$queryRawUnsafe(
      `SELECT
        id,
        "blockKey",
        "blockNumber",
        "sectionNumber",
        "areaSqm",
        "frontageM",
        "lotType",
        "roadFacing",
        "precinct",
        zoning,
        address,
        district,
        division,
        "lifecycleStage",
        "ruleOverrides",
        "estateId",
        overlays,
        geojson,
        ST_AsGeoJSON(geometry) as geometry,
        ST_AsGeoJSON("frontageCoordinate") as "frontageCoordinate"
      FROM
        lot
      WHERE
        id = $1`,lotId);
    
    if (lot && lot.length > 0) {
      const lotData = lot[0];
      
      // Get zoning setback data directly from zoning table
      let zoningSetbacks: any = null;
      if (lotData.zoning) {
        const zoneCode = lotData.zoning.split(":")[0];
        const zoningData: any = await this.prisma.zoningRule.findUnique({
          where: { code: zoneCode }
        });
        
        if (zoningData) {
          zoningSetbacks = {
            frontSetback: zoningData.minFrontSetback_m ,
            rearSetback: zoningData.minRearSetback_m ,
            sideSetback: zoningData.minSideSetback_m
          };
        }
      }
      
      return {
        ...lotData,
        id: lotData.id.toString(),
        estateId: lotData.estateId?.toString(),
        zoningSetbacks
      };
    }
    return null;
  }
}
