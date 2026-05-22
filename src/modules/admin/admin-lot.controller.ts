import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DesignOnLotStatus, Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { EstateScopeGuard } from '@/modules/auth/guards/estate-scope.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { EstateScope } from '@/modules/auth/decorators/estate-scope.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { parseBigIntId } from '@/modules/admin/admin.utils';
import { DesignOnLotService } from '@/modules/design-on-lot/design-on-lot.service';
import { normalizeLotLifecycleStage } from '@/modules/lot/lot-lifecycle';
import { normalizeLotSalesModeOrThrow } from '@/modules/lot/lot-sales-mode';

type LotWithGeometryRow = {
  id: bigint;
  blockKey: string;
  blockNumber: number | null;
  sectionNumber: number | null;
  areaSqm: number;
  salesMode: string | null;
  price: number | null;
  houseAndLandFloorPlanId: bigint | null;
  frontageM: number | null;
  lotType: string | null;
  roadFacing: string | null;
  precinct: string | null;
  zoning: string;
  overlays: string[];
  address: string | null;
  district: string | null;
  division: string | null;
  lifecycleStage: string | null;
  ruleOverrides: Prisma.JsonValue | null;
  geojson: Prisma.JsonValue | null;
  geometry: string | null;
  frontageCoordinate: string | null;
  estateId: bigint | null;
  createdAt: Date;
  updatedAt: Date;
};

type FrontageLineString = {
  type: 'LineString';
  coordinates: [number, number][];
};

const unwrapSetInputValue = (value: unknown) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.prototype.hasOwnProperty.call(value, 'set')
    ? (value as { set?: unknown }).set
    : value;

const parseFrontageCoordinateInput = (
  value: unknown,
  fieldName: string,
): FrontageLineString | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const unwrapped = unwrapSetInputValue(value);
  if (unwrapped === undefined) {
    return undefined;
  }
  if (unwrapped === null || unwrapped === '') {
    return null;
  }

  let parsed: unknown = unwrapped;
  if (typeof unwrapped === 'string') {
    try {
      parsed = JSON.parse(unwrapped);
    } catch {
      throw new BadRequestException(
        `Invalid ${fieldName}. Expected valid GeoJSON LineString JSON.`,
      );
    }
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    (parsed as { type?: unknown }).type !== 'LineString' ||
    !Array.isArray((parsed as { coordinates?: unknown }).coordinates)
  ) {
    throw new BadRequestException(
      `Invalid ${fieldName}. Expected a GeoJSON LineString.`,
    );
  }

  const coordinates = (parsed as { coordinates: unknown[] }).coordinates.map(
    (coordinate) => {
      if (
        !Array.isArray(coordinate) ||
        coordinate.length < 2 ||
        !Number.isFinite(Number(coordinate[0])) ||
        !Number.isFinite(Number(coordinate[1]))
      ) {
        throw new BadRequestException(
          `Invalid ${fieldName}. Expected numeric [lng, lat] coordinate pairs.`,
        );
      }

      return [Number(coordinate[0]), Number(coordinate[1])] as [number, number];
    },
  );

  if (coordinates.length < 2) {
    throw new BadRequestException(
      `Invalid ${fieldName}. Expected at least two coordinate pairs.`,
    );
  }

  return {
    type: 'LineString',
    coordinates,
  };
};

const extractFrontageCoordinateFromGeojson = (geojson: unknown): unknown => {
  const unwrapped = unwrapSetInputValue(geojson);
  if (!unwrapped || typeof unwrapped !== 'object' || Array.isArray(unwrapped)) {
    return undefined;
  }

  const lotMetadata = (unwrapped as Record<string, unknown>).lotMetadata;
  if (!lotMetadata || typeof lotMetadata !== 'object' || Array.isArray(lotMetadata)) {
    return undefined;
  }

  return (lotMetadata as Record<string, unknown>).frontageCoordinate;
};

const normalizeLifecycleStageInput = (
  value: unknown,
  fieldName: string,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const unwrapped =
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, 'set')
      ? (value as { set?: unknown }).set
      : value;

  if (unwrapped === undefined) {
    return undefined;
  }
  if (unwrapped === null) {
    return null;
  }

  const normalized = normalizeLotLifecycleStage(unwrapped);
  if (!normalized) {
    throw new BadRequestException(
      `Invalid ${fieldName}. Expected one of: available, reserved, sold.`,
    );
  }

  return normalized;
};

