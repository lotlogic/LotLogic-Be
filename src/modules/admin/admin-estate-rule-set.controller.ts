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
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { EstateScopeGuard } from '@/modules/auth/guards/estate-scope.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { EstateScope } from '@/modules/auth/decorators/estate-scope.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';
import { DesignOnLotService } from '@/modules/design-on-lot/design-on-lot.service';

@UseGuards(EasyAuthGuard, RolesGuard, EstateScopeGuard)
@Controller('admin/estates/:estateId/rule-sets')
export class AdminEstateRuleSetController {
  constructor(
    private prisma: PrismaService,
    private designOnLotService: DesignOnLotService,
  ) {}

  @Get()
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async findAll(@Param('estateId') estateId: string) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    return this.prisma.estateRuleSet.findMany({
      where: { estateId: estateIdValue },
      orderBy: [{ version: 'desc' }, { id: 'desc' }],
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async findOne(
    @Param('estateId') estateId: string,
    @Param('id') id: string,
  ) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    const idValue = parseBigIntId(id, 'id');
    return this.prisma.estateRuleSet.findFirst({
      where: { id: idValue, estateId: estateIdValue },
    });
  }

  @Post()
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async create(
    @Param('estateId') estateId: string,
    @Body() data: Prisma.estateRuleSetUncheckedCreateInput,
  ) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    const ruleSet = await this.prisma.estateRuleSet.create({
      data: {
        ...data,
        estateId: estateIdValue,
      },
    });
    const recompute = await this.designOnLotService.recomputeForEstate(estateIdValue);
    return { ruleSet, recompute };
  }

  @Patch(':id')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async update(
    @Param('estateId') estateId: string,
    @Param('id') id: string,
    @Body() data: Prisma.estateRuleSetUncheckedUpdateInput,
  ) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    const idValue = parseBigIntId(id, 'id');

    const existing = await this.prisma.estateRuleSet.findFirst({
      where: { id: idValue, estateId: estateIdValue },
      select: { id: true },
    });
    if (!existing) {
      throw new BadRequestException('Rule set not found for this estate');
    }

    const ruleSet = await this.prisma.estateRuleSet.update({
      where: { id: idValue },
      data: {
        ...data,
        estateId: estateIdValue,
      },
    });
    const recompute = await this.designOnLotService.recomputeForEstate(estateIdValue);
    return { ruleSet, recompute };
  }

  @Delete(':id')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async remove(
    @Param('estateId') estateId: string,
    @Param('id') id: string,
  ) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    const idValue = parseBigIntId(id, 'id');

    const existing = await this.prisma.estateRuleSet.findFirst({
      where: { id: idValue, estateId: estateIdValue },
      select: { id: true },
    });
    if (!existing) {
      throw new BadRequestException('Rule set not found for this estate');
    }

    const removed = await this.prisma.estateRuleSet.delete({
      where: { id: idValue },
    });
    const recompute = await this.designOnLotService.recomputeForEstate(estateIdValue);
    return { removed, recompute };
  }
}
