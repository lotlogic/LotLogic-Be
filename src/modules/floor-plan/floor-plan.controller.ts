import { FloorPlanService } from '@modules/floor-plan/floor-plan.service';
import { LotService } from '@modules/lot/lot.service';
import { DesignOnLotService } from '@modules/design-on-lot/design-on-lot.service';
import { Controller, Get, Param, Query } from '@nestjs/common';

@Controller('house-design')
export class FloorPlanController {
  constructor(
    private readonly floorPlanService: FloorPlanService,
    private readonly lotService: LotService,
    private readonly designOnLotService: DesignOnLotService,
  ) {}

  @Get(':lot_id')
  async filterHouseDesign(
    @Param('lot_id') lotId: string,
    @Query('bedroom') bedroom?: string,
    @Query('bathroom') bathroom?: string,
    @Query('car') car?: string,
    @Query('min_size') minSizeRaw?: string,
    @Query('max_size') maxSizeRaw?: string,
    @Query('rumpus') rumpus?: string,
    @Query('alfresco') alfresco?: string,
    @Query('pergola') pergola?: string,
  ) {
    const parseArrayParam = (param: string): number[] => {
      if (!param) return [];
      try {
        const parsed = JSON.parse(param);
        return Array.isArray(parsed) ? parsed.filter((val) => typeof val === 'number') : [];
      } catch {
        return param
          .split(',')
          .map((val) => parseInt(val.trim(), 10))
          .filter((val) => !isNaN(val));
      }
    };

    let lotIdValue: bigint;
    try {
      lotIdValue = BigInt(lotId);
    } catch {
      return {
        houseDesigns: [],
        zoning: {},
      };
    }

    const lotDetail = await this.lotService.findLot(lotIdValue);
    if (!lotDetail) {
      return {
        houseDesigns: [],
        zoning: {},
      };
    }

    const bedroomArray = bedroom ? parseArrayParam(bedroom) : undefined;
    const bathroomArray = bathroom ? parseArrayParam(bathroom) : undefined;
    const carArray = car ? parseArrayParam(car) : undefined;
    const minSize = minSizeRaw ? parseInt(minSizeRaw, 10) : undefined;
    const maxSize = maxSizeRaw ? parseInt(maxSizeRaw, 10) : undefined;
    const rumpusBool = rumpus === 'true' ? true : rumpus === 'false' ? false : undefined;
    const alfrescoBool = alfresco === 'true' ? true : alfresco === 'false' ? false : undefined;
    const pergolaBool = pergola === 'true' ? true : pergola === 'false' ? false : undefined;

    await this.designOnLotService.ensureLotEvaluationCurrent(lotIdValue);
    const effectiveRuleSummary =
      await this.designOnLotService.getEffectiveRulesForLot(lotIdValue);

    const houseDesigns = await this.floorPlanService.getPrecomputedHouseDesignsForLot(
      lotIdValue,
      bedroomArray,
      bathroomArray,
      carArray,
      minSize,
      maxSize,
      rumpusBool,
      alfrescoBool,
      pergolaBool,
    );

    return {
      houseDesigns,
      zoning: {
        ...(lotDetail.zoningSetbacks || {}),
        fsr: effectiveRuleSummary.maxCoverageArea ?? undefined,
        frontSetback:
          effectiveRuleSummary.spacing.front ??
          lotDetail.zoningSetbacks?.frontSetback,
        rearSetback:
          effectiveRuleSummary.spacing.rear ??
          lotDetail.zoningSetbacks?.rearSetback,
        sideSetback:
          effectiveRuleSummary.spacing.side ??
          lotDetail.zoningSetbacks?.sideSetback,
        effectiveRules: effectiveRuleSummary.effectiveRules,
        sourceRefs: effectiveRuleSummary.sourceRefs,
      },
    };
  }
}