const normalizeSalesModeInput = (
  value: unknown,
  fieldName: string,
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const unwrapped =
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, 'set')
      ? (value as { set?: unknown }).set
      : value;

  if (unwrapped === undefined) {
    return undefined;
  }
  if (unwrapped === null) {
    throw new BadRequestException(
      `Invalid ${fieldName}. Expected one of: land_sale, house_and_land.`,
    );
  }

  return normalizeLotSalesModeOrThrow(unwrapped, fieldName);
};

const normalizePriceInput = (
  value: unknown,
  fieldName: string,
): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const unwrapped =
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, 'set')
      ? (value as { set?: unknown }).set
      : value;

  if (unwrapped === undefined) {
    return undefined;
  }
  if (unwrapped === null || unwrapped === '') {
    return null;
  }

  const parsed = Number(unwrapped);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new BadRequestException(
      `Invalid ${fieldName}. Expected a whole-dollar amount.`,
    );
  }

  return parsed;
};

const normalizeHouseAndLandFloorPlanIdInput = (
  value: unknown,
  fieldName: string,
): bigint | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const unwrapped = unwrapSetInputValue(value);
  if (unwrapped === undefined) {
    return undefined;
  }
  if (unwrapped === null || unwrapped === '') {
    return null;
  }

  return parseBigIntId(unwrapped, fieldName);
};

@UseGuards(EasyAuthGuard, RolesGuard, EstateScopeGuard)
@Controller('admin/lots')
export class AdminLotController {
  constructor(
    private prisma: PrismaService,
    private designOnLotService: DesignOnLotService,
  ) {}

  private mapLotRow(lot: LotWithGeometryRow) {
    return {
      ...lot,
      houseAndLandFloorPlanId: lot.houseAndLandFloorPlanId?.toString() ?? null,
      geometry: lot.geometry ? JSON.parse(lot.geometry) : null,
      frontageCoordinate: lot.frontageCoordinate
        ? JSON.parse(lot.frontageCoordinate)
        : null,
    };
  }

  private mapApprovedFloorPlanRow(row: Prisma.designOnLotGetPayload<{
    include: {
      floorPlan: {
        include: {
          builder: { select: { id: true; name: true } };
          facades: { select: { id: true; label: true; imageUrl: true } };
        };
      };
    };
  }>) {
    return {
      designOnLotId: row.id.toString(),
      lotId: row.lotId.toString(),
      floorPlanId: row.floorPlanId.toString(),
      floorPlan: {
        ...row.floorPlan,
        id: row.floorPlan.id.toString(),
        builderId: row.floorPlan.builderId.toString(),
        builder: row.floorPlan.builder
          ? {
              ...row.floorPlan.builder,
              id: row.floorPlan.builder.id.toString(),
            }
          : null,
        facades: row.floorPlan.facades.map((facade) => ({
          ...facade,
          id: facade.id.toString(),
        })),
      },
    };
  }

  private async isApprovedFloorPlanForLot(lotId: bigint, floorPlanId: bigint) {
    const record = await this.prisma.designOnLot.findFirst({
      where: {
        lotId,
        floorPlanId,
        isCompatible: true,
        status: DesignOnLotStatus.PASS,
      },
      select: { id: true },
    });

    return Boolean(record);
  }

  private async assertApprovedFloorPlanForLot(
    lotId: bigint,
    floorPlanId: bigint,
  ) {
    await this.designOnLotService.ensureLotEvaluationCurrent(lotId);
    const isApproved = await this.isApprovedFloorPlanForLot(lotId, floorPlanId);
    if (!isApproved) {
      throw new BadRequestException(
        'Selected House & Land floor plan must be an approved compatible floor plan for this lot.',
      );
    }
  }

  private async findLotRowById(lotId: bigint) {
    const lots = await this.prisma.$queryRaw<LotWithGeometryRow[]>`
      SELECT
        id,
        "blockKey",
        "blockNumber",
        "sectionNumber",
        "areaSqm",
        "salesMode",
        price,
        "houseAndLandFloorPlanId",
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
      WHERE
        id = ${lotId}
    `;

    return lots[0] ? this.mapLotRow(lots[0]) : null;
  }

