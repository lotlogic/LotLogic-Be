import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/floor-plans')
export class AdminFloorPlanController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.prisma.floorPlan.findMany({ orderBy: { id: 'asc' } });
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    return this.prisma.floorPlan.findUnique({
      where: { id: parseBigIntId(id, 'id') },
    });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: Prisma.floorPlanCreateInput) {
    return this.prisma.floorPlan.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.floorPlanUpdateInput,
  ) {
    return this.prisma.floorPlan.update({
      where: { id: parseBigIntId(id, 'id') },
      data,
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.prisma.floorPlan.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
  }
}
