import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

interface DatabaseLot {
  id: bigint;
  blockKey: string;
  blockNumber: number | null;
  sectionNumber: number | null;
  areaSqm: number;
  salesMode: string | null;
  price: number | null;
  houseAndLandFloorPlanId: bigint | null;
  houseAndLandFloorPlanName: string | null;
  houseAndLandBuildPrice: number | null;
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
  frontageCoordinate: string | null;
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

  async findAllLots(estateId?: bigint | null) {
    const estateFilter =
      estateId === undefined || estateId === null
        ? Prisma.sql``
        : Prisma.sql`WHERE lot."estateId" = ${estateId}`;
    const lots = await this.prisma.$queryRaw<DatabaseLot[]>`
      SELECT
        lot.id,
        lot."blockKey",
        lot."blockNumber",
        lot."sectionNumber",
        lot."areaSqm",
        lot."salesMode",
        lot.price,
        lot."houseAndLandFloorPlanId",
        hlfp.name AS "houseAndLandFloorPlanName",
        hlfp.price AS "houseAndLandBuildPrice",
        lot."frontageM",
        lot."lotType",
        lot."roadFacing",
        lot."precinct",
        lot.zoning,
        lot.address,
        lot.district,
        lot.division,
        lot."lifecycleStage",
        lot."ruleOverrides",
        lot."estateId",
        lot.overlays,
        lot.geojson,
        ST_AsGeoJSON(lot.geometry) as geometry,
        ST_AsGeoJSON(lot."frontageCoordinate") as "frontageCoordinate",
        lot."createdAt",
        lot."updatedAt"
      FROM
        lot
      LEFT JOIN "floorPlan" hlfp ON hlfp.id = lot."houseAndLandFloorPlanId"
      ${estateFilter}
      ORDER BY lot.id
    `;

    return lots.map((lot) => ({
      ...lot,
      id: lot.id.toString(),
      estateId: lot.estateId?.toString(),
      houseAndLandFloorPlanId: lot.houseAndLandFloorPlanId?.toString() ?? null,
      geometry: JSON.parse(lot.geometry),
      frontageCoordinate: lot.frontageCoordinate,
    }));
  }

  async findLot(lotId: number | bigint) {
    const lot: any = await this.prisma.$queryRawUnsafe(
      `SELECT
        lot.id,
        lot."blockKey",
        lot."blockNumber",
        lot."sectionNumber",
        lot."areaSqm",
        lot."salesMode",
        lot.price,
        lot."houseAndLandFloorPlanId",
        hlfp.name AS "houseAndLandFloorPlanName",
        hlfp.price AS "houseAndLandBuildPrice",
        lot."frontageM",
        lot."lotType",
        lot."roadFacing",
        lot."precinct",
        lot.zoning,
        lot.address,
        lot.district,
        lot.division,
        lot."lifecycleStage",
        lot."ruleOverrides",
        lot."estateId",
        lot.overlays,
        lot.geojson,
        ST_AsGeoJSON(lot.geometry) as geometry,
        ST_AsGeoJSON(lot."frontageCoordinate") as "frontageCoordinate"
      FROM
        lot
      LEFT JOIN "floorPlan" hlfp ON hlfp.id = lot."houseAndLandFloorPlanId"
      WHERE
        lot.id = $1`,
      lotId,
    );
    
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
        houseAndLandFloorPlanId:
          lotData.houseAndLandFloorPlanId?.toString?.() ??
          lotData.houseAndLandFloorPlanId ??
          null,
        geometry: lotData.geometry ? JSON.parse(lotData.geometry) : null,
        frontageCoordinate: lotData.frontageCoordinate,
        zoningSetbacks
      };
    }
    return null;
  }
}