  private async persistFrontageCoordinate(
    lotId: bigint,
    frontageCoordinate: FrontageLineString | null,
  ) {
    if (frontageCoordinate === null) {
      await this.prisma.$executeRaw`
        UPDATE lot
        SET "frontageCoordinate" = NULL
        WHERE id = ${lotId}
      `;
      return;
    }

    await this.prisma.$executeRaw`
      UPDATE lot
      SET "frontageCoordinate" = ST_SetSRID(
        ST_GeomFromGeoJSON(${JSON.stringify(frontageCoordinate)}),
        4326
      )
      WHERE id = ${lotId}
    `;
  }

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
          "salesMode",
          price,
          "houseAndLandFloorPlanId",
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
        ${adminWhereClause}
        ORDER BY id
      `;

      return lots.map((lot) => this.mapLotRow(lot));
    }

    const estateIds = await this.prisma.userEstate.findMany({
      where: { userId: req.auth?.id },
      select: { estateId: true },
    });

    const allowedEstateIds = estateIds.map((item) => item.estateId);

    const estateIdsForQuery = estateIdFilter
      ? allowedEstateIds.filter((id) => id === estateIdFilter)
      : allowedEstateIds;

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
        "salesMode",
        price,
        "houseAndLandFloorPlanId",
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
      ${userWhereClause}
      ORDER BY id
    `;

    return lots.map((lot) => this.mapLotRow(lot));
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @EstateScope({ lotIdParam: 'id' })
  async findOne(@Param('id') id: string) {
    const lotId = parseBigIntId(id, 'id');
    return this.findLotRowById(lotId);
  }

  @Get(':id/approved-floor-plans')
  @Roles('ADMIN', 'USER')
  @EstateScope({ lotIdParam: 'id' })
  async findApprovedFloorPlansForLot(@Param('id') id: string) {
    const lotId = parseBigIntId(id, 'id');
    await this.designOnLotService.ensureLotEvaluationCurrent(lotId);

    const rows = await this.prisma.designOnLot.findMany({
      where: {
        lotId,
        isCompatible: true,
        status: DesignOnLotStatus.PASS,
      },
      include: {
        floorPlan: {
          include: {
            builder: {
              select: {
                id: true,
                name: true,
              },
            },
            facades: {
              select: {
                id: true,
                label: true,
                imageUrl: true,
              },
              orderBy: { id: 'asc' },
            },
          },
        },
      },
      orderBy: { floorPlanId: 'asc' },
    });

    return rows.map((row) => this.mapApprovedFloorPlanRow(row));
  }

