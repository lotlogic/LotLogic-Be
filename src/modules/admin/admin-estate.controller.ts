import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
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
@Controller('admin/estates')
export class AdminEstateController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'EDITOR')
  async findAll(@Req() req: AuthenticatedRequest) {
    if (req.auth?.role === 'ADMIN') {
      return this.prisma.estate.findMany({ orderBy: { id: 'asc' } });
    }

    const estateIds = await this.prisma.userEstate.findMany({
      where: { userId: req.auth?.id },
      select: { estateId: true },
    });

    return this.prisma.estate.findMany({
      where: { id: { in: estateIds.map((item) => item.estateId) } },
      orderBy: { id: 'asc' },
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'EDITOR')
  @EstateScope({ estateIdParam: 'id' })
  async findOne(@Param('id') id: string) {
    return this.prisma.estate.findUnique({ where: { id: parseBigIntId(id, 'id') } });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: Prisma.estateCreateInput) {
    return this.prisma.estate.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.estateUpdateInput,
  ) {
    return this.prisma.estate.update({
      where: { id: parseBigIntId(id, 'id') },
      data,
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.prisma.estate.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
  }
}
