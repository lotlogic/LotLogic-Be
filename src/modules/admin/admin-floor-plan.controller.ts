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
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { BuilderScopeGuard } from '@/modules/auth/guards/builder-scope.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { BuilderScope } from '@/modules/auth/decorators/builder-scope.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { parseBigIntId } from '@/modules/admin/admin.utils';
import { DesignOnLotService } from '@/modules/design-on-lot/design-on-lot.service';

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

const floorPlanInclude = {
  documents: {
    orderBy: { id: 'asc' as const },
  },
};

@UseGuards(EasyAuthGuard, RolesGuard, BuilderScopeGuard)
@Controller('admin/floor-plans')
export class AdminFloorPlanController {
  constructor(
    private prisma: PrismaService,
    private designOnLotService: DesignOnLotService,
  ) {}

  @Get()
  @Roles('ADMIN', 'USER')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('builderId') builderId?: string,
  ) {
    const builderIdFilter = builderId ? parseBigIntId(builderId, 'builderId') : null;

    if (req.auth?.role === 'ADMIN') {
      const where: Prisma.floorPlanWhereInput = builderIdFilter
        ? { builderId: builderIdFilter }
        : {};
      return this.prisma.floorPlan.findMany({
        where,
        include: floorPlanInclude,
        orderBy: { id: 'asc' },
      });
    }

    const builderIds = await this.prisma.builderUser.findMany({
      where: { userId: req.auth?.id },
      select: { builderId: true },
    });

    const allowedBuilderIds = builderIds.map((item) => item.builderId);
    const builderIdsForQuery = builderIdFilter
      ? allowedBuilderIds.filter((id) => id === builderIdFilter)
      : allowedBuilderIds;

    if (builderIdsForQuery.length === 0) {
      return [];
    }

    return this.prisma.floorPlan.findMany({
      where: { builderId: { in: builderIdsForQuery } },
      include: floorPlanInclude,
      orderBy: { id: 'asc' },
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'id' })
  async findOne(@Param('id') id: string) {
    return this.prisma.floorPlan.findUnique({
      where: { id: parseBigIntId(id, 'id') },
      include: floorPlanInclude,
    });
  }

  @Post()
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdBody: 'builderId' })
  async create(@Body() data: Prisma.floorPlanUncheckedCreateInput) {
    const normalizedPrice = normalizePriceInput(data.price, 'price');
    const createData: Prisma.floorPlanUncheckedCreateInput = {
      ...data,
      ...(normalizedPrice !== undefined ? { price: normalizedPrice } : {}),
    };

    const created = await this.prisma.floorPlan.create({ data: createData });
    await this.designOnLotService.recomputeForFloorPlan(created.id);
    return created;
  }

  @Patch(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'id' })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: Prisma.floorPlanUncheckedUpdateInput,
  ) {
    if (req.auth?.role !== 'ADMIN' && data.builderId !== undefined) {
      throw new BadRequestException('builderId cannot be updated');
    }

    const normalizedPrice = normalizePriceInput(data.price, 'price');
    const updateData: Prisma.floorPlanUncheckedUpdateInput = {
      ...data,
      ...(normalizedPrice !== undefined ? { price: normalizedPrice } : {}),
    };

    const updated = await this.prisma.floorPlan.update({
      where: { id: parseBigIntId(id, 'id') },
      data: updateData,
    });
    await this.designOnLotService.recomputeForFloorPlan(updated.id);
    return updated;
  }

  @Delete(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'id' })
  async remove(@Param('id') id: string) {
    return this.prisma.floorPlan.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
  }
}
