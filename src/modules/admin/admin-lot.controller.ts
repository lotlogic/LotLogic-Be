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

@UseGuards(EasyAuthGuard, RolesGuard, EstateScopeGuard)
@Controller('admin/lots')
export class AdminLotController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'EDITOR')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('estateId') estateId?: string,
  ) {
    const estateIdFilter = estateId ? parseBigIntId(estateId, 'estateId') : null;

    if (req.auth?.role === 'ADMIN') {
      return this.prisma.lot.findMany({
        where: estateIdFilter ? { estateId: estateIdFilter } : undefined,
        orderBy: { id: 'asc' },
      });
    }

    const estateIds = await this.prisma.userEstate.findMany({
      where: { userId: req.auth?.id },
      select: { estateId: true },
    });

    const allowedEstateIds = estateIds.map((item) => item.estateId);

    return this.prisma.lot.findMany({
      where: {
        estateId: {
          in: estateIdFilter ? [estateIdFilter] : allowedEstateIds,
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'EDITOR')
  @EstateScope({ lotIdParam: 'id' })
  async findOne(@Param('id') id: string) {
    return this.prisma.lot.findUnique({ where: { id: parseBigIntId(id, 'id') } });
  }

  @Post()
  @Roles('ADMIN', 'EDITOR')
  @EstateScope({ estateIdBody: 'estateId' })
  async create(@Body() data: Prisma.lotUncheckedCreateInput) {
    return this.prisma.lot.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN', 'EDITOR')
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