  @Post()
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdBody: 'estateId' })
  async create(
    @Body()
    data: Prisma.lotUncheckedCreateInput & {
      frontageCoordinate?: unknown;
      houseAndLandFloorPlanId?: unknown;
    },
  ) {
    const {
      frontageCoordinate: _frontageCoordinate,
      houseAndLandFloorPlanId: _houseAndLandFloorPlanId,
      ...createPayload
    } = data;
    const normalizedLifecycleStage = normalizeLifecycleStageInput(
      data.lifecycleStage,
      'lifecycleStage',
    );
    const normalizedSalesMode = normalizeSalesModeInput(
      data.salesMode,
      'salesMode',
    );
    const normalizedPrice = normalizePriceInput(data.price, 'price');
    const normalizedHouseAndLandFloorPlanId =
      normalizeHouseAndLandFloorPlanIdInput(
        data.houseAndLandFloorPlanId,
        'houseAndLandFloorPlanId',
      );
    const normalizedFrontageCoordinate = parseFrontageCoordinateInput(
      Object.prototype.hasOwnProperty.call(data, 'frontageCoordinate')
        ? data.frontageCoordinate
        : extractFrontageCoordinateFromGeojson(data.geojson),
      'frontageCoordinate',
    );

    const createData: Prisma.lotUncheckedCreateInput = {
      ...(createPayload as Prisma.lotUncheckedCreateInput),
      ...(normalizedLifecycleStage !== undefined
        ? { lifecycleStage: normalizedLifecycleStage }
        : {}),
      ...(normalizedSalesMode !== undefined ? { salesMode: normalizedSalesMode } : {}),
      ...(normalizedPrice !== undefined ? { price: normalizedPrice } : {}),
    };

    if (normalizedHouseAndLandFloorPlanId !== undefined) {
      throw new BadRequestException(
        'Select a House & Land floor plan after the lot has been created.',
      );
    }

    const created = await this.prisma.lot.create({ data: createData });
    if (normalizedFrontageCoordinate !== undefined) {
      await this.persistFrontageCoordinate(created.id, normalizedFrontageCoordinate);
    }
    if (created.estateId) {
      await this.designOnLotService.recomputeForLotId(created.id);
    }
    return this.findLotRowById(created.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'USER')
  @EstateScope({ lotIdParam: 'id' })
  async update(
    @Param('id') id: string,
    @Body()
    data: Prisma.lotUncheckedUpdateInput & {
      frontageCoordinate?: unknown;
      houseAndLandFloorPlanId?: unknown;
    },
  ) {
    const {
      frontageCoordinate: _frontageCoordinate,
      houseAndLandFloorPlanId: _houseAndLandFloorPlanId,
      ...updatePayload
    } = data;
    const lotId = parseBigIntId(id, 'id');
    const existingLot = await this.prisma.lot.findUnique({
      where: { id: lotId },
      select: {
        id: true,
        salesMode: true,
        houseAndLandFloorPlanId: true,
      },
    });
    if (!existingLot) {
      throw new BadRequestException('Lot not found');
    }
    const normalizedLifecycleStage = normalizeLifecycleStageInput(
      data.lifecycleStage,
      'lifecycleStage',
    );
    const normalizedSalesMode = normalizeSalesModeInput(
      data.salesMode,
      'salesMode',
    );
    const normalizedPrice = normalizePriceInput(data.price, 'price');
    const normalizedHouseAndLandFloorPlanId =
      normalizeHouseAndLandFloorPlanIdInput(
        data.houseAndLandFloorPlanId,
        'houseAndLandFloorPlanId',
      );
    const normalizedFrontageCoordinate = parseFrontageCoordinateInput(
      Object.prototype.hasOwnProperty.call(data, 'frontageCoordinate')
        ? data.frontageCoordinate
        : extractFrontageCoordinateFromGeojson(data.geojson),
      'frontageCoordinate',
    );

    const finalSalesMode = normalizedSalesMode ?? existingLot.salesMode;
    const nextHouseAndLandFloorPlanId =
      finalSalesMode === 'house_and_land'
        ? normalizedHouseAndLandFloorPlanId !== undefined
          ? normalizedHouseAndLandFloorPlanId
          : existingLot.houseAndLandFloorPlanId
        : null;

    if (
      finalSalesMode !== 'house_and_land' &&
      normalizedHouseAndLandFloorPlanId
    ) {
      throw new BadRequestException(
        'House & Land floor plan can only be selected when salesMode is house_and_land.',
      );
    }

    if (nextHouseAndLandFloorPlanId) {
      await this.assertApprovedFloorPlanForLot(
        existingLot.id,
        nextHouseAndLandFloorPlanId,
      );
    }

    const updateData: Prisma.lotUncheckedUpdateInput = {
      ...(updatePayload as Prisma.lotUncheckedUpdateInput),
      ...(normalizedLifecycleStage !== undefined
        ? { lifecycleStage: normalizedLifecycleStage }
        : {}),
      ...(normalizedSalesMode !== undefined ? { salesMode: normalizedSalesMode } : {}),
      ...(normalizedPrice !== undefined ? { price: normalizedPrice } : {}),
      houseAndLandFloorPlanId: nextHouseAndLandFloorPlanId,
    };

    const updated = await this.prisma.lot.update({
      where: { id: lotId },
      data: updateData,
    });
    if (normalizedFrontageCoordinate !== undefined) {
      await this.persistFrontageCoordinate(updated.id, normalizedFrontageCoordinate);
    }
    if (updated.estateId) {
      await this.designOnLotService.recomputeForLotId(updated.id);
    }
    return this.findLotRowById(updated.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.prisma.lot.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
  }
}
