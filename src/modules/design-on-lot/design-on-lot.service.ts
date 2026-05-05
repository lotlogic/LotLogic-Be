import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  BuilderEstateApprovalStatus,
  DesignOnLotReviewDecision,
  DesignOnLotStatus,
  Jurisdiction,
  Prisma,
  RuleSetStatus,
} from '@prisma/client';
import * as turf from '@turf/turf';
import type { Feature, Polygon } from 'geojson';
import { PrismaService } from '@/prisma/prisma.service';
import { normalizeLotLifecycleStage } from '@/modules/lot/lot-lifecycle';

type JsonObject = Record<string, unknown>;

type Pt = [number, number];

type SetbackValues = {
  front: number;
  side: number;
  rear: number;
};

type LotDimensions = {
  width: number;
  depth: number;
};

type LocalProjection = {
  origin: Pt;
  metersPerLngDegree: number;
  metersPerLatDegree: number;
};

type PlacementRingResult = {
  ring: Pt[];
  frontageLine: Pt[] | null;
  frontageAligned: boolean;
};

type PlacementBasis = {
  basisRing: Pt[];
  toLngLat: (point: Pt) => Pt;
};

type FrontAnchoredPlacementCandidate = {
  frontOffset: number;
  centerX: number;
  exactFit: boolean;
  overflow: number;
  minClearance: number;
};

type TrueSizeHouseBoundary = {
  boundary: Feature<Polygon>;
  candidate: FrontAnchoredPlacementCandidate;
};

type GeometricPlacementEvaluation = {
  fits: boolean;
  reason: string;
  details: Prisma.InputJsonObject;
};

type LotRuleContext = {
  lotAreaSqm: number;
  lotWidthM: number;
  lotDepthM: number;
  frontageM: number | null;
  lotType: string | null;
  roadFacing: string | null;
  lifecycleStage: string | null;
  precinct: string | null;
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
  geometricPlacement: Prisma.InputJsonObject | null;
};

type DesignOnLotReviewState = {
  reviewDecision: DesignOnLotReviewDecision;
  reviewNote: string | null;
  reviewedAt: Date | null;
  reviewedByUserId: bigint | null;
};

type ExistingDesignOnLotRow = DesignOnLotReviewState & {
  id: bigint;
  lotId: bigint;
  floorPlanId: bigint;
  systemStatus: DesignOnLotStatus;
  systemFailReasons: string[];
  systemManualReviewReasons: string[];
  systemMatchedFilters: Prisma.JsonValue | null;
  systemAssessedAt: Date;
  floorPlan: {
    id: bigint;
    builderId: bigint;
  };
};

type SystemEvaluationState = {
  status: DesignOnLotStatus;
  failReasons: string[];
  manualReviewReasons: string[];
  matchedFilters: Prisma.InputJsonValue | Prisma.JsonValue | null;
  assessedAt: Date;
};

type EffectiveDesignOnLotState = {
  status: DesignOnLotStatus;
  isCompatible: boolean;
  failReasons: string[];
  manualReviewReasons: string[];
  matchedFilters: Prisma.InputJsonValue | Prisma.JsonValue | null;
  assessedAt: Date;
};

type EvaluationLogContext = {
  lotId: string;
  floorPlanId: string;
};

type RuleSourceRefs = {
  zoningRuleId: string | null;
  stateRuleSetId: string | null;
  estateRuleSetId: string | null;
  lotConstraintIds: string[];
  stateMatchedRuleLabels: string[];
  estateMatchedRuleLabels: string[];
  lotOverrideMatchedRuleLabels: string[];
  lotConstraintMatchedRuleLabels: Array<{
    constraintId: string;
    labels: string[];
  }>;
};

type ResolvedRules = {
  rules: NormalizedRules;
  matchedRuleLabels: string[];
};

type RangeCondition = {
  min: number | null;
  max: number | null;
};

type RuleWhenClause = {
  lotAreaSqm?: RangeCondition;
  lotWidthM?: RangeCondition;
  frontageM?: RangeCondition;
  lotTypeIn?: string[];
  roadFacingIn?: string[];
  lifecycleStageIn?: string[];
  precinctIn?: string[];
};

