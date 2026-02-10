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
@Controller('admin/estates/:estateId/builder-approvals')
export class AdminBuilderEstateApprovalController {
  constructor(
    private prisma: PrismaService,
    private designOnLotService: DesignOnLotService,
  ) {}

  @Get()
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async findAll(@Param('estateId') estateId: string) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    return this.prisma.builderEstateApproval.findMany({
      where: { estateId: estateIdValue },
      include: {
        builder: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { builderId: 'asc' },
    });
  }

  @Post()
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async createOrUpsert(
    @Param('estateId') estateId: string,
    @Body() data: Prisma.builderEstateApprovalUncheckedCreateInput,
  ) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    const builderIdValue = parseBigIntId(data.builderId, 'builderId');

    const builder = await this.prisma.builder.findUnique({
      where: { id: builderIdValue },
      select: { id: true },
    });
    if (!builder) {
      throw new BadRequestException('Builder not found');
    }

    const approval = await this.prisma.builderEstateApproval.upsert({
      where: {
        builderId_estateId: {
          builderId: builderIdValue,
          estateId: estateIdValue,
        },
      },
      create: {
        ...data,
        builderId: builderIdValue,
        estateId: estateIdValue,
      },
      update: {
        status: data.status,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        notes: data.notes,
      },
    });

    const recompute = await this.designOnLotService.recomputeForEstate(estateIdValue);
    return { approval, recompute };
  }

  @Patch(':builderId')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async update(
    @Param('estateId') estateId: string,
    @Param('builderId') builderId: string,
    @Body() data: Prisma.builderEstateApprovalUncheckedUpdateInput,
  ) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    const builderIdValue = parseBigIntId(builderId, 'builderId');

    const existing = await this.prisma.builderEstateApproval.findUnique({
      where: {
        builderId_estateId: {
          builderId: builderIdValue,
          estateId: estateIdValue,
        },
      },
      select: { id: true },
    });
    if (!existing) {
      throw new BadRequestException('Builder approval not found for this estate');
    }

    const approval = await this.prisma.builderEstateApproval.update({
      where: {
        builderId_estateId: {
          builderId: builderIdValue,
          estateId: estateIdValue,
        },
      },
      data: {
        ...data,
        builderId: builderIdValue,
        estateId: estateIdValue,
      },
    });

    const recompute = await this.designOnLotService.recomputeForEstate(estateIdValue);
    return { approval, recompute };
  }

  @Delete(':builderId')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'estateId' })
  async remove(
    @Param('estateId') estateId: string,
    @Param('builderId') builderId: string,
  ) {
    const estateIdValue = parseBigIntId(estateId, 'estateId');
    const builderIdValue = parseBigIntId(builderId, 'builderId');

    const existing = await this.prisma.builderEstateApproval.findUnique({
      where: {
        builderId_estateId: {
          builderId: builderIdValue,
          estateId: estateIdValue,
        },
      },
      select: { id: true },
    });
    if (!existing) {
      throw new BadRequestException('Builder approval not found for this estate');
    }

    const removed = await this.prisma.builderEstateApproval.delete({
      where: {
        builderId_estateId: {
          builderId: builderIdValue,
          estateId: estateIdValue,
        },
      },
    });

    const recompute = await this.designOnLotService.recomputeForEstate(estateIdValue);
    return { removed, recompute };
  }
}
