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

@UseGuards(EasyAuthGuard, RolesGuard, BuilderScopeGuard)
@Controller('admin/facades')
export class AdminFacadeController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'USER')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('builderId') builderId?: string,
    @Query('floorPlanId') floorPlanId?: string,
  ) {
    const builderIdFilter = builderId ? parseBigIntId(builderId, 'builderId') : null;
    const floorPlanIdFilter = floorPlanId
      ? parseBigIntId(floorPlanId, 'floorPlanId')
      : null;

    if (req.auth?.role === 'ADMIN') {
      const where: Prisma.facadeWhereInput = {};
      if (floorPlanIdFilter) {
        where.floorPlanId = floorPlanIdFilter;
      }
      if (builderIdFilter) {
        where.floorPlan = { builderId: builderIdFilter };
      }
      return this.prisma.facade.findMany({ where, orderBy: { id: 'asc' } });
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

    const where: Prisma.facadeWhereInput = {
      floorPlan: { builderId: { in: builderIdsForQuery } },
    };
    if (floorPlanIdFilter) {
      where.floorPlanId = floorPlanIdFilter;
    }

    return this.prisma.facade.findMany({ where, orderBy: { id: 'asc' } });
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ facadeIdParam: 'id' })
  async findOne(@Param('id') id: string) {
    return this.prisma.facade.findUnique({
      where: { id: parseBigIntId(id, 'id') },
    });
  }

  @Post()
  @Roles('ADMIN', 'USER')
  @BuilderScope({ floorPlanIdBody: 'floorPlanId' })
  async create(@Body() data: Prisma.facadeUncheckedCreateInput) {
    return this.prisma.facade.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ facadeIdParam: 'id' })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: Prisma.facadeUncheckedUpdateInput,
  ) {
    if (req.auth?.role !== 'ADMIN' && data.floorPlanId !== undefined) {
      throw new BadRequestException('floorPlanId cannot be updated');
    }

    return this.prisma.facade.update({
      where: { id: parseBigIntId(id, 'id') },
      data,
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ facadeIdParam: 'id' })
  async remove(@Param('id') id: string) {
    return this.prisma.facade.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
  }
}