type ConditionalRuleCandidate = {
  label: string;
  when: RuleWhenClause;
  rulesRaw: unknown;
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
const DESIGN_ON_LOT_EVALUATOR_VERSION = 2;

@Injectable()
export class DesignOnLotService {
  private readonly logger = new Logger(DesignOnLotService.name);

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

  async ensureLotEvaluationCurrent(lotId: bigint): Promise<LotRecomputeSummary | null> {
    const rows = await this.prisma.$queryRaw<Array<{ isCurrent: boolean }>>`
      SELECT NOT EXISTS (
        SELECT 1
        FROM "designOnLot"
        WHERE "lotId" = ${lotId}
          AND (
            CASE
              WHEN "systemMatchedFilters"->>'evaluatorVersion' ~ '^[0-9]+$'
                THEN ("systemMatchedFilters"->>'evaluatorVersion')::integer
              ELSE 0
            END
          ) < ${DESIGN_ON_LOT_EVALUATOR_VERSION}
      ) as "isCurrent"
    `;

    if (rows[0]?.isCurrent) {
      return null;
    }

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

  async reviewDesignOnLot(
    id: bigint,
    reviewDecision: DesignOnLotReviewDecision,
    reviewedByUserId: bigint | null,
    reviewNote?: string | null,
  ) {
    const existing = await this.prisma.designOnLot.findUnique({
      where: { id },
      select: {
        id: true,
        systemStatus: true,
        systemFailReasons: true,
        systemManualReviewReasons: true,
        systemMatchedFilters: true,
        systemAssessedAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Design-on-lot record not found');
    }

    const normalizedNote = this.normalizeReviewNote_(reviewNote);
    const reviewedAt = new Date();
    const effectiveState = this.resolveEffectiveDesignOnLotState_(
      {
        status: existing.systemStatus,
        failReasons: existing.systemFailReasons,
        manualReviewReasons: existing.systemManualReviewReasons,
        matchedFilters: existing.systemMatchedFilters,
        assessedAt: existing.systemAssessedAt,
      },
      {
        reviewDecision,
        reviewNote: normalizedNote,
        reviewedAt,
        reviewedByUserId,
      },
    );

    return this.prisma.designOnLot.update({
      where: { id },
      data: {
        reviewDecision,
        reviewNote: normalizedNote,
        reviewedAt,
        reviewedByUserId,
        isCompatible: effectiveState.isCompatible,
        status: effectiveState.status,
        failReasons: effectiveState.failReasons,
        manualReviewReasons: effectiveState.manualReviewReasons,
        matchedFilters: this.toJsonFieldInput_(effectiveState.matchedFilters),
        assessedAt: effectiveState.assessedAt,
      },
    });
  }

  async clearDesignOnLotReview(id: bigint) {
    const existing = await this.prisma.designOnLot.findUnique({
      where: { id },
      select: {
        id: true,
        systemStatus: true,
        systemFailReasons: true,
        systemManualReviewReasons: true,
        systemMatchedFilters: true,
        systemAssessedAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Design-on-lot record not found');
    }

    const effectiveState = this.resolveEffectiveDesignOnLotState_(
      {
        status: existing.systemStatus,
        failReasons: existing.systemFailReasons,
        manualReviewReasons: existing.systemManualReviewReasons,
        matchedFilters: existing.systemMatchedFilters,
        assessedAt: existing.systemAssessedAt,
      },
      this.createEmptyReviewState_(),
    );

    return this.prisma.designOnLot.update({
      where: { id },
      data: {
        reviewDecision: DesignOnLotReviewDecision.NONE,
        reviewNote: null,
        reviewedAt: null,
        reviewedByUserId: null,
        isCompatible: effectiveState.isCompatible,
        status: effectiveState.status,
        failReasons: effectiveState.failReasons,
        manualReviewReasons: effectiveState.manualReviewReasons,
        matchedFilters: this.toJsonFieldInput_(effectiveState.matchedFilters),
        assessedAt: effectiveState.assessedAt,
      },
    });
  }

  async reviewDesignOnLotsForLot(params: {
    lotId: bigint;
    reviewDecision: DesignOnLotReviewDecision;
    reviewedByUserId: bigint | null;
    scope: 'manual_review' | 'all' | 'selected';
    ids?: bigint[];
    reviewNote?: string | null;
  }): Promise<{ lotId: string; updated: number; ids: string[] }> {
    const where: Prisma.designOnLotWhereInput = {
      lotId: params.lotId,
    };

    if (params.scope === 'manual_review') {
      where.systemStatus = DesignOnLotStatus.MANUAL_REVIEW;
    }

    if (params.scope === 'selected') {
      if (!params.ids?.length) {
        return { lotId: params.lotId.toString(), updated: 0, ids: [] };
      }
      where.id = { in: params.ids };
    }

    const rows = await this.prisma.designOnLot.findMany({
      where,
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    if (!rows.length) {
      return { lotId: params.lotId.toString(), updated: 0, ids: [] };
    }

    const normalizedNote = this.normalizeReviewNote_(params.reviewNote);
    for (const row of rows) {
      await this.reviewDesignOnLot(
        row.id,
        params.reviewDecision,
        params.reviewedByUserId,
        normalizedNote,
      );
    }

    return {
      lotId: params.lotId.toString(),
      updated: rows.length,
      ids: rows.map((row) => row.id.toString()),
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
    const lotGeometry = await this.getLotPlacementGeometry_(lot.id, lot.geojson);
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

    let requestedFloorPlans: Array<{ id: bigint; builderId: bigint; areaSqm: number; width: number; depth: number; storeys: number | null; buildingHeight_m: number | null }> = [];
    if (options?.floorPlanIds?.length) {
      requestedFloorPlans = await this.prisma.floorPlan.findMany({
        where: { id: { in: options.floorPlanIds } },
        select: {
          id: true,
          builderId: true,
          areaSqm: true,
          width: true,
          depth: true,
          storeys: true,
          buildingHeight_m: true,
        },
      });
    }

    const existingRows = await this.prisma.designOnLot.findMany({
      where: {
        lotId: lot.id,
        ...(options?.floorPlanIds?.length
          ? { floorPlanId: { in: options.floorPlanIds } }
          : {}),
      },
      include: {
        floorPlan: {
          select: {
            id: true,
            builderId: true,
          },
        },
      },
    });
    const existingRowByFloorPlanId = new Map(
      existingRows.map((row) => [row.floorPlanId.toString(), row]),
    );

    const frontageFromGeo = this.readNumber(this.asObject(lot.geojson), [
      ['frontageM'],
      ['frontage'],
    ]);
    const normalizedLifecycleStage = normalizeLotLifecycleStage(lot.lifecycleStage);
    const lotUnavailableReason =
      normalizedLifecycleStage === 'available'
        ? null
        : `Lot is not available for plan matching (stage: ${normalizedLifecycleStage ?? 'unset'})`;

    const lotContext: LotRuleContext = {
      lotAreaSqm: lot.areaSqm,
      lotWidthM: dimensions.width,
      lotDepthM: dimensions.depth,
      frontageM: lot.frontageM ?? frontageFromGeo ?? null,
      lotType: lot.lotType ?? null,
      roadFacing: lot.roadFacing ?? null,
      lifecycleStage: normalizedLifecycleStage,
      precinct: lot.precinct ?? null,
    };

    const baseRules = this.normalizeRulesFromZoning_(zoningRule);
    const stateResolved = this.resolveRulesWithConditions_(stateRuleSet?.rules, lotContext);
    const estateResolved = this.resolveRulesWithConditions_(estateRuleSet?.rules, lotContext);
    const lotConstraintResolved = lotConstraints.map((item) => ({
      constraintId: item.id.toString(),
      resolved: this.resolveRulesWithConditions_(item.rules, lotContext),
    }));
    const lotOverrideResolved = this.resolveRulesWithConditions_(lot.ruleOverrides, lotContext);

    let effectiveRules = this.mergeRules_(baseRules, stateResolved.rules);
    effectiveRules = this.mergeRules_(effectiveRules, estateResolved.rules);
    for (const item of lotConstraintResolved) {
      effectiveRules = this.mergeRules_(effectiveRules, item.resolved.rules);
    }
    effectiveRules = this.mergeRules_(effectiveRules, lotOverrideResolved.rules);

    const sourceRefs: RuleSourceRefs = {
      zoningRuleId: zoningRule ? zoningRule.id.toString() : null,
      stateRuleSetId: stateRuleSet ? stateRuleSet.id.toString() : null,
      estateRuleSetId: estateRuleSet ? estateRuleSet.id.toString() : null,
      lotConstraintIds: lotConstraints.map((item) => item.id.toString()),
      stateMatchedRuleLabels: stateResolved.matchedRuleLabels,
      estateMatchedRuleLabels: estateResolved.matchedRuleLabels,
      lotOverrideMatchedRuleLabels: lotOverrideResolved.matchedRuleLabels,
      lotConstraintMatchedRuleLabels: lotConstraintResolved.map((item) => ({
        constraintId: item.constraintId,
        labels: item.resolved.matchedRuleLabels,
      })),
    };

    let processed = 0;
    let pass = 0;
    let fail = 0;
    let manualReview = 0;
    const touchedFloorPlanIds = new Set<string>();

    for (const floorPlan of approvedFloorPlans) {
      const outcome = lotUnavailableReason
        ? this.buildIneligibleLotOutcome_(
            lot.areaSqm,
            dimensions,
            effectiveRules,
            lotUnavailableReason,
          )
        : this.evaluateFloorPlan_(
            floorPlan,
            lot.areaSqm,
            dimensions,
            lotGeometry,
            effectiveRules,
            {
              lotId: lot.id.toString(),
              floorPlanId: floorPlan.id.toString(),
            },
          );
      await this.persistDesignOnLotEvaluation_({
        existingRow: existingRowByFloorPlanId.get(floorPlan.id.toString()) ?? null,
        lotId: lot.id,
        floorPlanId: floorPlan.id,
        outcome,
        effectiveRules,
        sourceRefs,
        lotContext,
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

      const failReason = lotUnavailableReason ?? 'Builder is not approved for this estate';
      if (!lotUnavailableReason) {
        this.logger.log(
          `[design-on-lot:evaluation] ${JSON.stringify({
            event: 'design_on_lot_not_evaluated',
            lotId: lot.id.toString(),
            floorPlanId: floorPlan.id.toString(),
            reason: failReason,
            builderId: floorPlan.builderId.toString(),
            approvedBuilderIds: approvedBuilderIds.map((value) => value.toString()),
          })}`,
        );
      }

      const outcome = this.buildIneligibleLotOutcome_(
        lot.areaSqm,
        dimensions,
        effectiveRules,
        failReason,
      );

      await this.persistDesignOnLotEvaluation_({
        existingRow: existingRowByFloorPlanId.get(floorPlan.id.toString()) ?? null,
        lotId: lot.id,
        floorPlanId: floorPlan.id,
        outcome,
        effectiveRules,
        sourceRefs,
        lotContext,
        stateRuleSetId: stateRuleSet?.id ?? null,
        estateRuleSetId: estateRuleSet?.id ?? null,
      });

      touchedFloorPlanIds.add(floorPlan.id.toString());
      processed += 1;
      fail += 1;
    }

    for (const row of existingRows) {
      const floorPlanIdText = row.floorPlanId.toString();
      if (touchedFloorPlanIds.has(floorPlanIdText)) {
        continue;
      }

      const failReason = lotUnavailableReason ?? 'Builder is not approved for this estate';
      const approved = approvedBuilderSet.has(row.floorPlan.builderId.toString());
      if (!lotUnavailableReason && approved) {
        continue;
      }

      await this.persistDesignOnLotEvaluation_({
        existingRow: row,
        lotId: row.lotId,
        floorPlanId: row.floorPlanId,
        outcome: this.buildIneligibleLotOutcome_(
          lot.areaSqm,
          dimensions,
          effectiveRules,
          failReason,
        ),
        effectiveRules,
        sourceRefs,
        lotContext,
        stateRuleSetId: stateRuleSet?.id ?? null,
        estateRuleSetId: estateRuleSet?.id ?? null,
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

  private async persistDesignOnLotEvaluation_(params: {
    existingRow: ExistingDesignOnLotRow | null;
    lotId: bigint;
    floorPlanId: bigint;
    outcome: EvaluationOutcome;
    effectiveRules: NormalizedRules;
    sourceRefs: RuleSourceRefs;
    lotContext: LotRuleContext;
    stateRuleSetId: bigint | null;
    estateRuleSetId: bigint | null;
  }) {
    const {
      existingRow,
      lotId,
      floorPlanId,
      outcome,
      effectiveRules,
      sourceRefs,
      lotContext,
      stateRuleSetId,
      estateRuleSetId,
    } = params;

    const systemAssessedAt = new Date();
    const systemMatchedFilters = {
      evaluatorVersion: DESIGN_ON_LOT_EVALUATOR_VERSION,
      effectiveRules,
      sourceRefs,
      lotContext,
      spacing: outcome.spacing,
      maxCoverageArea: outcome.maxCoverageArea,
      usableWidth: outcome.usableWidth,
      usableDepth: outcome.usableDepth,
      geometricPlacement: outcome.geometricPlacement,
    } satisfies Prisma.InputJsonObject;

    const effectiveState = this.resolveEffectiveDesignOnLotState_(
      {
        status: outcome.status,
        failReasons: outcome.failReasons,
        manualReviewReasons: outcome.manualReviewReasons,
        matchedFilters: systemMatchedFilters,
        assessedAt: systemAssessedAt,
      },
      existingRow ?? this.createEmptyReviewState_(),
    );

    const commonData = {
      isCompatible: effectiveState.isCompatible,
      status: effectiveState.status,
      failReasons: effectiveState.failReasons,
      manualReviewReasons: effectiveState.manualReviewReasons,
      matchedFilters: this.toJsonFieldInput_(effectiveState.matchedFilters),
      assessedAt: effectiveState.assessedAt,
      systemStatus: outcome.status,
      systemFailReasons: outcome.failReasons,
      systemManualReviewReasons: outcome.manualReviewReasons,
      systemMatchedFilters: this.toJsonFieldInput_(systemMatchedFilters),
      systemAssessedAt,
      stateRuleSetId,
      estateRuleSetId,
    };

    if (existingRow) {
      await this.prisma.designOnLot.update({
        where: { lotId_floorPlanId: { lotId, floorPlanId } },
        data: commonData,
      });
      return;
    }

    await this.prisma.designOnLot.create({
      data: {
        lotId,
        floorPlanId,
        reviewDecision: DesignOnLotReviewDecision.NONE,
        ...commonData,
      },
    });
  }

  private createEmptyReviewState_(): DesignOnLotReviewState {
    return {
      reviewDecision: DesignOnLotReviewDecision.NONE,
      reviewNote: null,
      reviewedAt: null,
      reviewedByUserId: null,
    };
  }

  private normalizeReviewNote_(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed || null;
  }

  private toJsonFieldInput_(
    value: Prisma.InputJsonValue | Prisma.JsonValue | null,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (value === null) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private resolveEffectiveDesignOnLotState_(
    systemState: SystemEvaluationState,
    reviewState: DesignOnLotReviewState,
  ): EffectiveDesignOnLotState {
    const assessedAt = reviewState.reviewedAt ?? systemState.assessedAt;

    if (reviewState.reviewDecision === DesignOnLotReviewDecision.APPROVED) {
      return {
        status: DesignOnLotStatus.PASS,
        isCompatible: true,
        failReasons: [],
        manualReviewReasons: [],
        matchedFilters: systemState.matchedFilters,
        assessedAt,
      };
    }

    if (reviewState.reviewDecision === DesignOnLotReviewDecision.REJECTED) {
      return {
        status: DesignOnLotStatus.FAIL,
        isCompatible: false,
        failReasons: [
          reviewState.reviewNote?.trim() || 'Rejected by reviewer',
        ],
        manualReviewReasons: [],
        matchedFilters: systemState.matchedFilters,
        assessedAt,
      };
    }

    return {
      status: systemState.status,
      isCompatible: systemState.status === DesignOnLotStatus.PASS,
      failReasons: systemState.failReasons,
      manualReviewReasons: systemState.manualReviewReasons,
      matchedFilters: systemState.matchedFilters,
      assessedAt: systemState.assessedAt,
    };
  }

  private buildIneligibleLotOutcome_(
    lotAreaSqm: number,
    dimensions: LotDimensions,
    effectiveRules: NormalizedRules,
    failReason: string,
  ): EvaluationOutcome {
    return {
      status: DesignOnLotStatus.FAIL,
      isCompatible: false,
      failReasons: [failReason],
      manualReviewReasons: [],
      spacing: {
        front: effectiveRules.minFrontSetbackM,
        rear: effectiveRules.minRearSetbackM,
        side: effectiveRules.minSideSetbackM,
      },
      maxCoverageArea:
        effectiveRules.maxSiteCoverageRatio !== null
          ? Number((lotAreaSqm * effectiveRules.maxSiteCoverageRatio).toFixed(2))
          : null,
      usableWidth: dimensions.width,
      usableDepth: dimensions.depth,
      geometricPlacement: null,
    };
  }

  private evaluateFloorPlan_(
    floorPlan: {
      areaSqm: number;
      width: number;
      depth: number;
      storeys: number | null;
      buildingHeight_m: number | null;
    },
    lotAreaSqm: number,
    lotDimensions: LotDimensions,
    lotGeometry: PlacementRingResult | null,
    rules: NormalizedRules,
    evaluationContext: EvaluationLogContext,
  ): EvaluationOutcome {
    const failReasons: string[] = [];
    const manualReviewReasons: string[] = [];
    const checks: Array<{
      check: string;
      passed: boolean;
      details: string;
    }> = [];
    const addCheck = (check: string, passed: boolean, details: string) => {
      checks.push({ check, passed, details });
    };

    const front = rules.minFrontSetbackM ?? 0;
    const rear = rules.minRearSetbackM ?? 0;
    const side = rules.minSideSetbackM ?? 0;
    const usableWidth = Number((lotDimensions.width - 2 * side).toFixed(2));
    const usableDepth = Number((lotDimensions.depth - (front + rear)).toFixed(2));
    const envelopeArea =
      usableWidth > 0 && usableDepth > 0
        ? Number((usableWidth * usableDepth).toFixed(2))
        : null;
    let geometricPlacement: Prisma.InputJsonObject | null = null;

    const lotWidthValid = Number.isFinite(lotDimensions.width) && lotDimensions.width > 0;
    addCheck(
      'lotWidthValid',
      lotWidthValid,
      `lotWidth=${lotDimensions.width}`,
    );
    if (!lotWidthValid) {
      failReasons.push('Lot width is missing or invalid');
    }

    const lotDepthValid = Number.isFinite(lotDimensions.depth) && lotDimensions.depth > 0;
    addCheck(
      'lotDepthValid',
      lotDepthValid,
      `lotDepth=${lotDimensions.depth}`,
    );
    if (!lotDepthValid) {
      failReasons.push('Lot depth is missing or invalid');
    }

    const designWidthFits = floorPlan.width <= usableWidth;
    addCheck(
      'designWidthWithinUsableWidth',
      designWidthFits,
      `designWidth=${floorPlan.width}, usableWidth=${usableWidth}`,
    );
    if (!designWidthFits) {
      failReasons.push(
        `Design width ${floorPlan.width}m exceeds usable width ${usableWidth}m`,
      );
    }

    const designDepthFits = floorPlan.depth <= usableDepth;
    addCheck(
      'designDepthWithinUsableDepth',
      designDepthFits,
      `designDepth=${floorPlan.depth}, usableDepth=${usableDepth}`,
    );
    if (!designDepthFits) {
      failReasons.push(
        `Design depth ${floorPlan.depth}m exceeds usable depth ${usableDepth}m`,
      );
    }

    if (usableWidth <= 0 || usableDepth <= 0) {
      addCheck(
        'setbackEnvelopePositive',
        false,
        `usableWidth=${usableWidth}, usableDepth=${usableDepth}`,
      );
      failReasons.push('Setbacks leave no valid building envelope');
    } else {
      addCheck(
        'setbackEnvelopePositive',
        true,
        `usableWidth=${usableWidth}, usableDepth=${usableDepth}`,
      );

      const areaFitsEnvelope = floorPlan.areaSqm <= (envelopeArea ?? 0);
      addCheck(
        'houseAreaWithinSetbackEnvelope',
        areaFitsEnvelope,
        `houseArea=${floorPlan.areaSqm}, envelopeArea=${envelopeArea}`,
      );
      if (!areaFitsEnvelope) {
        failReasons.push(
          `House area ${floorPlan.areaSqm}m2 exceeds setback envelope area ${envelopeArea}m2`,
        );
      }
    }

    const maxCoverageArea =
      rules.maxSiteCoverageRatio !== null
        ? Number((lotAreaSqm * rules.maxSiteCoverageRatio).toFixed(2))
        : null;

    if (maxCoverageArea !== null) {
      const coverageOk = floorPlan.areaSqm <= maxCoverageArea;
      addCheck(
        'houseAreaWithinMaxSiteCoverage',
        coverageOk,
        `houseArea=${floorPlan.areaSqm}, maxCoverageArea=${maxCoverageArea}, maxCoverageRatio=${rules.maxSiteCoverageRatio}`,
      );
      if (!coverageOk) {
        failReasons.push(
          `House area ${floorPlan.areaSqm}m2 exceeds max site coverage ${maxCoverageArea}m2`,
        );
      }
    } else {
      addCheck(
        'houseAreaWithinMaxSiteCoverage',
        true,
        'maxSiteCoverageRatio not configured',
      );
    }

    if (rules.minGfaM2 !== null) {
      const minGfaOk = floorPlan.areaSqm >= rules.minGfaM2;
      addCheck(
        'houseAreaAboveMinGfa',
        minGfaOk,
        `houseArea=${floorPlan.areaSqm}, minGfa=${rules.minGfaM2}`,
      );
      if (!minGfaOk) {
        failReasons.push(
          `House area ${floorPlan.areaSqm}m2 is below minimum GFA ${rules.minGfaM2}m2`,
        );
      }
    } else {
      addCheck('houseAreaAboveMinGfa', true, 'minGfaM2 not configured');
    }

    if (rules.maxGfaM2 !== null) {
      const maxGfaOk = floorPlan.areaSqm <= rules.maxGfaM2;
      addCheck(
        'houseAreaBelowMaxGfa',
        maxGfaOk,
        `houseArea=${floorPlan.areaSqm}, maxGfa=${rules.maxGfaM2}`,
      );
      if (!maxGfaOk) {
        failReasons.push(
          `House area ${floorPlan.areaSqm}m2 exceeds maximum GFA ${rules.maxGfaM2}m2`,
        );
      }
    } else {
      addCheck('houseAreaBelowMaxGfa', true, 'maxGfaM2 not configured');
    }

    const geometricPlacementResult = this.evaluateGeometricPlacement_(
      floorPlan,
      lotGeometry,
      { front, rear, side },
    );
    geometricPlacement = geometricPlacementResult?.details ?? null;

    if (geometricPlacementResult) {
      addCheck(
        'designFootprintWithinBuildableSetbackPolygon',
        geometricPlacementResult.fits,
        geometricPlacementResult.reason,
      );
      if (!geometricPlacementResult.fits) {
        failReasons.push(geometricPlacementResult.reason);
      }
    } else {
      addCheck(
        'designFootprintWithinBuildableSetbackPolygon',
        true,
        'lot geometry/frontage unavailable; geometric placement skipped',
      );
    }

    if (rules.maxStoreys !== null) {
      if (floorPlan.storeys === null) {
        addCheck(
          'storeysWithinMaxStoreys',
          false,
          `storeys missing, maxStoreys=${rules.maxStoreys}`,
        );
        manualReviewReasons.push('Storey count is required to validate max storeys');
      } else if (floorPlan.storeys > rules.maxStoreys) {
        addCheck(
          'storeysWithinMaxStoreys',
          false,
          `storeys=${floorPlan.storeys}, maxStoreys=${rules.maxStoreys}`,
        );
        failReasons.push(`Storeys ${floorPlan.storeys} exceed max storeys ${rules.maxStoreys}`);
      } else {
        addCheck(
          'storeysWithinMaxStoreys',
          true,
          `storeys=${floorPlan.storeys}, maxStoreys=${rules.maxStoreys}`,
        );
      }
    } else {
      addCheck('storeysWithinMaxStoreys', true, 'maxStoreys not configured');
    }

    if (rules.maxBuildingHeightM !== null) {
      if (floorPlan.buildingHeight_m === null) {
        addCheck(
          'heightWithinMaxHeight',
          false,
          `buildingHeight missing, maxBuildingHeight=${rules.maxBuildingHeightM}`,
        );
        manualReviewReasons.push('Building height is required to validate max building height');
      } else if (floorPlan.buildingHeight_m > rules.maxBuildingHeightM) {
        addCheck(
          'heightWithinMaxHeight',
          false,
          `buildingHeight=${floorPlan.buildingHeight_m}, maxBuildingHeight=${rules.maxBuildingHeightM}`,
        );
        failReasons.push(
          `Building height ${floorPlan.buildingHeight_m}m exceeds max height ${rules.maxBuildingHeightM}m`,
        );
      } else {
        addCheck(
          'heightWithinMaxHeight',
          true,
          `buildingHeight=${floorPlan.buildingHeight_m}, maxBuildingHeight=${rules.maxBuildingHeightM}`,
        );
      }
    } else {
      addCheck('heightWithinMaxHeight', true, 'maxBuildingHeightM not configured');
    }

    if (rules.requiresArchitecturalReview) {
      addCheck('architecturalReviewRequired', false, 'requiresArchitecturalReview=true');
      manualReviewReasons.push('Architectural/style requirements require manual review');
    } else {
      addCheck('architecturalReviewRequired', true, 'requiresArchitecturalReview=false');
    }
    if (rules.architecturalNotes.length > 0) {
      addCheck(
        'architecturalNotesPresent',
        false,
        `architecturalNotesCount=${rules.architecturalNotes.length}`,
      );
      for (const note of rules.architecturalNotes) {
        manualReviewReasons.push(`Manual review: ${note}`);
      }
    } else {
      addCheck('architecturalNotesPresent', true, 'no architecturalNotes');
    }

    const status =
      failReasons.length > 0
        ? DesignOnLotStatus.FAIL
        : manualReviewReasons.length > 0
          ? DesignOnLotStatus.MANUAL_REVIEW
          : DesignOnLotStatus.PASS;

    this.logFloorPlanEvaluation_({
      evaluationContext,
      lotAreaSqm,
      lotDimensions,
      floorPlan,
      rules,
      front,
      rear,
      side,
      usableWidth,
      usableDepth,
      envelopeArea,
      maxCoverageArea,
      checks,
      failReasons,
      manualReviewReasons,
      status,
    });

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
      geometricPlacement,
    };
  }

  private async getLotPlacementGeometry_(
    lotId: bigint,
    lotGeojson: unknown,
  ): Promise<PlacementRingResult | null> {
    type LotGeometryRow = {
      geometry: string | null;
      frontageCoordinate: string | null;
    };

    const rows = await this.prisma.$queryRaw<LotGeometryRow[]>`
      SELECT
        ST_AsGeoJSON(geometry) as geometry,
        ST_AsGeoJSON("frontageCoordinate") as "frontageCoordinate"
      FROM lot
      WHERE id = ${lotId}
    `;
    const row = rows[0] ?? null;
    const ring = this.extractPolygonRing_(row?.geometry ?? null);

    if (!ring) {
      return null;
    }

    const geojson = this.asObject(lotGeojson);
    const lotMetadata = this.asObject(geojson?.lotMetadata);
    const frontageLine =
      this.parseFrontageLineCoordinates_(row?.frontageCoordinate) ??
      this.parseFrontageLineCoordinates_(lotMetadata?.frontageCoordinate);

    return this.getPlacementRing_(ring, frontageLine);
  }

  private evaluateGeometricPlacement_(
    floorPlan: {
      areaSqm: number;
      width: number;
      depth: number;
    },
    lotGeometry: PlacementRingResult | null,
    setbacks: SetbackValues,
  ): GeometricPlacementEvaluation | null {
    if (!lotGeometry?.frontageAligned) {
      return null;
    }

    const houseWidth = Number(floorPlan.width);
    const houseDepth = Number(floorPlan.depth);
    if (
      !Number.isFinite(houseWidth) ||
      !Number.isFinite(houseDepth) ||
      houseWidth <= 0 ||
      houseDepth <= 0
    ) {
      return null;
    }

    const buildableRing = this.getPlacementInsetRing_(lotGeometry.ring, setbacks);
    if (!buildableRing) {
      return {
        fits: false,
        reason: 'Unable to derive a valid buildable setback polygon for this lot',
        details: {
          checked: true,
          fits: false,
          reason: 'Unable to derive a valid buildable setback polygon for this lot',
          frontageAligned: lotGeometry.frontageAligned,
          setbacks,
          floorPlan: {
            widthM: houseWidth,
            depthM: houseDepth,
            areaSqm: floorPlan.areaSqm,
          },
        },
      };
    }

    const houseBoundary = this.buildTrueSizeFrontAnchoredHouseBoundary_(
      buildableRing,
      houseWidth,
      houseDepth,
    );
    if (!houseBoundary) {
      return {
        fits: false,
        reason: 'Unable to place the design footprint inside the buildable setback polygon',
        details: {
          checked: true,
          fits: false,
          reason: 'Unable to place the design footprint inside the buildable setback polygon',
          frontageAligned: lotGeometry.frontageAligned,
          setbacks,
          floorPlan: {
            widthM: houseWidth,
            depthM: houseDepth,
            areaSqm: floorPlan.areaSqm,
          },
          lotRing: this.toRoundedRingJson_(lotGeometry.ring),
          buildableRing: this.toRoundedRingJson_(buildableRing),
        },
      };
    }

    const buildablePolygon = turf.polygon([buildableRing]) as Feature<Polygon>;
    let fits: boolean;
    let buildableEnvelopeAreaSqm: number | null;
    let houseFootprintAreaSqm: number | null;
    try {
      fits = turf.booleanWithin(houseBoundary.boundary, buildablePolygon);
      buildableEnvelopeAreaSqm = this.roundGeometryNumber_(turf.area(buildablePolygon), 2);
      houseFootprintAreaSqm = this.roundGeometryNumber_(turf.area(houseBoundary.boundary), 2);
    } catch {
      return null;
    }
    const reason = fits
      ? 'Design footprint fits within the buildable setback polygon'
      : `Design footprint ${houseWidth}m x ${houseDepth}m does not fit within the buildable setback polygon`;

    return {
      fits,
      reason,
      details: {
        checked: true,
        fits,
        reason,
        frontageAligned: lotGeometry.frontageAligned,
        setbacks,
        floorPlan: {
          widthM: houseWidth,
          depthM: houseDepth,
          areaSqm: floorPlan.areaSqm,
        },
        buildableEnvelopeAreaSqm,
        houseFootprintAreaSqm,
        placement: {
          frontOffsetM: this.roundGeometryNumber_(houseBoundary.candidate.frontOffset, 3),
          centerOffsetM: this.roundGeometryNumber_(houseBoundary.candidate.centerX, 3),
          exactFit: houseBoundary.candidate.exactFit,
          overflowM: this.roundGeometryNumber_(houseBoundary.candidate.overflow, 3),
          minClearanceM: this.roundGeometryNumber_(houseBoundary.candidate.minClearance, 3),
        },
        lotRing: this.toRoundedRingJson_(lotGeometry.ring),
        buildableRing: this.toRoundedRingJson_(buildableRing),
        houseRing: this.toRoundedRingJson_(
          houseBoundary.boundary.geometry.coordinates[0] as Pt[],
        ),
      },
    };
  }

  private extractPolygonRing_(geometry: unknown): Pt[] | null {
    const parsed = this.parseJsonValue_(geometry);
    const geometryObject = this.asObject(parsed);
    const type = typeof geometryObject?.type === 'string' ? geometryObject.type : null;
    const coordinates = geometryObject?.coordinates;

    if (type === 'Polygon' && Array.isArray(coordinates)) {
      return this.normalizeClosedRing_(coordinates[0]);
    }

    if (
      type === 'MultiPolygon' &&
      Array.isArray(coordinates) &&
      Array.isArray(coordinates[0])
    ) {
      return this.normalizeClosedRing_(coordinates[0][0]);
    }

    return null;
  }

  private parseFrontageLineCoordinates_(frontageCoordinate: unknown): Pt[] | null {
    const parsed = this.parseJsonValue_(frontageCoordinate);
    const frontageObject = this.asObject(parsed);

    if (frontageObject?.type !== 'LineString') {
      return null;
    }

    const coordinates = frontageObject.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }

    const line = coordinates
      .map((point) =>
        Array.isArray(point) && point.length >= 2
          ? ([Number(point[0]), Number(point[1])] as Pt)
          : null,
      )
      .filter((point): point is Pt =>
        Array.isArray(point) &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1]),
      );

    return line.length >= 2 ? line : null;
  }

  private getPlacementRing_(ring: Pt[], frontageLine: Pt[] | null): PlacementRingResult {
    if (!frontageLine) {
      return {
        ring,
        frontageLine: null,
        frontageAligned: false,
      };
    }

    const frontageMidpoint = this.getFrontageMidpoint_(frontageLine);
    const frontageBearing = turf.bearing(
      frontageLine[0],
      frontageLine[frontageLine.length - 1],
    );

    let bestEdgeIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let index = 0; index < ring.length - 1; index += 1) {
      const edgeStart = ring[index];
      const edgeEnd = ring[index + 1];
      const edgeMidpoint = turf.midpoint(
        turf.point(edgeStart),
        turf.point(edgeEnd),
      ).geometry.coordinates as Pt;
      const midpointDistance = turf.distance(
        turf.point(edgeMidpoint),
        turf.point(frontageMidpoint),
        { units: 'meters' },
      );
      const edgeBearing = turf.bearing(edgeStart, edgeEnd);
      const parallelPenalty = this.getParallelBearingDifference_(
        edgeBearing,
        frontageBearing,
      );
      const score = midpointDistance + parallelPenalty * 0.5;

      if (score < bestScore) {
        bestScore = score;
        bestEdgeIndex = index;
      }
    }

    return {
      ring: this.consolidateFrontageChain_({
        ring,
        bestEdgeIndex,
        frontageLine,
        frontageBearing,
      }),
      frontageLine,
      frontageAligned: true,
    };
  }

  private consolidateFrontageChain_(params: {
    ring: Pt[];
    bestEdgeIndex: number;
    frontageLine: Pt[];
    frontageBearing: number;
  }): Pt[] {
    const { ring, bestEdgeIndex, frontageLine, frontageBearing } = params;
    const openRing = ring.slice(0, -1);
    const totalEdges = openRing.length;
    const frontageLineFeature = turf.lineString(frontageLine);
    const isFrontageLikeEdge = (edgeIndex: number) => {
      const start = openRing[edgeIndex];
      const end = openRing[(edgeIndex + 1) % totalEdges];
      const edgeBearing = turf.bearing(start, end);
      const parallelDelta = this.getParallelBearingDifference_(
        edgeBearing,
        frontageBearing,
      );
      const edgeMidpoint = turf.midpoint(turf.point(start), turf.point(end));
      const distanceToFrontage = turf.pointToLineDistance(
        edgeMidpoint,
        frontageLineFeature,
        { units: 'meters' },
      );

      return parallelDelta <= 8 && distanceToFrontage <= 8;
    };

    let startEdgeIndex = bestEdgeIndex;
    let endEdgeIndex = bestEdgeIndex;
    let frontageEdgeCount = 1;

    while (frontageEdgeCount < totalEdges) {
      const previousEdgeIndex = (startEdgeIndex - 1 + totalEdges) % totalEdges;
      if (!isFrontageLikeEdge(previousEdgeIndex)) {
        break;
      }
      startEdgeIndex = previousEdgeIndex;
      frontageEdgeCount += 1;
    }

    while (frontageEdgeCount < totalEdges) {
      const nextEdgeIndex = (endEdgeIndex + 1) % totalEdges;
      if (!isFrontageLikeEdge(nextEdgeIndex)) {
        break;
      }
      endEdgeIndex = nextEdgeIndex;
      frontageEdgeCount += 1;
    }

    if (frontageEdgeCount <= 1) {
      return this.rotateClosedRingToStartAtEdge_(ring, bestEdgeIndex);
    }

    const consolidatedOpenRing: Pt[] = [
      openRing[startEdgeIndex],
      openRing[(endEdgeIndex + 1) % totalEdges],
    ];
    let cursor = (endEdgeIndex + 1) % totalEdges;

    while (cursor !== startEdgeIndex) {
      cursor = (cursor + 1) % totalEdges;
      if (cursor !== startEdgeIndex) {
        consolidatedOpenRing.push(openRing[cursor]);
      }
    }

    return consolidatedOpenRing.length >= 3
      ? [...consolidatedOpenRing, consolidatedOpenRing[0]]
      : this.rotateClosedRingToStartAtEdge_(ring, bestEdgeIndex);
  }

  private getPlacementInsetRing_(ring: Pt[], setbacks: SetbackValues): Pt[] | null {
    if (!ring || ring.length < 4) {
      return null;
    }

    const openRing = ring.slice(0, -1);
    const projection = this.createLocalProjectionFromRing_(ring);
    const localRing = openRing.map((point) => this.projectPointToLocal_(point, projection));

    if (localRing.length < 3) {
      return null;
    }

    const frontStart = localRing[0];
    const frontEnd = localRing[1];
    const frontMid = this.midpoint_(frontStart, frontEnd);
    const alongFront = this.unit_([
      frontEnd[0] - frontStart[0],
      frontEnd[1] - frontStart[1],
    ]);

    let inward: Pt = [-alongFront[1], alongFront[0]];
    const centroid: Pt = [
      localRing.reduce((sum, point) => sum + point[0], 0) / localRing.length,
      localRing.reduce((sum, point) => sum + point[1], 0) / localRing.length,
    ];
    const centroidVector: Pt = [
      centroid[0] - frontMid[0],
      centroid[1] - frontMid[1],
    ];
    if (this.dot_(inward, centroidVector) < 0) {
      inward = [-inward[0], -inward[1]];
    }

    const edgeDepths = localRing.map((point, index) => {
      const next = localRing[(index + 1) % localRing.length];
      const edgeMid = this.midpoint_(point, next);
      return this.dot_(
        [edgeMid[0] - frontMid[0], edgeMid[1] - frontMid[1]],
        inward,
      );
    });
    const rearEdgeIndex = edgeDepths.reduce(
      (bestIndex, depth, index) =>
        depth > edgeDepths[bestIndex] ? index : bestIndex,
      1,
    );

    const orientation = this.polygonOrientation_([...localRing, localRing[0]]);
    const normalSign = orientation > 0 ? -1 : 1;
    const offsetEdges: Array<[Pt, Pt]> = [];

    for (let index = 0; index < localRing.length; index += 1) {
      const start = localRing[index];
      const end = localRing[(index + 1) % localRing.length];
      const edgeUnit = this.unit_([end[0] - start[0], end[1] - start[1]]);
      const inwardNormal: Pt = [
        normalSign * -edgeUnit[1],
        normalSign * edgeUnit[0],
      ];
      const setbackDistance =
        index === 0
          ? setbacks.front
          : index === rearEdgeIndex
            ? setbacks.rear
            : setbacks.side;
      offsetEdges.push([
        [
          start[0] + inwardNormal[0] * setbackDistance,
          start[1] + inwardNormal[1] * setbackDistance,
        ],
        [
          end[0] + inwardNormal[0] * setbackDistance,
          end[1] + inwardNormal[1] * setbackDistance,
        ],
      ]);
    }

    const innerLocal: Pt[] = [];
    for (let index = 0; index < offsetEdges.length; index += 1) {
      const previousEdge = offsetEdges[(index - 1 + offsetEdges.length) % offsetEdges.length];
      const currentEdge = offsetEdges[index];
      innerLocal.push(
        this.intersectLines_(
          previousEdge[0],
          previousEdge[1],
          currentEdge[0],
          currentEdge[1],
        ),
      );
    }

    if (innerLocal.length < 3) {
      return null;
    }

    return this.unprojectRingFromLocal_([...innerLocal, innerLocal[0]], projection);
  }

  private buildTrueSizeFrontAnchoredHouseBoundary_(
    innerLL: Pt[],
    houseWidth: number,
    houseDepth: number,
  ): TrueSizeHouseBoundary | null {
    if (houseWidth <= 0 || houseDepth <= 0 || innerLL.length < 4) {
      return null;
    }

    const placementBasis = this.createPlacementBasis_(innerLL);
    if (!placementBasis) {
      return null;
    }

    const openBasisRing = placementBasis.basisRing;
    const maxDepth = Math.max(...openBasisRing.map((point) => point[1]));
    const searchLimit = maxDepth - houseDepth;
    const epsilon = 0.01;

    if (!Number.isFinite(searchLimit)) {
      return null;
    }

    const candidateFrontOffsets = new Set<number>([epsilon]);
    for (let offset = epsilon; offset <= searchLimit + epsilon; offset += 0.25) {
      candidateFrontOffsets.add(this.roundPlacementValue_(offset));
    }
    for (const point of openBasisRing) {
      if (point[1] >= epsilon && point[1] <= searchLimit + epsilon) {
        candidateFrontOffsets.add(this.roundPlacementValue_(point[1]));
      }
    }

    const sortedOffsets = Array.from(candidateFrontOffsets).sort(
      (left, right) => left - right,
    );

    let bestExactCandidate: FrontAnchoredPlacementCandidate | null = null;
    let bestApproximateCandidate: FrontAnchoredPlacementCandidate | null = null;

    for (const rawFrontOffset of sortedOffsets) {
      const frontOffset = Math.max(epsilon, rawFrontOffset);
      const candidate = this.evaluateFrontAnchoredPlacement_({
        ring: openBasisRing,
        houseWidth,
        houseDepth,
        frontOffset,
        maxDepth,
      });
      if (!candidate) {
        continue;
      }

      if (candidate.exactFit) {
        if (
          !bestExactCandidate ||
          candidate.minClearance > bestExactCandidate.minClearance + 0.01 ||
          (Math.abs(candidate.minClearance - bestExactCandidate.minClearance) <= 0.01 &&
            candidate.frontOffset < bestExactCandidate.frontOffset) ||
          (Math.abs(candidate.minClearance - bestExactCandidate.minClearance) <= 0.01 &&
            Math.abs(candidate.frontOffset - bestExactCandidate.frontOffset) <= 0.01 &&
            Math.abs(candidate.centerX) < Math.abs(bestExactCandidate.centerX))
        ) {
          bestExactCandidate = candidate;
        }
        continue;
      }

      if (
        !bestApproximateCandidate ||
        candidate.overflow < bestApproximateCandidate.overflow - 0.01 ||
        (Math.abs(candidate.overflow - bestApproximateCandidate.overflow) <= 0.01 &&
          candidate.minClearance > bestApproximateCandidate.minClearance + 0.01) ||
        (Math.abs(candidate.overflow - bestApproximateCandidate.overflow) <= 0.01 &&
          Math.abs(candidate.minClearance - bestApproximateCandidate.minClearance) <= 0.01 &&
          candidate.frontOffset < bestApproximateCandidate.frontOffset)
      ) {
        bestApproximateCandidate = candidate;
      }
    }

    const finalCandidate =
      bestExactCandidate ??
      bestApproximateCandidate ??
      ({
        frontOffset: epsilon,
        centerX: 0,
        exactFit: false,
        overflow: Number.POSITIVE_INFINITY,
        minClearance: 0,
      } satisfies FrontAnchoredPlacementCandidate);
    const halfWidth = houseWidth / 2;
    const rectangleBasisRing: Pt[] = [
      [finalCandidate.centerX - halfWidth, finalCandidate.frontOffset],
      [finalCandidate.centerX + halfWidth, finalCandidate.frontOffset],
      [finalCandidate.centerX + halfWidth, finalCandidate.frontOffset + houseDepth],
      [finalCandidate.centerX - halfWidth, finalCandidate.frontOffset + houseDepth],
      [finalCandidate.centerX - halfWidth, finalCandidate.frontOffset],
    ];

    return {
      boundary: turf.polygon([
        rectangleBasisRing.map((point) => placementBasis.toLngLat(point)),
      ]) as Feature<Polygon>,
      candidate: finalCandidate,
    };
  }

  private createPlacementBasis_(ringLL: Pt[]): PlacementBasis | null {
    if (!ringLL || ringLL.length < 4) {
      return null;
    }

    const openRing = ringLL.slice(0, -1);
    const projection = this.createLocalProjectionFromRing_(ringLL);
    const localRing = openRing.map((point) => this.projectPointToLocal_(point, projection));

    if (localRing.length < 3) {
      return null;
    }

    const frontStart = localRing[0];
    const frontEnd = localRing[1];
    const frontMid = this.midpoint_(frontStart, frontEnd);
    const alongFront = this.unit_([
      frontEnd[0] - frontStart[0],
      frontEnd[1] - frontStart[1],
    ]);
    const centroid: Pt = [
      localRing.reduce((sum, point) => sum + point[0], 0) / localRing.length,
      localRing.reduce((sum, point) => sum + point[1], 0) / localRing.length,
    ];
    const centroidVector: Pt = [
      centroid[0] - frontMid[0],
      centroid[1] - frontMid[1],
    ];

    let inward: Pt = [-alongFront[1], alongFront[0]];
    if (this.dot_(inward, centroidVector) < 0) {
      inward = [-inward[0], -inward[1]];
    }

    const edgeDepthSpans = localRing.map((point, index) => {
      const next = localRing[(index + 1) % localRing.length];
      return Math.abs(
        this.dot_([next[0] - point[0], next[1] - point[1]], inward),
      );
    });
    const maxDepthSpan = Math.max(...edgeDepthSpans);
    const sideCandidates = localRing
      .map((point, index) => {
        if (index === 0) {
          return null;
        }
        const next = localRing[(index + 1) % localRing.length];
        const edgeVector: Pt = [next[0] - point[0], next[1] - point[1]];
        const edgeLength = Math.hypot(edgeVector[0], edgeVector[1]);
        const depthSpan = Math.abs(this.dot_(edgeVector, inward));
        if (
          edgeLength <= 0.01 ||
          depthSpan < Math.max(8, maxDepthSpan * 0.45)
        ) {
          return null;
        }
        const candidate = this.unit_(edgeVector);
        return this.dot_(candidate, inward) < 0
          ? ([-candidate[0], -candidate[1]] as Pt)
          : candidate;
      })
      .filter((candidate): candidate is Pt => Boolean(candidate));

    if (sideCandidates.length > 0) {
      const sideBasis = sideCandidates.reduce<Pt>(
        (sum, candidate, index) => {
          const alignedCandidate =
            index > 0 && this.dot_(sum, candidate) < 0
              ? ([-candidate[0], -candidate[1]] as Pt)
              : candidate;
          return [sum[0] + alignedCandidate[0], sum[1] + alignedCandidate[1]];
        },
        [0, 0],
      );
      const sideInward = this.unit_(sideBasis);
      const sideAlignmentDelta = this.getParallelBearingDifference_(
        (Math.atan2(sideInward[0], sideInward[1]) * 180) / Math.PI,
        (Math.atan2(inward[0], inward[1]) * 180) / Math.PI,
      );

      if (sideAlignmentDelta <= 25 && this.dot_(sideInward, centroidVector) > 0) {
        inward = sideInward;
      }
    }

    let alongWidth: Pt = [inward[1], -inward[0]];
    if (this.dot_(alongWidth, alongFront) < 0) {
      alongWidth = [-alongWidth[0], -alongWidth[1]];
    }

    const basisRing = localRing.map((point) => {
      const relativePoint: Pt = [
        point[0] - frontMid[0],
        point[1] - frontMid[1],
      ];
      return [
        this.dot_(relativePoint, alongWidth),
        this.dot_(relativePoint, inward),
      ] as Pt;
    });

    return {
      basisRing,
      toLngLat: (point: Pt) =>
        this.unprojectPointFromLocal_(
          [
            frontMid[0] + alongWidth[0] * point[0] + inward[0] * point[1],
            frontMid[1] + alongWidth[1] * point[0] + inward[1] * point[1],
          ],
          projection,
        ),
    };
  }

  private evaluateFrontAnchoredPlacement_(params: {
    ring: Pt[];
    houseWidth: number;
    houseDepth: number;
    frontOffset: number;
    maxDepth: number;
  }): FrontAnchoredPlacementCandidate | null {
    const { ring, houseWidth, houseDepth, frontOffset, maxDepth } = params;
    const rearOffset = frontOffset + houseDepth;
    const sampledRearOffset = Math.min(rearOffset, maxDepth);
    const sampleDepths = this.getPlacementSampleDepths_(
      ring,
      frontOffset,
      sampledRearOffset,
    );
    const intervals = sampleDepths
      .map((depth) => this.getScanlineInterval_(ring, depth))
      .filter((interval): interval is [number, number] => Array.isArray(interval));

    if (intervals.length === 0) {
      return null;
    }

    const preferredCenterX =
      intervals.reduce((sum, interval) => sum + (interval[0] + interval[1]) / 2, 0) /
      intervals.length;
    const leftBoundary = Math.max(...intervals.map((interval) => interval[0]));
    const rightBoundary = Math.min(...intervals.map((interval) => interval[1]));
    const candidateCenters = new Set<number>([
      0,
      preferredCenterX,
      leftBoundary + houseWidth / 2,
      rightBoundary - houseWidth / 2,
    ]);

    let bestCandidate: FrontAnchoredPlacementCandidate | null = null;
    for (const centerX of candidateCenters) {
      const left = centerX - houseWidth / 2;
      const right = centerX + houseWidth / 2;
      const lateralOverflow = intervals.reduce((maxOverflow, interval) => {
        const leftOverflow = Math.max(interval[0] - left, 0);
        const rightOverflow = Math.max(right - interval[1], 0);
        return Math.max(maxOverflow, leftOverflow, rightOverflow);
      }, 0);
      const depthOverflow = Math.max(rearOffset - maxDepth, 0);
      const overflow = Math.max(lateralOverflow, depthOverflow);
      const minClearance = Math.min(
        ...intervals.map((interval) =>
          Math.min(left - interval[0], interval[1] - right),
        ),
      );
      const exactFit = overflow <= 0.01;
      const candidate: FrontAnchoredPlacementCandidate = {
        frontOffset,
        centerX,
        exactFit,
        overflow,
        minClearance,
      };

      if (!bestCandidate) {
        bestCandidate = candidate;
        continue;
      }

      if (candidate.exactFit !== bestCandidate.exactFit) {
        if (candidate.exactFit) {
          bestCandidate = candidate;
        }
        continue;
      }

      if (candidate.exactFit) {
        if (
          candidate.minClearance > bestCandidate.minClearance + 0.01 ||
          (Math.abs(candidate.minClearance - bestCandidate.minClearance) <= 0.01 &&
            candidate.frontOffset < bestCandidate.frontOffset)
        ) {
          bestCandidate = candidate;
        }
        continue;
      }

      if (
        candidate.overflow < bestCandidate.overflow - 0.01 ||
        (Math.abs(candidate.overflow - bestCandidate.overflow) <= 0.01 &&
          candidate.minClearance > bestCandidate.minClearance + 0.01) ||
        (Math.abs(candidate.overflow - bestCandidate.overflow) <= 0.01 &&
          Math.abs(candidate.minClearance - bestCandidate.minClearance) <= 0.01 &&
          candidate.frontOffset < bestCandidate.frontOffset)
      ) {
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  private getPlacementSampleDepths_(
    ring: Pt[],
    frontOffset: number,
    rearOffset: number,
  ): number[] {
    const epsilon = 1e-6;
    const criticalDepths = [
      frontOffset,
      rearOffset,
      ...ring
        .map((point) => point[1])
        .filter((depth) => depth > frontOffset + epsilon && depth < rearOffset - epsilon),
    ].sort((left, right) => left - right);

    const samples = new Set<number>(criticalDepths);
    for (let index = 0; index < criticalDepths.length - 1; index += 1) {
      const start = criticalDepths[index];
      const end = criticalDepths[index + 1];
      if (end - start > epsilon) {
        samples.add(this.roundPlacementValue_((start + end) / 2));
      }
    }

    return Array.from(samples).sort((left, right) => left - right);
  }

  private getScanlineInterval_(ring: Pt[], yValue: number): [number, number] | null {
    const intersections: number[] = [];
    const epsilon = 1e-6;

    for (let index = 0; index < ring.length; index += 1) {
      const start = ring[index];
      const end = ring[(index + 1) % ring.length];

      if (Math.abs(start[1] - end[1]) < epsilon) {
        if (Math.abs(yValue - start[1]) < epsilon) {
          intersections.push(start[0], end[0]);
        }
        continue;
      }

      const t = (yValue - start[1]) / (end[1] - start[1]);
      if (t >= -epsilon && t <= 1 + epsilon) {
        intersections.push(start[0] + (end[0] - start[0]) * t);
      }
    }

    const unique = intersections
      .sort((left, right) => left - right)
      .filter(
        (value, index, values) =>
          index === 0 || Math.abs(value - values[index - 1]) > epsilon,
      );

    if (unique.length < 2) {
      return null;
    }

    return [unique[0], unique[unique.length - 1]];
  }

  private normalizeClosedRing_(ring: unknown): Pt[] | null {
    if (!Array.isArray(ring) || ring.length < 4) {
      return null;
    }

    const pointsEqual = (left: Pt, right: Pt) =>
      Math.abs(left[0] - right[0]) < 1e-9 &&
      Math.abs(left[1] - right[1]) < 1e-9;

    const openRing = ring
      .map((point) =>
        Array.isArray(point) && point.length >= 2
          ? ([Number(point[0]), Number(point[1])] as Pt)
          : null,
      )
      .filter((point): point is Pt =>
        Array.isArray(point) &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1]),
      );

    const dedupedRing = openRing.reduce<Pt[]>((points, point) => {
      const previous = points[points.length - 1];
      if (!previous || !pointsEqual(previous, point)) {
        points.push(point);
      }
      return points;
    }, []);

    while (
      dedupedRing.length > 1 &&
      pointsEqual(dedupedRing[0], dedupedRing[dedupedRing.length - 1])
    ) {
      dedupedRing.pop();
    }

    if (dedupedRing.length < 3) {
      return null;
    }

    return [...dedupedRing, dedupedRing[0]];
  }

  private rotateClosedRingToStartAtEdge_(ring: Pt[], edgeIndex: number): Pt[] {
    const openRing = ring.slice(0, -1);
    const totalEdges = openRing.length;
    const start = ((edgeIndex % totalEdges) + totalEdges) % totalEdges;
    const rotated = Array.from(
      { length: totalEdges },
      (_, index) => openRing[(start + index) % totalEdges],
    );
    return [...rotated, rotated[0]];
  }

  private getFrontageMidpoint_(frontageLine: Pt[]): Pt {
    const line = turf.lineString(frontageLine);
    const totalLength = turf.length(line, { units: 'meters' });
    if (totalLength <= 0) {
      return frontageLine[0];
    }
    return turf.along(line, totalLength / 2, { units: 'meters' }).geometry
      .coordinates as Pt;
  }

  private getParallelBearingDifference_(bearingA: number, bearingB: number): number {
    const rawDiff = Math.abs(((bearingA - bearingB + 180) % 360) - 180);
    return Math.min(rawDiff, Math.abs(rawDiff - 180));
  }

  private createLocalProjectionFromRing_(ringLL: Pt[]): LocalProjection {
    const openRing =
      ringLL.length > 1 &&
      Math.abs(ringLL[0][0] - ringLL[ringLL.length - 1][0]) < 1e-9 &&
      Math.abs(ringLL[0][1] - ringLL[ringLL.length - 1][1]) < 1e-9
        ? ringLL.slice(0, -1)
        : ringLL;
    const originLng =
      openRing.reduce((sum, point) => sum + point[0], 0) / openRing.length;
    const originLat =
      openRing.reduce((sum, point) => sum + point[1], 0) / openRing.length;
    const origin: Pt = [originLng, originLat];
    const originPoint = turf.point(origin);

    return {
      origin,
      metersPerLngDegree:
        turf.distance(originPoint, turf.point([originLng + 0.001, originLat]), {
          units: 'meters',
        }) * 1000,
      metersPerLatDegree:
        turf.distance(originPoint, turf.point([originLng, originLat + 0.001]), {
          units: 'meters',
        }) * 1000,
    };
  }

  private projectPointToLocal_(point: Pt, projection: LocalProjection): Pt {
    return [
      (point[0] - projection.origin[0]) * projection.metersPerLngDegree,
      (point[1] - projection.origin[1]) * projection.metersPerLatDegree,
    ];
  }

  private unprojectPointFromLocal_(point: Pt, projection: LocalProjection): Pt {
    return [
      point[0] / projection.metersPerLngDegree + projection.origin[0],
      point[1] / projection.metersPerLatDegree + projection.origin[1],
    ];
  }

  private unprojectRingFromLocal_(ring: Pt[], projection: LocalProjection): Pt[] {
    return ring.map((point) => this.unprojectPointFromLocal_(point, projection));
  }

  private polygonOrientation_(points: Pt[]): number {
    let sum = 0;
    for (let index = 0; index < points.length - 1; index += 1) {
      const [x1, y1] = points[index];
      const [x2, y2] = points[index + 1];
      sum += (x2 - x1) * (y2 + y1);
    }
    return sum;
  }

  private unit_(vec: Pt): Pt {
    const length = Math.hypot(vec[0], vec[1]) || 1;
    return [vec[0] / length, vec[1] / length];
  }

  private intersectLines_(a1: Pt, a2: Pt, b1: Pt, b2: Pt): Pt {
    const x1 = a1[0];
    const y1 = a1[1];
    const x2 = a2[0];
    const y2 = a2[1];
    const x3 = b1[0];
    const y3 = b1[1];
    const x4 = b2[0];
    const y4 = b2[1];
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denominator) < 1e-9) {
      return a2;
    }
    const px =
      ((x1 * y2 - y1 * x2) * (x3 - x4) -
        (x1 - x2) * (x3 * y4 - y3 * x4)) /
      denominator;
    const py =
      ((x1 * y2 - y1 * x2) * (y3 - y4) -
        (y1 - y2) * (x3 * y4 - y3 * x4)) /
      denominator;
    return [px, py];
  }

  private midpoint_(a: Pt, b: Pt): Pt {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }

  private dot_(a: Pt, b: Pt): number {
    return a[0] * b[0] + a[1] * b[1];
  }

  private roundPlacementValue_(value: number): number {
    return Number.isFinite(value) ? Number(value.toFixed(4)) : value;
  }

  private roundGeometryNumber_(
    value: number | null | undefined,
    digits = 3,
  ): number | null {
    return value !== null && value !== undefined && Number.isFinite(value)
      ? Number(value.toFixed(digits))
      : null;
  }

  private toRoundedRingJson_(ring: Pt[]): Prisma.InputJsonArray {
    return ring.map((point) => [
      this.roundGeometryNumber_(point[0], 7),
      this.roundGeometryNumber_(point[1], 7),
    ]);
  }

  private parseJsonValue_(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
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

  private resolveRulesWithConditions_(
    rawRules: unknown,
    context: LotRuleContext,
  ): ResolvedRules {
    const rulesObj = this.asObject(rawRules);
    if (!rulesObj) {
      return { rules: { ...EMPTY_RULES }, matchedRuleLabels: [] };
    }

    let resolvedRules = this.normalizeRulesFromJson_(rulesObj);
    const matchedRuleLabels: string[] = [];
    const candidates = this.extractConditionalRuleCandidates_(rulesObj);

    for (const candidate of candidates) {
      if (!this.matchesWhenClause_(candidate.when, context)) {
        continue;
      }
      const conditionalRules = this.normalizeRulesFromJson_(candidate.rulesRaw);
      resolvedRules = this.mergeRules_(resolvedRules, conditionalRules);
      matchedRuleLabels.push(candidate.label);
    }

    return {
      rules: resolvedRules,
      matchedRuleLabels,
    };
  }

  private extractConditionalRuleCandidates_(rules: JsonObject): ConditionalRuleCandidate[] {
    const candidates: ConditionalRuleCandidate[] = [];

    const explicit = this.readPath_(rules, ['conditionalRules']);
    if (Array.isArray(explicit)) {
      explicit.forEach((item, index) => {
        const itemObj = this.asObject(item);
        if (!itemObj) return;

        const when = this.normalizeWhenClause_(this.asObject(itemObj.when));
        if (!when) return;

        const label = this.readString(itemObj, [['label']]) ?? `conditional-${index + 1}`;

        const rulesRaw = this.asObject(itemObj.rules);
        if (!rulesRaw) {
          return;
        }

        candidates.push({
          label,
          when,
          rulesRaw,
        });
      });
    }

    candidates.push(
      ...this.extractBandCandidates_(rules, {
        arrayKey: 'lotAreaBands',
        labelPrefix: 'lot-area-band',
        whenField: 'lotAreaSqm',
        minPaths: [['minAreaSqm']],
        maxPaths: [['maxAreaSqm']],
      }),
    );

    candidates.push(
      ...this.extractBandCandidates_(rules, {
        arrayKey: 'lotWidthBands',
        labelPrefix: 'lot-width-band',
        whenField: 'lotWidthM',
        minPaths: [['minLotWidthM']],
        maxPaths: [['maxLotWidthM']],
      }),
    );

    candidates.push(
      ...this.extractBandCandidates_(rules, {
        arrayKey: 'frontageBands',
        labelPrefix: 'frontage-band',
        whenField: 'frontageM',
        minPaths: [['minFrontageM']],
        maxPaths: [['maxFrontageM']],
      }),
    );

    candidates.push(
      ...this.extractCategoricalCandidates_(rules, {
        arrayKey: 'lotTypeRules',
        labelPrefix: 'lot-type-rule',
        whenField: 'lotTypeIn',
        valuePaths: [['lotTypeIn']],
      }),
    );

    candidates.push(
      ...this.extractCategoricalCandidates_(rules, {
        arrayKey: 'roadFacingRules',
        labelPrefix: 'road-facing-rule',
        whenField: 'roadFacingIn',
        valuePaths: [['roadFacingIn']],
      }),
    );

    candidates.push(
      ...this.extractCategoricalCandidates_(rules, {
        arrayKey: 'stageRules',
        labelPrefix: 'stage-rule',
        whenField: 'lifecycleStageIn',
        valuePaths: [['lifecycleStageIn']],
      }),
    );

    candidates.push(
      ...this.extractCategoricalCandidates_(rules, {
        arrayKey: 'precinctRules',
        labelPrefix: 'precinct-rule',
        whenField: 'precinctIn',
        valuePaths: [['precinctIn']],
      }),
    );

    return candidates;
  }

  private extractBandCandidates_(
    rules: JsonObject,
    options: {
      arrayKey: string;
      labelPrefix: string;
      whenField: 'lotAreaSqm' | 'lotWidthM' | 'frontageM';
      minPaths: string[][];
      maxPaths: string[][];
    },
  ): ConditionalRuleCandidate[] {
    const result: ConditionalRuleCandidate[] = [];
    const rawBands = this.readPath_(rules, [options.arrayKey]);
    if (!Array.isArray(rawBands)) {
      return result;
    }

    rawBands.forEach((item, index) => {
      const itemObj = this.asObject(item);
      if (!itemObj) return;

      const min = this.readNumber(itemObj, options.minPaths);
      const max = this.readNumber(itemObj, options.maxPaths);
      if (min === null && max === null) {
        return;
      }

      const label = this.readString(itemObj, [['label']]) ?? `${options.labelPrefix}-${index + 1}`;

      const when: RuleWhenClause = {
        [options.whenField]: {
          min,
          max,
        },
      };

      const rulesRaw = this.asObject(itemObj.rules);
      if (!rulesRaw) {
        return;
      }

      result.push({
        label,
        when,
        rulesRaw,
      });
    });

    return result;
  }

  private extractCategoricalCandidates_(
    rules: JsonObject,
    options: {
      arrayKey: string;
      labelPrefix: string;
      whenField: 'lotTypeIn' | 'roadFacingIn' | 'lifecycleStageIn' | 'precinctIn';
      valuePaths: string[][];
    },
  ): ConditionalRuleCandidate[] {
    const result: ConditionalRuleCandidate[] = [];
    const rawList = this.readPath_(rules, [options.arrayKey]);
    if (!Array.isArray(rawList)) {
      return result;
    }

    rawList.forEach((item, index) => {
      const itemObj = this.asObject(item);
      if (!itemObj) return;

      const values = this.readStringArray(itemObj, options.valuePaths);
      if (!values.length) {
        return;
      }

      const label = this.readString(itemObj, [['label']]) ?? `${options.labelPrefix}-${index + 1}`;

      const when: RuleWhenClause = {
        [options.whenField]: values,
      };

      const rulesRaw = this.asObject(itemObj.rules);
      if (!rulesRaw) {
        return;
      }

      result.push({
        label,
        when,
        rulesRaw,
      });
    });

    return result;
  }

  private normalizeWhenClause_(rawWhen: JsonObject | null): RuleWhenClause | null {
    if (!rawWhen) {
      return null;
    }

    const lotAreaSqm = this.parseRangeCondition_(rawWhen, {
      containerPaths: [['lotAreaSqm']],
      minPaths: [],
      maxPaths: [],
    });
    const lotWidthM = this.parseRangeCondition_(rawWhen, {
      containerPaths: [['lotWidthM']],
      minPaths: [],
      maxPaths: [],
    });
    const frontageM = this.parseRangeCondition_(rawWhen, {
      containerPaths: [['frontageM']],
      minPaths: [],
      maxPaths: [],
    });

    const lotTypeIn = this.readStringArray(rawWhen, [['lotTypeIn']]);
    const roadFacingIn = this.readStringArray(rawWhen, [['roadFacingIn']]);
    const lifecycleStageIn = this.readStringArray(rawWhen, [['lifecycleStageIn']]);
    const precinctIn = this.readStringArray(rawWhen, [['precinctIn']]);

    const clause: RuleWhenClause = {};
    if (lotAreaSqm) clause.lotAreaSqm = lotAreaSqm;
    if (lotWidthM) clause.lotWidthM = lotWidthM;
    if (frontageM) clause.frontageM = frontageM;
    if (lotTypeIn.length) clause.lotTypeIn = lotTypeIn;
    if (roadFacingIn.length) clause.roadFacingIn = roadFacingIn;
    if (lifecycleStageIn.length) clause.lifecycleStageIn = lifecycleStageIn;
    if (precinctIn.length) clause.precinctIn = precinctIn;

    if (
      !clause.lotAreaSqm &&
      !clause.lotWidthM &&
      !clause.frontageM &&
      !clause.lotTypeIn &&
      !clause.roadFacingIn &&
      !clause.lifecycleStageIn &&
      !clause.precinctIn
    ) {
      return null;
    }

    return clause;
  }

  private parseRangeCondition_(
    value: JsonObject,
    options: {
      containerPaths: string[][];
      minPaths: string[][];
      maxPaths: string[][];
    },
  ): RangeCondition | null {
    let min: number | null = null;
    let max: number | null = null;

    for (const path of options.containerPaths) {
      const container = this.asObject(this.readPath_(value, path));
      if (!container) continue;

      min = this.readNumber(container, [['min']]) ?? min;
      max = this.readNumber(container, [['max']]) ?? max;
    }

    min = this.readNumber(value, options.minPaths) ?? min;
    max = this.readNumber(value, options.maxPaths) ?? max;

    if (min === null && max === null) {
      return null;
    }

    return { min, max };
  }

  private matchesWhenClause_(clause: RuleWhenClause, context: LotRuleContext): boolean {
    if (clause.lotAreaSqm && !this.rangeMatches_(context.lotAreaSqm, clause.lotAreaSqm)) {
      return false;
    }
    if (clause.lotWidthM && !this.rangeMatches_(context.lotWidthM, clause.lotWidthM)) {
      return false;
    }
    if (clause.frontageM) {
      if (context.frontageM === null || !this.rangeMatches_(context.frontageM, clause.frontageM)) {
        return false;
      }
    }
    if (clause.lotTypeIn && !this.stringInList_(context.lotType, clause.lotTypeIn, false)) {
      return false;
    }
    if (clause.roadFacingIn && !this.stringInList_(context.roadFacing, clause.roadFacingIn, true)) {
      return false;
    }
    if (
      clause.lifecycleStageIn &&
      !this.stringInList_(context.lifecycleStage, clause.lifecycleStageIn, false)
    ) {
      return false;
    }
    if (clause.precinctIn && !this.stringInList_(context.precinct, clause.precinctIn, false)) {
      return false;
    }
    return true;
  }

  private rangeMatches_(value: number, range: RangeCondition): boolean {
    if (range.min !== null && value < range.min) {
      return false;
    }
    if (range.max !== null && value > range.max) {
      return false;
    }
    return true;
  }

  private stringInList_(value: string | null, list: string[], useContains: boolean): boolean {
    if (!value) return false;
    const current = value.trim().toLowerCase();
    if (!current) return false;
    const normalized = list.map((item) => item.trim().toLowerCase()).filter(Boolean);
    if (!normalized.length) return false;

    if (useContains) {
      return normalized.some((item) => current.includes(item) || item.includes(current));
    }

    return normalized.includes(current);
  }

  private normalizeRulesFromJson_(rawRules: unknown): NormalizedRules {
    const rules = this.asObject(rawRules);
    if (!rules) {
      return { ...EMPTY_RULES };
    }

    const architecturalNotes = this.readStringArray(rules, [['architecturalNotes']]);

    const requiresArchitecturalReview =
      this.readBoolean(rules, [['requiresArchitecturalReview']]) ||
      architecturalNotes.length > 0;

    return {
      minFrontSetbackM: this.readNumber(rules, [['minFrontSetbackM']]),
      minRearSetbackM: this.readNumber(rules, [['minRearSetbackM']]),
      minSideSetbackM: this.readNumber(rules, [['minSideSetbackM']]),
      maxSiteCoverageRatio: this.normalizeRatio_(
        this.readNumber(rules, [['maxSiteCoverageRatio']]),
      ),
      minGfaM2: this.readNumber(rules, [['minGfaM2']]),
      maxGfaM2: this.readNumber(rules, [['maxGfaM2']]),
      maxStoreys: this.readNumber(rules, [['maxStoreys']]),
      maxBuildingHeightM: this.readNumber(rules, [['maxBuildingHeightM']]),
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

  private logFloorPlanEvaluation_(params: {
    evaluationContext: EvaluationLogContext;
    lotAreaSqm: number;
    lotDimensions: LotDimensions;
    floorPlan: {
      areaSqm: number;
      width: number;
      depth: number;
      storeys: number | null;
      buildingHeight_m: number | null;
    };
    rules: NormalizedRules;
    front: number;
    rear: number;
    side: number;
    usableWidth: number;
    usableDepth: number;
    envelopeArea: number | null;
    maxCoverageArea: number | null;
    checks: Array<{ check: string; passed: boolean; details: string }>;
    failReasons: string[];
    manualReviewReasons: string[];
    status: DesignOnLotStatus;
  }) {
    const payload = {
      event: 'design_on_lot_evaluation',
      lotId: params.evaluationContext.lotId,
      floorPlanId: params.evaluationContext.floorPlanId,
      input: {
        lotAreaSqm: params.lotAreaSqm,
        lotWidth: params.lotDimensions.width,
        lotDepth: params.lotDimensions.depth,
        floorPlanAreaSqm: params.floorPlan.areaSqm,
        floorPlanWidth: params.floorPlan.width,
        floorPlanDepth: params.floorPlan.depth,
        floorPlanStoreys: params.floorPlan.storeys,
        floorPlanBuildingHeightM: params.floorPlan.buildingHeight_m,
      },
      derived: {
        setbacks: {
          front: params.front,
          rear: params.rear,
          side: params.side,
        },
        usableWidth: params.usableWidth,
        usableDepth: params.usableDepth,
        envelopeArea: params.envelopeArea,
        maxCoverageArea: params.maxCoverageArea,
      },
      rules: params.rules,
      checks: params.checks,
      failReasons: params.failReasons,
      manualReviewReasons: params.manualReviewReasons,
      status: params.status,
    };

    this.logger.log(`[design-on-lot:evaluation] ${JSON.stringify(payload)}`);
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

  private readString(value: JsonObject | null, paths: string[][]): string | null {
    if (!value) return null;
    for (const path of paths) {
      const candidate = this.readPath_(value, path);
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
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
    return null;
  }
}
