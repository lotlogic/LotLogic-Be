import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { BuilderScopeGuard } from '@/modules/auth/guards/builder-scope.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { BuilderScope } from '@/modules/auth/decorators/builder-scope.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';

type FloorPlanIdInput =
  | bigint
  | number
  | string
  | { set?: bigint | number | string };

function resolveFloorPlanIdInput(value: unknown): bigint | undefined {
  if (value === undefined) return undefined;
  if (value && typeof value === 'object') {
    if ('set' in value) {
      return parseBigIntId((value as { set?: unknown }).set, 'floorPlanId');
    }
    throw new BadRequestException('floorPlanId cannot be updated');
  }
  return parseBigIntId(value, 'floorPlanId');
}

@UseGuards(EasyAuthGuard, RolesGuard, BuilderScopeGuard)
@Controller('admin/floor-plans/:floorPlanId/facades')
export class AdminFloorPlanFacadeController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'floorPlanId' })
  async findAll(@Param('floorPlanId') floorPlanId: string) {
    const floorPlanIdParsed = parseBigIntId(floorPlanId, 'floorPlanId');
    return this.prisma.facade.findMany({
      where: { floorPlanId: floorPlanIdParsed },
      orderBy: { id: 'asc' },
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'floorPlanId' })
  async findOne(
    @Param('floorPlanId') floorPlanId: string,
    @Param('id') id: string,
  ) {
    const floorPlanIdParsed = parseBigIntId(floorPlanId, 'floorPlanId');
    const facadeIdParsed = parseBigIntId(id, 'id');
    return this.prisma.facade.findFirst({
      where: { id: facadeIdParsed, floorPlanId: floorPlanIdParsed },
    });
  }

  @Post()
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'floorPlanId' })
  async create(
    @Param('floorPlanId') floorPlanId: string,
    @Body() data: Prisma.facadeUncheckedCreateInput,
  ) {
    const floorPlanIdParsed = parseBigIntId(floorPlanId, 'floorPlanId');
    const bodyFloorPlanId = resolveFloorPlanIdInput(
      data.floorPlanId as FloorPlanIdInput,
    );

    if (bodyFloorPlanId !== undefined && bodyFloorPlanId !== floorPlanIdParsed) {
      throw new BadRequestException('floorPlanId must match URL');
    }

    return this.prisma.facade.create({
      data: { ...data, floorPlanId: floorPlanIdParsed },
    });
  }

  @Patch(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'floorPlanId' })
  async update(
    @Param('floorPlanId') floorPlanId: string,
    @Param('id') id: string,
    @Body() data: Prisma.facadeUncheckedUpdateInput,
  ) {
    const floorPlanIdParsed = parseBigIntId(floorPlanId, 'floorPlanId');
    const facadeIdParsed = parseBigIntId(id, 'id');
    const bodyFloorPlanId = resolveFloorPlanIdInput(
      data.floorPlanId as FloorPlanIdInput,
    );

    if (bodyFloorPlanId !== undefined && bodyFloorPlanId !== floorPlanIdParsed) {
      throw new BadRequestException('floorPlanId cannot be updated');
    }

    await this.ensureFacadeInFloorPlan(floorPlanIdParsed, facadeIdParsed);

    const { floorPlanId: _ignored, ...updateData } = data as Prisma.facadeUncheckedUpdateInput;

    return this.prisma.facade.update({
      where: { id: facadeIdParsed },
      data: updateData,
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdParam: 'floorPlanId' })
  async remove(
    @Param('floorPlanId') floorPlanId: string,
    @Param('id') id: string,
  ) {
    const floorPlanIdParsed = parseBigIntId(floorPlanId, 'floorPlanId');
    const facadeIdParsed = parseBigIntId(id, 'id');

    await this.ensureFacadeInFloorPlan(floorPlanIdParsed, facadeIdParsed);

    return this.prisma.facade.delete({
      where: { id: facadeIdParsed },
    });
  }

  private async ensureFacadeInFloorPlan(floorPlanId: bigint, facadeId: bigint) {
    const facade = await this.prisma.facade.findFirst({
      where: { id: facadeId, floorPlanId },
      select: { id: true },
    });
    if (!facade) {
      throw new BadRequestException('Facade not found for floor plan');
    }
  }
}
