import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/design-on-lots')
export class AdminDesignOnLotController {
  constructor(private prisma: PrismaService) {}

  private mapDesignOnLotRecord(record: {
    id: bigint;
    lotId: bigint;
    floorPlanId: bigint;
    status: string;
    failReasons: string[];
    manualReviewReasons: string[];
    matchedFilters: Prisma.JsonValue | null;
    assessedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    lot: {
      id: bigint;
      blockKey: string;
      blockNumber: number | null;
      address: string | null;
      areaSqm: number;
      zoning: string;
      lifecycleStage: string | null;
      frontageM: number | null;
      lotType: string | null;
      roadFacing: string | null;
      precinct: string | null;
      estate: {
        id: bigint;
        name: string;
        jurisdiction: string;
      } | null;
    } | null;
    floorPlan: {
      id: bigint;
      name: string;
      bedrooms: number;
      bathrooms: number;
      garages: number;
      areaSqm: number;
      width: number;
      depth: number;
      storeys: number | null;
      buildingHeight_m: number | null;
      builder: {
        id: bigint;
        name: string;
      } | null;
    } | null;
  }) {
    const reasons =
      record.status === 'MANUAL_REVIEW'
        ? record.manualReviewReasons
        : record.failReasons;

    return {
      ...record,
      reasons,
    };
  }

  @Get()
  @Roles('ADMIN')
  async findAll() {
    const records = await this.prisma.designOnLot.findMany({
      orderBy: { id: 'asc' },
      include: {
        lot: {
          select: {
            id: true,
            blockKey: true,
            blockNumber: true,
            address: true,
            areaSqm: true,
            zoning: true,
            lifecycleStage: true,
            frontageM: true,
            lotType: true,
            roadFacing: true,
            precinct: true,
            estate: {
              select: {
                id: true,
                name: true,
                jurisdiction: true,
              },
            },
          },
        },
        floorPlan: {
          select: {
            id: true,
            name: true,
            bedrooms: true,
            bathrooms: true,
            garages: true,
            areaSqm: true,
            width: true,
            depth: true,
            storeys: true,
            buildingHeight_m: true,
            builder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return records.map((record) => this.mapDesignOnLotRecord(record));
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    const record = await this.prisma.designOnLot.findUnique({
      where: { id: parseBigIntId(id, 'id') },
      include: {
        lot: {
          select: {
            id: true,
            blockKey: true,
            blockNumber: true,
            address: true,
            areaSqm: true,
            zoning: true,
            lifecycleStage: true,
            frontageM: true,
            lotType: true,
            roadFacing: true,
            precinct: true,
            estate: {
              select: {
                id: true,
                name: true,
                jurisdiction: true,
              },
            },
          },
        },
        floorPlan: {
          select: {
            id: true,
            name: true,
            bedrooms: true,
            bathrooms: true,
            garages: true,
            areaSqm: true,
            width: true,
            depth: true,
            storeys: true,
            buildingHeight_m: true,
            builder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      return null;
    }

    return this.mapDesignOnLotRecord(record);
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: Prisma.designOnLotUncheckedCreateInput) {
    return this.prisma.designOnLot.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.designOnLotUncheckedUpdateInput,
  ) {
    return this.prisma.designOnLot.update({
      where: { id: parseBigIntId(id, 'id') },
      data,
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.prisma.designOnLot.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
  }
}
