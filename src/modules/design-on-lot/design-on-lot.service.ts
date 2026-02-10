import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BuilderEstateApprovalStatus,
  DesignOnLotStatus,
  Jurisdiction,
  Prisma,
  RuleSetStatus,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

type JsonObject = Record<string, unknown>;

type LotDimensions = {
  width: number;
  depth: number;
};

type NormalizedRules = {
  minFrontSetbackM: number | null;
  minRearSetbackM: number | null;
  minSideSetbackM: number | null;
  maxSiteCoverageRatio: number | null;
  minGfaM2: number | null;
  maxGfaM2: number | null;
  maxStoreys: number | null;
  maxBuildingHeightM: number | null;
  requiresArchitecturalReview: boolean;
  architecturalNotes: string[];
};

type EvaluationOutcome = {
  status: DesignOnLotStatus;
  isCompatible: boolean;
  failReasons: string[];
  manualReviewReasons: string[];
  spacing: {
    front: number | null;
    rear: number | null;
    side: number | null;
  };
  maxCoverageArea: number | null;
  usableWidth: number;
  usableDepth: number;
};

type RuleSourceRefs = {
  zoningRuleId: string | null;
  stateRuleSetId: string | null;
  estateRuleSetId: string | null;
  lotConstraintIds: string[];
};

export interface LotRecomputeSummary {
  lotId: string;
  processed: number;
  pass: number;
  fail: number;
  manualReview: number;
}

export interface EstateRecomputeSummary {
  estateId: string;
  lotsProcessed: number;
  combinationsProcessed: number;
  pass: number;
  fail: number;
  manualReview: number;
}

interface DesignOnLotMatch {
  floorPlanId: string;
  floorplanUrl: string | null;
  spacing: {
    front: number | null;
    rear: number | null;
    side: number | null;
  };
  maxCoverageArea: number;
  houseArea: number;
  lotDimensions: {
    width: number;
    depth: number;
  };
}

export interface DesignOnLotResult {
  lotId: string;
  zoning: string;
  matches: DesignOnLotMatch[];
}

const EMPTY_RULES: NormalizedRules = {
  minFrontSetbackM: null,
  minRearSetbackM: null,
  minSideSetbackM: null,
  maxSiteCoverageRatio: null,
  minGfaM2: null,
  maxGfaM2: null,
  maxStoreys: null,
  maxBuildingHeightM: null,
  requiresArchitecturalReview: false,
  architecturalNotes: [],
};

@Injectable()
export class DesignOnLotService {
  constructor(private prisma: PrismaService) {}

