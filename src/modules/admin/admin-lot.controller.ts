import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { EstateScopeGuard } from '@/modules/auth/guards/estate-scope.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { EstateScope } from '@/modules/auth/decorators/estate-scope.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { parseBigIntId } from '@/modules/admin/admin.utils';

type LotWithGeometryRow = {
  id: bigint;
  blockKey: string;
  blockNumber: number | null;
  sectionNumber: number | null;
  areaSqm: number;
  zoning: string;
  overlays: string[];
  address: string | null;
  district: string | null;
  division: string | null;
  lifecycleStage: string | null;
  geojson: Prisma.JsonValue | null;
  geometry: string | null;
  frontageCoordinate: string | null;
  estateId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
};

@UseGuards(EasyAuthGuard, RolesGuard, EstateScopeGuard)
@Controller('admin/lots')
export class AdminLotController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'USER')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('estateId') estateId?: string,
  ) {
    const estateIdFilter = estateId ? parseBigIntId(estateId, 'estateId') : null;

    if (req.auth?.role === 'ADMIN') {
      const adminWhereClause = estateIdFilter
        ? Prisma.sql`WHERE "estateId" = ${estateIdFilter}`
        : Prisma.sql``;

      const lots = await this.prisma.$queryRaw<LotWithGeometryRow[]>`
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
          ST_AsGeoJSON("frontageCoordinate") as "frontageCoordinate",
          "createdAt",
          "updatedAt"
        FROM
          lot
        ${adminWhereClause}
        ORDER BY id
      `;

      return lots.map((lot) => ({
        ...lot,
        geometry: lot.geometry ? JSON.parse(lot.geometry) : null,
        frontageCoordinate: lot.frontageCoordinate
          ? JSON.parse(lot.frontageCoordinate)
          : null,
      }));
    }

    const estateIds = await this.prisma.userEstate.findMany({
      where: { userId: req.auth?.id },
      select: { estateId: true },
    });

    const allowedEstateIds = estateIds.map((item) => item.estateId);

    const estateIdsForQuery = estateIdFilter ? [estateIdFilter] : allowedEstateIds;

    if (estateIdsForQuery.length === 0) {
      return [];
    }

    const userWhereClause = Prisma.sql`WHERE "estateId" IN (${Prisma.join(
      estateIdsForQuery,
    )})`;

    const lots = await this.prisma.$queryRaw<LotWithGeometryRow[]>`
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
        ST_AsGeoJSON("frontageCoordinate") as "frontageCoordinate",
        "createdAt",
        "updatedAt"
      FROM
        lot
      ${userWhereClause}
      ORDER BY id
    `;

    return lots.map((lot) => ({
      ...lot,
      geometry: lot.geometry ? JSON.parse(lot.geometry) : null,
      frontageCoordinate: lot.frontageCoordinate
        ? JSON.parse(lot.frontageCoordinate)
        : null,
    }));
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @EstateScope({ lotIdParam: 'id' })
  async findOne(@Param('id') id: string) {
    const lotId = parseBigIntId(id, 'id');

    const lots = await this.prisma.$queryRaw<LotWithGeometryRow[]>`
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
        ST_AsGeoJSON("frontageCoordinate") as "frontageCoordinate",
        "createdAt",
        "updatedAt"
      FROM
        lot
      WHERE
        id = ${lotId}
    `;

    const lot = lots[0];

    if (!lot) {
      return null;
    }

    return {
      ...lot,
      geometry: lot.geometry ? JSON.parse(lot.geometry) : null,
      frontageCoordinate: lot.frontageCoordinate
        ? JSON.parse(lot.frontageCoordinate)
        : null,
    };
  }

  @Post()
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdBody: 'estateId' })
  async create(@Body() data: Prisma.lotUncheckedCreateInput) {
    return this.prisma.lot.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN', 'USER')
  @EstateScope({ lotIdParam: 'id' })
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.lotUncheckedUpdateInput,
  ) {
    return this.prisma.lot.update({
      where: { id: parseBigIntId(id, 'id') },
      data,
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.prisma.lot.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
  }
}
