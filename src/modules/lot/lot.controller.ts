import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { LotService } from '@modules/lot/lot.service';
import { DesignOnLotService } from '@modules/design-on-lot/design-on-lot.service';

@Controller('lot')
export class LotController {
  constructor(
    private readonly lotService: LotService,
    private readonly designOnLotService: DesignOnLotService,
  ) {}

  @Get()
  async findAll(@Query('estateId') estateId?: string) {
    const trimmedEstateId = String(estateId || '').trim();
    if (!trimmedEstateId) {
      return await this.lotService.findAllLots();
    }

    try {
      return await this.lotService.findAllLots(BigInt(trimmedEstateId));
    } catch {
      throw new BadRequestException('estateId must be a numeric id');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    let lotId: bigint;
    try {
      lotId = BigInt(id);
    } catch {
      throw new BadRequestException('id must be a numeric id');
    }

    const lot = await this.lotService.findLot(lotId);
    if (!lot) {
      return lot;
    }

    await this.designOnLotService.ensureLotEvaluationCurrent(lotId);
    const effectiveRuleSummary =
      await this.designOnLotService.getEffectiveRulesForLot(lotId);

    return {
      ...lot,
      effectiveSetbacks: {
        frontSetback:
          effectiveRuleSummary.spacing.front ?? lot.zoningSetbacks?.frontSetback,
        rearSetback:
          effectiveRuleSummary.spacing.rear ?? lot.zoningSetbacks?.rearSetback,
        sideSetback:
          effectiveRuleSummary.spacing.side ?? lot.zoningSetbacks?.sideSetback,
      },
      effectiveRules: effectiveRuleSummary.effectiveRules,
      effectiveRuleSources: effectiveRuleSummary.sourceRefs,
      maxCoverageArea: effectiveRuleSummary.maxCoverageArea,
    };
  }
}
