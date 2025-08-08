// // src/modules/lot/lot.service.ts
// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { Prisma } from 'generated/prisma';

// @Injectable()
// export class LotService {
//   constructor(private prisma: PrismaService) {} // Now using PrismaService

//   async createLot(data: {
//     blockKey: string;
//     geojson: object;
//     estateId?: string;
//   }) {
//     return this.prisma.lot.create({
//       data: {
//         blockKey: data.blockKey,
//         geojson: data.geojson as Prisma.InputJsonValue,
//         geometry: data.geojson as Prisma.InputJsonValue,
//         ...(data.estateId && { estate: { connect: { id: data.estateId } })
//       }
//     });
//   }
// }


// src/modules/lot/lot.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import { Prisma } from 'generated/prisma';
@Injectable()
export class LotService {
  constructor(private prisma: PrismaService) {}

  async createLot(data: {
    blockKey: string;
    geojson: object;
    estateId?: string;
  }) {
    // Use raw query to bypass Prisma's type limitations
    return this.prisma.$executeRaw`
      INSERT INTO "Lot" (
        "blockKey", 
        geometry, 
        geojson,
        ${data.estateId ? '"estateId"' : ''}
      )
      VALUES (
        ${data.blockKey},
        ST_GeomFromGeoJSON(${JSON.stringify(data.geojson)}),
        ${JSON.stringify(data.geojson)}::jsonb
        ${data.estateId ? `, ${data.estateId}` : ''}
      )
      RETURNING *;
    `;
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