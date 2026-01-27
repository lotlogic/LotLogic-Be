import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';

interface EstateAssignmentBody {
  estateIds?: string[];
}

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUserController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.prisma.user.findMany({
      include: { estates: true },
      orderBy: { id: 'asc' },
    });
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id: parseBigIntId(id, 'id') },
      include: { estates: true },
    });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: Prisma.userCreateInput) {
    return this.prisma.user.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.userUpdateInput,
  ) {
    return this.prisma.user.update({
      where: { id: parseBigIntId(id, 'id') },
      data,
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.prisma.user.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
  }

  @Put(':id/estates')
  @Roles('ADMIN')
  async setEstates(@Param('id') id: string, @Body() body: EstateAssignmentBody) {
    const userId = parseBigIntId(id, 'id');
    const estateIds = (body.estateIds || []).map((estateId) =>
      parseBigIntId(estateId, 'estateId'),
    );

    await this.prisma.$transaction([
      this.prisma.userEstate.deleteMany({ where: { userId } }),
      this.prisma.userEstate.createMany({
        data: estateIds.map((estateId) => ({ userId, estateId })),
      }),
    ]);

    return this.prisma.userEstate.findMany({
      where: { userId },
      orderBy: { estateId: 'asc' },
    });
  }
}
