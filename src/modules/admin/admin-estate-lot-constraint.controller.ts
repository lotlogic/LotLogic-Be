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
@Controller('admin/estates/:estateId/lot-constraints')
export class AdminEstateLotConstraintController {
  constructor(
    private prisma: PrismaService,
    private designOnLotService: DesignOnLotService,
  ) {}

  @Get()
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async findAll(
    @Param('estateId') estateId: string,
    @Query('lotId') lotId?: string,
  ) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    const where: Prisma.estateLotConstraintWhereInput = { estateId: estateIdValue };
    if (lotId) {
      where.lotId = parseBigIntId(lotId, 'lotId');
    }
    return this.prisma.estateLotConstraint.findMany({
      where,
      orderBy: [{ lotId: 'asc' }, { id: 'asc' }],
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
    return this.prisma.estateLotConstraint.findFirst({
      where: { id: idValue, estateId: estateIdValue },
    });
  }

  @Post()
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async create(
    @Param('estateId') estateId: string,
    @Body() data: Prisma.estateLotConstraintUncheckedCreateInput,
  ) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    const lotIdValue = parseBigIntId(data.lotId, 'lotId');

    const lot = await this.prisma.lot.findUnique({
      where: { id: lotIdValue },
      select: { estateId: true },
    });
    if (!lot || lot.estateId !== estateIdValue) {
      throw new BadRequestException('Lot does not belong to this estate');
    }

    const constraint = await this.prisma.estateLotConstraint.create({
      data: {
        ...data,
        estateId: estateIdValue,
        lotId: lotIdValue,
      },
    });
    const recompute = await this.designOnLotService.recomputeForLotId(lotIdValue);
    return { constraint, recompute };
  }

  @Patch(':id')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async update(
    @Param('estateId') estateId: string,
    @Param('id') id: string,
    @Body() data: Prisma.estateLotConstraintUncheckedUpdateInput,
  ) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    const idValue = parseBigIntId(id, 'id');

    const existing = await this.prisma.estateLotConstraint.findFirst({
      where: { id: idValue, estateId: estateIdValue },
      select: { id: true, lotId: true },
    });
    if (!existing) {
      throw new BadRequestException('Lot constraint not found for this estate');
    }

    if (data.lotId !== undefined) {
      const lotIdValue = parseBigIntId(data.lotId, 'lotId');
      const lot = await this.prisma.lot.findUnique({
        where: { id: lotIdValue },
        select: { estateId: true },
      });
      if (!lot || lot.estateId !== estateIdValue) {
        throw new BadRequestException('Lot does not belong to this estate');
      }
    }

    const constraint = await this.prisma.estateLotConstraint.update({
      where: { id: idValue },
      data: {
        ...data,
        estateId: estateIdValue,
      },
    });
    const recompute = await this.designOnLotService.recomputeForLotId(constraint.lotId);
    return { constraint, recompute };
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

    const existing = await this.prisma.estateLotConstraint.findFirst({
      where: { id: idValue, estateId: estateIdValue },
      select: { id: true },
    });
    if (!existing) {
      throw new BadRequestException('Lot constraint not found for this estate');
    }

    const removed = await this.prisma.estateLotConstraint.delete({
      where: { id: idValue },
    });
    const recompute = await this.designOnLotService.recomputeForLotId(removed.lotId);
    return { removed, recompute };
  }
}
