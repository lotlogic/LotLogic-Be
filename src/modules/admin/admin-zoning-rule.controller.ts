import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';
import { DesignOnLotService } from '@/modules/design-on-lot/design-on-lot.service';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/zoning-rules')
export class AdminZoningRuleController {
  constructor(
    private prisma: PrismaService,
    private designOnLotService: DesignOnLotService,
  ) {}

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.prisma.zoningRule.findMany({ orderBy: { id: 'asc' } });
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    return this.prisma.zoningRule.findUnique({
      where: { id: parseBigIntId(id, 'id') },
    });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: Prisma.zoningRuleCreateInput) {
    return this.prisma.zoningRule.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.zoningRuleUpdateInput,
  ) {
    const ruleId = parseBigIntId(id, 'id');
    const updated = await this.prisma.zoningRule.update({
      where: { id: ruleId },
      data,
    });
    const lotMappings = await this.prisma.lotZoningRule.findMany({
      where: { zoningRuleId: ruleId },
      select: { lotId: true },
    });
    for (const mapping of lotMappings) {
      await this.designOnLotService.recomputeForLotId(mapping.lotId);
    }
    return updated;
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const ruleId = parseBigIntId(id, 'id');
    const lotMappings = await this.prisma.lotZoningRule.findMany({
      where: { zoningRuleId: ruleId },
      select: { lotId: true },
    });

    const deleted = await this.prisma.zoningRule.delete({
      where: { id: ruleId },
    });

    for (const mapping of lotMappings) {
      await this.designOnLotService.recomputeForLotId(mapping.lotId);
    }

    return deleted;
  }
}
