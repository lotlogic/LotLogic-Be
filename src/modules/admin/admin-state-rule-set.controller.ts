import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, Jurisdiction, RuleSetStatus } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';
import {
  DesignOnLotService,
  EstateRecomputeSummary,
} from '@/modules/design-on-lot/design-on-lot.service';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/state-rule-sets')
export class AdminStateRuleSetController {
  constructor(
    private prisma: PrismaService,
    private designOnLotService: DesignOnLotService,
  ) {}

  @Get()
  @Roles('ADMIN')
  async findAll(
    @Query('jurisdiction') jurisdiction?: Jurisdiction,
    @Query('status') status?: RuleSetStatus,
  ) {
    const where: Prisma.stateRuleSetWhereInput = {};
    if (jurisdiction) {
      where.jurisdiction = jurisdiction;
    }
    if (status) {
      where.status = status;
    }
    return this.prisma.stateRuleSet.findMany({
      where,
      orderBy: [{ jurisdiction: 'asc' }, { version: 'desc' }],
    });
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    return this.prisma.stateRuleSet.findUnique({
      where: { id: parseBigIntId(id, 'id') },
    });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: Prisma.stateRuleSetUncheckedCreateInput) {
    const ruleSet = await this.prisma.stateRuleSet.create({ data });
    const recompute =
      ruleSet.status === RuleSetStatus.PUBLISHED
        ? await this.recomputeJurisdiction_(ruleSet.jurisdiction)
        : null;
    return { ruleSet, recompute };
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.stateRuleSetUncheckedUpdateInput,
  ) {
    const ruleSet = await this.prisma.stateRuleSet.update({
      where: { id: parseBigIntId(id, 'id') },
      data,
    });
    const recompute =
      ruleSet.status === RuleSetStatus.PUBLISHED
        ? await this.recomputeJurisdiction_(ruleSet.jurisdiction)
        : null;
    return { ruleSet, recompute };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const removed = await this.prisma.stateRuleSet.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
    const recompute = await this.recomputeJurisdiction_(removed.jurisdiction);
    return { removed, recompute };
  }

  private async recomputeJurisdiction_(jurisdiction: Jurisdiction) {
    const estates = await this.prisma.estate.findMany({
      where: { jurisdiction },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    const summaries: EstateRecomputeSummary[] = [];
    for (const estate of estates) {
      summaries.push(await this.designOnLotService.recomputeForEstate(estate.id));
    }
    return {
      jurisdiction,
      estatesProcessed: summaries.length,
      summaries,
    };
  }
}
