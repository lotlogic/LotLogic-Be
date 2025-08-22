import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface DatabaseLot {
  id: bigint;
  blockKey: string;
  blockNumber: number | null;
  sectionNumber: number | null;
  areaSqm: number;
  zoning: string;
  address: string | null;
  district: string | null;
  division: string | null;
  lifecycleStage: string | null;
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
        zoning,
        address,
        district,
        division,
        "lifecycleStage",
        "estateId",
        overlays,
        geojson,
        ST_AsGeoJSON(geometry) as geometry,
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

  async findLot(lotId: number) {
    const lot = await this.prisma.lot.findUnique({
      where: {
        id: lotId
      }
    });
    if (lot) {
      return {
        ...lot,
        id: lot.id.toString(),
        estateId: lot.estateId?.toString()
      };
    }
    return lot;
  }
}