  async calculateCompatibility(lotId: string): Promise<DesignOnLotResult> {
    const lotIdBigInt = BigInt(lotId);
    const lot = await this.prisma.lot.findUnique({
      where: { id: lotIdBigInt },
      select: { id: true, zoning: true },
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    await this.recomputeForLot(lotIdBigInt);

    const rows = await this.prisma.designOnLot.findMany({
      where: {
        lotId: lotIdBigInt,
        status: DesignOnLotStatus.PASS,
        isCompatible: true,
      },
      include: {
        floorPlan: {
          select: {
            id: true,
            areaSqm: true,
            floorplanUrl: true,
          },
        },
      },
      orderBy: { floorPlanId: 'asc' },
    });

    const lotRecord = await this.prisma.lot.findUnique({
      where: { id: lotIdBigInt },
      select: { geojson: true },
    });
    const dimensions = this.extractLotDimensions(lotRecord?.geojson);

    const matches: DesignOnLotMatch[] = rows.map((row) => {
      const matched = this.asObject(row.matchedFilters);
      const spacingObj = this.asObject(matched?.spacing);
      const maxCoverageArea = this.readNumber(
        matched,
        [['maxCoverageArea'], ['maxCoverageAreaM2']],
      );

      return {
        floorPlanId: row.floorPlanId.toString(),
        floorplanUrl: row.floorPlan.floorplanUrl,
        spacing: {
          front: this.readNumber(spacingObj, [['front']]),
          rear: this.readNumber(spacingObj, [['rear']]),
          side: this.readNumber(spacingObj, [['side']]),
        },
        maxCoverageArea: maxCoverageArea ?? row.floorPlan.areaSqm,
        houseArea: row.floorPlan.areaSqm,
        lotDimensions: {
          width: dimensions.width,
          depth: dimensions.depth,
        },
      };
    });

    return {
      lotId: lot.id.toString(),
      zoning: lot.zoning,
      matches,
    };
  }

  async recomputeForEstate(estateId: bigint): Promise<EstateRecomputeSummary> {
    const lots = await this.prisma.lot.findMany({
      where: { estateId },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    const summary: EstateRecomputeSummary = {
      estateId: estateId.toString(),
      lotsProcessed: lots.length,
      combinationsProcessed: 0,
      pass: 0,
      fail: 0,
      manualReview: 0,
    };

    for (const lot of lots) {
      const lotSummary = await this.recomputeForLot(lot.id);
      summary.combinationsProcessed += lotSummary.processed;
      summary.pass += lotSummary.pass;
      summary.fail += lotSummary.fail;
      summary.manualReview += lotSummary.manualReview;
    }

    return summary;
  }

  async recomputeForLotId(lotId: bigint): Promise<LotRecomputeSummary> {
    return this.recomputeForLot(lotId);
  }

  async recomputeForFloorPlan(floorPlanId: bigint): Promise<{
    floorPlanId: string;
    estatesProcessed: number;
    lotsProcessed: number;
    combinationsProcessed: number;
    pass: number;
    fail: number;
    manualReview: number;
  }> {
    const floorPlan = await this.prisma.floorPlan.findUnique({
      where: { id: floorPlanId },
      select: { id: true, builderId: true },
    });

    if (!floorPlan) {
      throw new NotFoundException('Floor plan not found');
    }

    const approvals = await this.prisma.builderEstateApproval.findMany({
      where: {
        builderId: floorPlan.builderId,
        status: BuilderEstateApprovalStatus.APPROVED,
      },
      select: { estateId: true, effectiveFrom: true, effectiveTo: true },
    });

    const now = new Date();
    const activeEstateIds = approvals
      .filter((item) => this.isActiveAt_(item.effectiveFrom, item.effectiveTo, now))
      .map((item) => item.estateId);

    if (!activeEstateIds.length) {
      return {
        floorPlanId: floorPlan.id.toString(),
        estatesProcessed: 0,
        lotsProcessed: 0,
        combinationsProcessed: 0,
        pass: 0,
        fail: 0,
        manualReview: 0,
      };
    }

    const lots = await this.prisma.lot.findMany({
      where: { estateId: { in: activeEstateIds } },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    let pass = 0;
    let fail = 0;
    let manualReview = 0;
    let combinationsProcessed = 0;

    for (const lot of lots) {
      const lotSummary = await this.recomputeForLot(lot.id, {
        floorPlanIds: [floorPlanId],
      });
      pass += lotSummary.pass;
      fail += lotSummary.fail;
      manualReview += lotSummary.manualReview;
      combinationsProcessed += lotSummary.processed;
    }

    return {
      floorPlanId: floorPlan.id.toString(),
      estatesProcessed: activeEstateIds.length,
      lotsProcessed: lots.length,
      combinationsProcessed,
      pass,
      fail,
      manualReview,
    };
  }

  private async recomputeForLot(
    lotId: bigint,
    options?: { floorPlanIds?: bigint[] },
  ): Promise<LotRecomputeSummary> {
    const lot = await this.prisma.lot.findUnique({
      where: { id: lotId },
      include: {
        estate: {
          select: {
            id: true,
            jurisdiction: true,
          },
        },
        lotZoningRules: {
          include: { zoningRule: true },
          orderBy: { zoningRuleId: 'asc' },
        },
      },
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }

    const now = new Date();
    const dimensions = this.extractLotDimensions(lot.geojson);
    const zoningRule = lot.lotZoningRules[0]?.zoningRule ?? null;
    const stateRuleSet = lot.estate
      ? await this.getActiveStateRuleSet_(lot.estate.jurisdiction, now)
      : null;
    const estateRuleSet = lot.estate
      ? await this.getActiveEstateRuleSet_(lot.estate.id, now)
      : null;
    const lotConstraints =
      lot.estate && lot.estateId
        ? await this.prisma.estateLotConstraint.findMany({
            where: {
              estateId: lot.estate.id,
              lotId: lot.id,
              isActive: true,
            },
            orderBy: { id: 'asc' },
          })
        : [];

    const approvedBuilderIds =
      lot.estate && lot.estateId
        ? await this.getApprovedBuilderIds_(lot.estate.id, now)
        : [];
    const approvedBuilderSet = new Set(approvedBuilderIds.map((value) => value.toString()));

    const floorPlanFilter: Prisma.floorPlanWhereInput = options?.floorPlanIds?.length
      ? { id: { in: options.floorPlanIds } }
      : {};

    const approvedFloorPlans =
      approvedBuilderIds.length > 0
        ? await this.prisma.floorPlan.findMany({
            where: {
              ...floorPlanFilter,
              builderId: { in: approvedBuilderIds },
            },
            orderBy: { id: 'asc' },
          })
        : [];

    let requestedFloorPlans: Array<{ id: bigint; builderId: bigint; areaSqm: number; minLotWidth: number; minLotDepth: number; storeys: number | null; buildingHeight_m: number | null }> = [];
    if (options?.floorPlanIds?.length) {
      requestedFloorPlans = await this.prisma.floorPlan.findMany({
        where: { id: { in: options.floorPlanIds } },
        select: {
          id: true,
          builderId: true,
          areaSqm: true,
          minLotWidth: true,
          minLotDepth: true,
          storeys: true,
          buildingHeight_m: true,
        },
      });
    }

    const baseRules = this.normalizeRulesFromZoning_(zoningRule);
    const stateRules = this.normalizeRulesFromJson_(stateRuleSet?.rules);
    const estateRules = this.normalizeRulesFromJson_(estateRuleSet?.rules);
    const constraintRules = lotConstraints.map((item) => this.normalizeRulesFromJson_(item.rules));

    let effectiveRules = this.mergeRules_(baseRules, stateRules);
    effectiveRules = this.mergeRules_(effectiveRules, estateRules);
    for (const rule of constraintRules) {
      effectiveRules = this.mergeRules_(effectiveRules, rule);
    }

    const sourceRefs: RuleSourceRefs = {
      zoningRuleId: zoningRule ? zoningRule.id.toString() : null,
      stateRuleSetId: stateRuleSet ? stateRuleSet.id.toString() : null,
      estateRuleSetId: estateRuleSet ? estateRuleSet.id.toString() : null,
      lotConstraintIds: lotConstraints.map((item) => item.id.toString()),
    };

    let processed = 0;
    let pass = 0;
    let fail = 0;
    let manualReview = 0;
    const touchedFloorPlanIds = new Set<string>();

    for (const floorPlan of approvedFloorPlans) {
      const outcome = this.evaluateFloorPlan_(floorPlan, lot.areaSqm, dimensions, effectiveRules);
      await this.upsertDesignOnLot_({
        lotId: lot.id,
        floorPlanId: floorPlan.id,
        outcome,
        effectiveRules,
        sourceRefs,
        stateRuleSetId: stateRuleSet?.id ?? null,
        estateRuleSetId: estateRuleSet?.id ?? null,
      });

      touchedFloorPlanIds.add(floorPlan.id.toString());
      processed += 1;
      if (outcome.status === DesignOnLotStatus.PASS) pass += 1;
      if (outcome.status === DesignOnLotStatus.FAIL) fail += 1;
      if (outcome.status === DesignOnLotStatus.MANUAL_REVIEW) manualReview += 1;
    }

    for (const floorPlan of requestedFloorPlans) {
      if (approvedBuilderSet.has(floorPlan.builderId.toString())) {
        continue;
      }

      const outcome: EvaluationOutcome = {
        status: DesignOnLotStatus.FAIL,
        isCompatible: false,
        failReasons: ['Builder is not approved for this estate'],
        manualReviewReasons: [],
        spacing: {
          front: effectiveRules.minFrontSetbackM,
          rear: effectiveRules.minRearSetbackM,
          side: effectiveRules.minSideSetbackM,
        },
        maxCoverageArea:
          effectiveRules.maxSiteCoverageRatio !== null
            ? Number((lot.areaSqm * effectiveRules.maxSiteCoverageRatio).toFixed(2))
            : null,
        usableWidth: dimensions.width,
        usableDepth: dimensions.depth,
      };

      await this.upsertDesignOnLot_({
        lotId: lot.id,
        floorPlanId: floorPlan.id,
        outcome,
        effectiveRules,
        sourceRefs,
        stateRuleSetId: stateRuleSet?.id ?? null,
        estateRuleSetId: estateRuleSet?.id ?? null,
      });

      touchedFloorPlanIds.add(floorPlan.id.toString());
      processed += 1;
      fail += 1;
    }

    const existingRows = await this.prisma.designOnLot.findMany({
      where: { lotId: lot.id },
      include: {
        floorPlan: {
          select: {
            id: true,
            builderId: true,
          },
        },
      },
    });

    for (const row of existingRows) {
      const floorPlanIdText = row.floorPlanId.toString();
      if (options?.floorPlanIds?.length && !options.floorPlanIds.some((id) => id === row.floorPlanId)) {
        continue;
      }
      if (touchedFloorPlanIds.has(floorPlanIdText)) {
        continue;
      }

      const approved = approvedBuilderSet.has(row.floorPlan.builderId.toString());
      if (approved) {
        continue;
      }

      await this.prisma.designOnLot.update({
        where: { lotId_floorPlanId: { lotId: row.lotId, floorPlanId: row.floorPlanId } },
        data: {
          isCompatible: false,
          status: DesignOnLotStatus.FAIL,
          failReasons: ['Builder is not approved for this estate'],
          manualReviewReasons: [],
          assessedAt: now,
          stateRuleSetId: stateRuleSet?.id ?? null,
          estateRuleSetId: estateRuleSet?.id ?? null,
          matchedFilters: {
            effectiveRules,
            sourceRefs,
            spacing: {
              front: effectiveRules.minFrontSetbackM,
              rear: effectiveRules.minRearSetbackM,
              side: effectiveRules.minSideSetbackM,
            },
          },
        },
      });

      processed += 1;
      fail += 1;
    }

    return {
      lotId: lot.id.toString(),
      processed,
      pass,
      fail,
      manualReview,
    };
  }

  private async upsertDesignOnLot_(params: {
    lotId: bigint;
    floorPlanId: bigint;
    outcome: EvaluationOutcome;
    effectiveRules: NormalizedRules;
    sourceRefs: RuleSourceRefs;
    stateRuleSetId: bigint | null;
    estateRuleSetId: bigint | null;
  }) {
    const {
      lotId,
      floorPlanId,
      outcome,
      effectiveRules,
      sourceRefs,
      stateRuleSetId,
      estateRuleSetId,
    } = params;

    await this.prisma.designOnLot.upsert({
      where: { lotId_floorPlanId: { lotId, floorPlanId } },
      create: {
        lotId,
        floorPlanId,
        isCompatible: outcome.isCompatible,
        status: outcome.status,
        failReasons: outcome.failReasons,
        manualReviewReasons: outcome.manualReviewReasons,
        assessedAt: new Date(),
        stateRuleSetId,
        estateRuleSetId,
        matchedFilters: {
          effectiveRules,
          sourceRefs,
          spacing: outcome.spacing,
          maxCoverageArea: outcome.maxCoverageArea,
          usableWidth: outcome.usableWidth,
          usableDepth: outcome.usableDepth,
        },
      },
      update: {
        isCompatible: outcome.isCompatible,
        status: outcome.status,
        failReasons: outcome.failReasons,
        manualReviewReasons: outcome.manualReviewReasons,
        assessedAt: new Date(),
        stateRuleSetId,
        estateRuleSetId,
        matchedFilters: {
          effectiveRules,
          sourceRefs,
          spacing: outcome.spacing,
          maxCoverageArea: outcome.maxCoverageArea,
          usableWidth: outcome.usableWidth,
          usableDepth: outcome.usableDepth,
        },
      },
    });
  }

  private evaluateFloorPlan_(
    floorPlan: {
      areaSqm: number;
      minLotWidth: number;
      minLotDepth: number;
      storeys: number | null;
      buildingHeight_m: number | null;
    },
    lotAreaSqm: number,
    lotDimensions: LotDimensions,
    rules: NormalizedRules,
  ): EvaluationOutcome {
    const failReasons: string[] = [];
    const manualReviewReasons: string[] = [];

    const front = rules.minFrontSetbackM ?? 0;
    const rear = rules.minRearSetbackM ?? 0;
    const side = rules.minSideSetbackM ?? 0;
    const usableWidth = Number((lotDimensions.width - 2 * side).toFixed(2));
    const usableDepth = Number((lotDimensions.depth - (front + rear)).toFixed(2));

    if (!Number.isFinite(lotDimensions.width) || lotDimensions.width <= 0) {
      failReasons.push('Lot width is missing or invalid');
    }
    if (!Number.isFinite(lotDimensions.depth) || lotDimensions.depth <= 0) {
      failReasons.push('Lot depth is missing or invalid');
    }

    if (floorPlan.minLotWidth > lotDimensions.width) {
      failReasons.push(
        `Requires minimum lot width ${floorPlan.minLotWidth}m (lot: ${lotDimensions.width}m)`,
      );
    }
    if (floorPlan.minLotDepth > lotDimensions.depth) {
      failReasons.push(
        `Requires minimum lot depth ${floorPlan.minLotDepth}m (lot: ${lotDimensions.depth}m)`,
      );
    }

    if (usableWidth <= 0 || usableDepth <= 0) {
      failReasons.push('Setbacks leave no valid building envelope');
    } else if (floorPlan.areaSqm > usableWidth * usableDepth) {
      failReasons.push(
        `House area ${floorPlan.areaSqm}m2 exceeds setback envelope area ${Number(
          (usableWidth * usableDepth).toFixed(2),
        )}m2`,
      );
    }

    const maxCoverageArea =
      rules.maxSiteCoverageRatio !== null
        ? Number((lotAreaSqm * rules.maxSiteCoverageRatio).toFixed(2))
        : null;

    if (maxCoverageArea !== null && floorPlan.areaSqm > maxCoverageArea) {
      failReasons.push(
        `House area ${floorPlan.areaSqm}m2 exceeds max site coverage ${maxCoverageArea}m2`,
      );
    }

    if (rules.minGfaM2 !== null && floorPlan.areaSqm < rules.minGfaM2) {
      failReasons.push(
        `House area ${floorPlan.areaSqm}m2 is below minimum GFA ${rules.minGfaM2}m2`,
      );
    }

    if (rules.maxGfaM2 !== null && floorPlan.areaSqm > rules.maxGfaM2) {
      failReasons.push(
        `House area ${floorPlan.areaSqm}m2 exceeds maximum GFA ${rules.maxGfaM2}m2`,
      );
    }

    if (rules.maxStoreys !== null) {
      if (floorPlan.storeys === null) {
        manualReviewReasons.push('Storey count is required to validate max storeys');
      } else if (floorPlan.storeys > rules.maxStoreys) {
        failReasons.push(`Storeys ${floorPlan.storeys} exceed max storeys ${rules.maxStoreys}`);
      }
    }

    if (rules.maxBuildingHeightM !== null) {
      if (floorPlan.buildingHeight_m === null) {
        manualReviewReasons.push('Building height is required to validate max building height');
      } else if (floorPlan.buildingHeight_m > rules.maxBuildingHeightM) {
        failReasons.push(
          `Building height ${floorPlan.buildingHeight_m}m exceeds max height ${rules.maxBuildingHeightM}m`,
        );
      }
    }

    if (rules.requiresArchitecturalReview) {
      manualReviewReasons.push('Architectural/style requirements require manual review');
    }
    if (rules.architecturalNotes.length > 0) {
      for (const note of rules.architecturalNotes) {
        manualReviewReasons.push(`Manual review: ${note}`);
      }
    }

    const status =
      failReasons.length > 0
        ? DesignOnLotStatus.FAIL
        : manualReviewReasons.length > 0
          ? DesignOnLotStatus.MANUAL_REVIEW
          : DesignOnLotStatus.PASS;

    return {
      status,
      isCompatible: status === DesignOnLotStatus.PASS,
      failReasons,
      manualReviewReasons,
      spacing: {
        front: rules.minFrontSetbackM,
        rear: rules.minRearSetbackM,
        side: rules.minSideSetbackM,
      },
      maxCoverageArea,
      usableWidth,
      usableDepth,
    };
  }

  private normalizeRulesFromZoning_(
    zoningRule:
      | {
          minFrontSetback_m: number | null;
          minRearSetback_m: number | null;
          minSideSetback_m: number | null;
          maxFSR: number | null;
          minFSR: number | null;
          maxStoreys: number | null;
          maxBuildingHeight_m: number | null;
        }
      | null,
  ): NormalizedRules {
    if (!zoningRule) {
      return { ...EMPTY_RULES };
    }

    const maxSiteCoverageRatio = this.normalizeRatio_(
      zoningRule.maxFSR ?? zoningRule.minFSR ?? null,
    );

    return {
      minFrontSetbackM: zoningRule.minFrontSetback_m,
      minRearSetbackM: zoningRule.minRearSetback_m,
      minSideSetbackM: zoningRule.minSideSetback_m,
      maxSiteCoverageRatio,
      minGfaM2: null,
      maxGfaM2: null,
      maxStoreys: zoningRule.maxStoreys,
      maxBuildingHeightM: zoningRule.maxBuildingHeight_m,
      requiresArchitecturalReview: false,
      architecturalNotes: [],
    };
  }

  private normalizeRulesFromJson_(rawRules: unknown): NormalizedRules {
    const rules = this.asObject(rawRules);
    if (!rules) {
      return { ...EMPTY_RULES };
    }

    const architecturalNotes = [
      ...this.readStringArray(rules, [['architecturalNotes'], ['architecturalRequirements'], ['styleRequirements']]),
      ...this.readStringArray(rules, [['architectural', 'notes'], ['architectural', 'requirements']]),
    ];

    const requiresArchitecturalReview =
      this.readBoolean(rules, [
        ['requiresArchitecturalReview'],
        ['architecturalReviewRequired'],
        ['architectural', 'manualReview'],
      ]) || architecturalNotes.length > 0;

    return {
      minFrontSetbackM: this.readNumber(rules, [
        ['minFrontSetbackM'],
        ['minFrontSetback_m'],
        ['setbacks', 'front'],
        ['setbacks', 'frontMinM'],
      ]),
      minRearSetbackM: this.readNumber(rules, [
        ['minRearSetbackM'],
        ['minRearSetback_m'],
        ['setbacks', 'rear'],
        ['setbacks', 'rearMinM'],
      ]),
      minSideSetbackM: this.readNumber(rules, [
        ['minSideSetbackM'],
        ['minSideSetback_m'],
        ['setbacks', 'side'],
        ['setbacks', 'sideMinM'],
      ]),
      maxSiteCoverageRatio: this.normalizeRatio_(
        this.readNumber(rules, [
          ['maxSiteCoverageRatio'],
          ['maxSiteCoverage'],
          ['siteCoverageRatio'],
          ['siteCoverage', 'max'],
          ['siteCoverage', 'maxRatio'],
          ['maxFSR'],
        ]),
      ),
      minGfaM2: this.readNumber(rules, [['minGfaM2'], ['minGFA'], ['minimumGfaM2']]),
      maxGfaM2: this.readNumber(rules, [['maxGfaM2'], ['maxGFA'], ['maximumGfaM2']]),
      maxStoreys: this.readNumber(rules, [['maxStoreys']]),
      maxBuildingHeightM: this.readNumber(rules, [['maxBuildingHeightM'], ['maxBuildingHeight_m']]),
      requiresArchitecturalReview,
      architecturalNotes: [...new Set(architecturalNotes)],
    };
  }

  private mergeRules_(baseRules: NormalizedRules, incomingRules: NormalizedRules): NormalizedRules {
    return {
      minFrontSetbackM: this.maxRule_(baseRules.minFrontSetbackM, incomingRules.minFrontSetbackM),
      minRearSetbackM: this.maxRule_(baseRules.minRearSetbackM, incomingRules.minRearSetbackM),
      minSideSetbackM: this.maxRule_(baseRules.minSideSetbackM, incomingRules.minSideSetbackM),
      maxSiteCoverageRatio: this.minRule_(
        baseRules.maxSiteCoverageRatio,
        incomingRules.maxSiteCoverageRatio,
      ),
      minGfaM2: this.maxRule_(baseRules.minGfaM2, incomingRules.minGfaM2),
      maxGfaM2: this.minRule_(baseRules.maxGfaM2, incomingRules.maxGfaM2),
      maxStoreys: this.minRule_(baseRules.maxStoreys, incomingRules.maxStoreys),
      maxBuildingHeightM: this.minRule_(
        baseRules.maxBuildingHeightM,
        incomingRules.maxBuildingHeightM,
      ),
      requiresArchitecturalReview:
        baseRules.requiresArchitecturalReview || incomingRules.requiresArchitecturalReview,
      architecturalNotes: [
        ...new Set([...baseRules.architecturalNotes, ...incomingRules.architecturalNotes]),
      ],
    };
  }

  private async getApprovedBuilderIds_(estateId: bigint, now: Date): Promise<bigint[]> {
    const approvals = await this.prisma.builderEstateApproval.findMany({
      where: {
        estateId,
        status: BuilderEstateApprovalStatus.APPROVED,
      },
      select: {
        builderId: true,
        effectiveFrom: true,
        effectiveTo: true,
      },
    });

    return approvals
      .filter((item) => this.isActiveAt_(item.effectiveFrom, item.effectiveTo, now))
      .map((item) => item.builderId);
  }

  private async getActiveStateRuleSet_(jurisdiction: Jurisdiction, now: Date) {
    const candidates = await this.prisma.stateRuleSet.findMany({
      where: {
        jurisdiction,
        status: RuleSetStatus.PUBLISHED,
        AND: [
          {
            OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }],
          },
          {
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
          },
        ],
      },
      orderBy: [{ version: 'desc' }, { id: 'desc' }],
      take: 1,
    });
    return candidates[0] ?? null;
  }

  private async getActiveEstateRuleSet_(estateId: bigint, now: Date) {
    const candidates = await this.prisma.estateRuleSet.findMany({
      where: {
        estateId,
        status: RuleSetStatus.PUBLISHED,
        AND: [
          {
            OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }],
          },
          {
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
          },
        ],
      },
      orderBy: [{ version: 'desc' }, { id: 'desc' }],
      take: 1,
    });
    return candidates[0] ?? null;
  }

  private extractLotDimensions(geojson: unknown): LotDimensions {
    const raw = this.asObject(geojson);
    const topLevelWidth = this.readNumber(raw, [['width']]);
    const topLevelDepth = this.readNumber(raw, [['depth']]);
    const props = this.asObject(raw?.properties);
    const propsWidth = this.readNumber(props, [['width']]);
    const propsDepth = this.readNumber(props, [['depth']]);

    return {
      width: topLevelWidth ?? propsWidth ?? 0,
      depth: topLevelDepth ?? propsDepth ?? 0,
    };
  }

  private isActiveAt_(effectiveFrom: Date | null, effectiveTo: Date | null, now: Date): boolean {
    if (effectiveFrom && effectiveFrom > now) return false;
    if (effectiveTo && effectiveTo < now) return false;
    return true;
  }

  private normalizeRatio_(value: number | null): number | null {
    if (value === null || !Number.isFinite(value) || value <= 0) {
      return null;
    }
    if (value > 1 && value <= 100) {
      return Number((value / 100).toFixed(4));
    }
    return value;
  }

  private maxRule_(a: number | null, b: number | null): number | null {
    if (a === null) return b;
    if (b === null) return a;
    return Math.max(a, b);
  }

  private minRule_(a: number | null, b: number | null): number | null {
    if (a === null) return b;
    if (b === null) return a;
    return Math.min(a, b);
  }

  private asObject(value: unknown): JsonObject | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as JsonObject;
  }

  private readNumber(value: JsonObject | null, paths: string[][]): number | null {
    if (!value) return null;
    for (const path of paths) {
      const candidate = this.readPath_(value, path);
      const parsed = this.toNumber_(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }
    return null;
  }

  private readBoolean(value: JsonObject | null, paths: string[][]): boolean {
    if (!value) return false;
    for (const path of paths) {
      const candidate = this.readPath_(value, path);
      if (typeof candidate === 'boolean') {
        return candidate;
      }
      if (typeof candidate === 'string') {
        const normalized = candidate.trim().toLowerCase();
        if (normalized === 'true' || normalized === 'yes' || normalized === '1') {
          return true;
        }
        if (normalized === 'false' || normalized === 'no' || normalized === '0') {
          return false;
        }
      }
    }
    return false;
  }

  private readStringArray(value: JsonObject | null, paths: string[][]): string[] {
    if (!value) return [];
    const results: string[] = [];
    for (const path of paths) {
      const candidate = this.readPath_(value, path);
      if (Array.isArray(candidate)) {
        for (const item of candidate) {
          if (typeof item === 'string' && item.trim()) {
            results.push(item.trim());
          }
        }
      } else if (typeof candidate === 'string' && candidate.trim()) {
        results.push(candidate.trim());
      }
    }
    return results;
  }

  private readPath_(value: JsonObject, path: string[]): unknown {
    let current: unknown = value;
    for (const key of path) {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return undefined;
      }
      current = (current as JsonObject)[key];
    }
    return current;
  }

  private toNumber_(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return null;
  }
}
