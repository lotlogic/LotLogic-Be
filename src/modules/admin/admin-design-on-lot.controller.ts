import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  DesignOnLotReviewDecision,
  Prisma,
} from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { DesignOnLotService } from '@/modules/design-on-lot/design-on-lot.service';

const designOnLotInclude = {
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
      floorplanUrl: true,
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
  reviewedBy: {
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  },
} satisfies Prisma.designOnLotInclude;

type AdminDesignOnLotRecord = Prisma.designOnLotGetPayload<{
  include: typeof designOnLotInclude;
}>;

type ReviewDecisionBody = {
  decision?: DesignOnLotReviewDecision | string | null;
  note?: string | null;
};

type BulkReviewBody = ReviewDecisionBody & {
  scope?: 'manual_review' | 'all' | 'selected' | string | null;
  ids?: string[] | null;
};

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/design-on-lots')
export class AdminDesignOnLotController {
  constructor(
    private prisma: PrismaService,
    private designOnLotService: DesignOnLotService,
  ) {}

  private mapDesignOnLotRecord(record: AdminDesignOnLotRecord) {
    const reasons =
      record.status === 'MANUAL_REVIEW'
        ? record.manualReviewReasons
        : record.failReasons;
    const systemReasons =
      record.systemStatus === 'MANUAL_REVIEW'
        ? record.systemManualReviewReasons
        : record.systemFailReasons;

    return {
      ...record,
      reasons,
      systemReasons,
      effectiveStatus: record.status,
      isOverridden: record.reviewDecision !== DesignOnLotReviewDecision.NONE,
    };
  }

  private parseReviewDecision(
    value: DesignOnLotReviewDecision | string | null | undefined,
  ): DesignOnLotReviewDecision {
    const normalized = String(value ?? '')
      .trim()
      .toUpperCase();
    if (normalized === DesignOnLotReviewDecision.APPROVED) {
      return DesignOnLotReviewDecision.APPROVED;
    }
    if (normalized === DesignOnLotReviewDecision.REJECTED) {
      return DesignOnLotReviewDecision.REJECTED;
    }
    throw new BadRequestException(
      'Invalid decision. Expected APPROVED or REJECTED.',
    );
  }

  private parseBulkScope(
    value: BulkReviewBody['scope'],
  ): 'manual_review' | 'all' | 'selected' {
    const normalized = String(value ?? 'manual_review')
      .trim()
      .toLowerCase();
    if (
      normalized === 'manual_review' ||
      normalized === 'all' ||
      normalized === 'selected'
    ) {
      return normalized;
    }
    throw new BadRequestException(
      'Invalid scope. Expected manual_review, all, or selected.',
    );
  }

  @Get()
  @Roles('ADMIN')
  async findAll() {
    const records = await this.prisma.designOnLot.findMany({
      orderBy: [{ lotId: 'asc' }, { floorPlanId: 'asc' }],
      include: designOnLotInclude,
    });

    return records.map((record) => this.mapDesignOnLotRecord(record));
  }

  @Post('lot/:lotId/review')
  @Roles('ADMIN')
  async reviewLot(
    @Param('lotId') lotId: string,
    @Body() body: BulkReviewBody,
    @Req() req: AuthenticatedRequest,
  ) {
    const scope = this.parseBulkScope(body.scope);
    const ids =
      scope === 'selected'
        ? (body.ids ?? []).map((value) => parseBigIntId(value, 'ids'))
        : undefined;

    return this.designOnLotService.reviewDesignOnLotsForLot({
      lotId: parseBigIntId(lotId, 'lotId'),
      reviewDecision: this.parseReviewDecision(body.decision),
      reviewedByUserId: req.auth?.id ?? null,
      scope,
      ids,
      reviewNote: body.note,
    });
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    const record = await this.prisma.designOnLot.findUnique({
      where: { id: parseBigIntId(id, 'id') },
      include: designOnLotInclude,
    });

    if (!record) {
      return null;
    }

    return this.mapDesignOnLotRecord(record);
  }

  @Post(':id/review')
  @Roles('ADMIN')
  async reviewOne(
    @Param('id') id: string,
    @Body() body: ReviewDecisionBody,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.designOnLotService.reviewDesignOnLot(
      parseBigIntId(id, 'id'),
      this.parseReviewDecision(body.decision),
      req.auth?.id ?? null,
      body.note,
    );

    return this.findOne(id);
  }

  @Post(':id/clear-review')
  @Roles('ADMIN')
  async clearReview(@Param('id') id: string) {
    await this.designOnLotService.clearDesignOnLotReview(
      parseBigIntId(id, 'id'),
    );

    return this.findOne(id);
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
