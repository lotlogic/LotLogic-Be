import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/lot-zoning-rules')
export class AdminLotZoningRuleController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN')
  async findAll(
    @Query('lotId') lotId?: string,
    @Query('zoningRuleId') zoningRuleId?: string,
  ) {
    const where: Prisma.lotZoningRuleWhereInput = {};
    if (lotId) where.lotId = parseBigIntId(lotId, 'lotId');
    if (zoningRuleId) where.zoningRuleId = parseBigIntId(zoningRuleId, 'zoningRuleId');

    return this.prisma.lotZoningRule.findMany({ where });
  }

  @Get(':lotId/:zoningRuleId')
  @Roles('ADMIN')
  async findOne(
    @Param('lotId') lotId: string,
    @Param('zoningRuleId') zoningRuleId: string,
  ) {
    return this.prisma.lotZoningRule.findUnique({
      where: {
        lotId_zoningRuleId: {
          lotId: parseBigIntId(lotId, 'lotId'),
          zoningRuleId: parseBigIntId(zoningRuleId, 'zoningRuleId'),
        },
      },
    });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: Prisma.lotZoningRuleUncheckedCreateInput) {
    return this.prisma.lotZoningRule.create({ data });
  }

  @Patch(':lotId/:zoningRuleId')
  @Roles('ADMIN')
  async update(
    @Param('lotId') lotId: string,
    @Param('zoningRuleId') zoningRuleId: string,
    @Body() data: Prisma.lotZoningRuleUncheckedUpdateInput,
  ) {
    return this.prisma.lotZoningRule.update({
      where: {
        lotId_zoningRuleId: {
          lotId: parseBigIntId(lotId, 'lotId'),
          zoningRuleId: parseBigIntId(zoningRuleId, 'zoningRuleId'),
        },
      },
      data,
    });
  }

  @Delete(':lotId/:zoningRuleId')
  @Roles('ADMIN')
  async remove(
    @Param('lotId') lotId: string,
    @Param('zoningRuleId') zoningRuleId: string,
  ) {
    return this.prisma.lotZoningRule.delete({
      where: {
        lotId_zoningRuleId: {
          lotId: parseBigIntId(lotId, 'lotId'),
          zoningRuleId: parseBigIntId(zoningRuleId, 'zoningRuleId'),
        },
      },
    });
  }
}
