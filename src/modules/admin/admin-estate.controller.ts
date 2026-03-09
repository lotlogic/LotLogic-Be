import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EnquiryStatus, Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { EstateScopeGuard } from '@/modules/auth/guards/estate-scope.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { EstateScope } from '@/modules/auth/decorators/estate-scope.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { parseBigIntId } from '@/modules/admin/admin.utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminLotImportService } from '@/modules/admin/admin-lot-import.service';
import { readFileSync } from 'fs';
import { DesignOnLotService } from '@/modules/design-on-lot/design-on-lot.service';

const normalizeBooleanFlag = (
  value: unknown,
  fieldName: string,
): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number' && (value === 0 || value === 1)) {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, 'set')
  ) {
    return normalizeBooleanFlag((value as { set?: unknown }).set, fieldName);
  }
  throw new BadRequestException(`Invalid ${fieldName}`);
};

type EstateCreateBody = Prisma.estateCreateInput & {
  brandGuid?: string | null;
};

type EstateUpdateBody = Prisma.estateUpdateInput & {
  brandGuid?: string | null;
};

const ESTATE_INCLUDE = Prisma.validator<Prisma.estateInclude>()({
  brandSetting: {
    select: {
      guid: true,
      name: true,
      title: true,
    },
  },
});

const MIXPANEL_EXPORT_URL = 'https://data.mixpanel.com/api/2.0/export';
const MIXPANEL_PROJECT_ID = '3834941';
const MIXPANEL_PERFORMANCE_EVENTS = ['House Design Viewed', 'House Design Opened'];
const PERFORMANCE_CACHE_TTL_MS = 5 * 60 * 1000;

type MixpanelEventRecord = {
  event?: string;
  properties?: Record<string, unknown>;
};

type EstatePerformanceSummary = {
  estateId: string;
  range: {
    from: string;
    to: string;
  };
  source: {
    provider: 'mixpanel';
    configured: boolean;
    available: boolean;
    message?: string;
  };
  stats: {
    viewsTotal: number;
    viewsLast7Days: number;
    viewsLast30Days: number;
    uniqueLotsViewed: number;
    uniqueDesignsViewed: number;
    uniqueBuildersViewed: number;
    enquiriesTotal: number;
    enquiriesHot: number;
    enquiriesLast7Days: number;
    enquiriesLast30Days: number;
    enquiriesPending: number;
    enquiriesProcessed: number;
    totalMatchedPlans: number;
  };
  viewsByLot: Array<{
    lotId: string;
    lotLabel?: string;
    views: number;
  }>;
  viewsByDesign: Array<{
    designId: string;
    designName?: string;
    builderId?: string;
    builderName?: string;
    views: number;
  }>;
  viewsByBuilder: Array<{
    builderId: string;
    builderName?: string;
    views: number;
  }>;
  matchesByDesign: Array<{
    designId: string;
    designName?: string;
    builderId?: string;
    builderName?: string;
    matches: number;
  }>;
  enquiriesByLot: Array<{
    lotId: string;
    lotLabel?: string;
    enquiries: number;
  }>;
  enquiriesByBuilder: Array<{
    builderId: string;
    builderName?: string;
    enquiries: number;
  }>;
};

type EstateLotSummary = {
  id: bigint;
  blockKey: string;
  blockNumber: number | null;
  address: string | null;
};

type EstateMatchByDesignRow = {
  floorPlanId: bigint;
  matches: bigint | number;
};

type EstatePerformanceNonViewStats = Omit<
  EstatePerformanceSummary['stats'],
  | 'viewsTotal'
  | 'viewsLast7Days'
  | 'viewsLast30Days'
  | 'uniqueLotsViewed'
  | 'uniqueDesignsViewed'
  | 'uniqueBuildersViewed'
>;

@UseGuards(EasyAuthGuard, RolesGuard, EstateScopeGuard)
@Controller('admin/estates')
export class AdminEstateController {
  private readonly logger = new Logger(AdminEstateController.name);
  private static readonly performanceCache = new Map<
    string,
    { expiresAt: number; payload: EstatePerformanceSummary }
  >();

  constructor(
    private prisma: PrismaService,
    private lotImportService: AdminLotImportService,
    private designOnLotService: DesignOnLotService,
  ) {}

  private normalizeText(value: unknown): string {
    return String(value ?? '').trim();
  }

  private normalizeBrandGuid(value: unknown): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.prototype.hasOwnProperty.call(value, 'set')
    ) {
      return this.normalizeBrandGuid((value as { set?: unknown }).set);
    }

    const normalized = this.normalizeText(value);
    return normalized ? normalized : null;
  }

  private async ensureBrandGuidExists(
    tx: Prisma.TransactionClient,
    brandGuid: string | null | undefined,
  ) {
    if (brandGuid === undefined || brandGuid === null) {
      return;
    }

    const nextBrand = await tx.brandSetting.findUnique({
      where: { guid: brandGuid },
      select: { guid: true },
    });

    if (!nextBrand) {
      throw new BadRequestException('brandGuid does not exist');
    }
  }

  private parseDateQuery(
    rawValue: string | undefined,
    fieldName: string,
    fallback: Date,
  ): Date {
    const trimmed = this.normalizeText(rawValue);
    if (!trimmed) {
      return fallback;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      throw new BadRequestException(`Invalid ${fieldName}. Use YYYY-MM-DD.`);
    }

    const parsed = new Date(`${trimmed}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid ${fieldName}. Use YYYY-MM-DD.`);
    }

    return parsed;
  }

  private toDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private getMixpanelAuthorizationHeader(): string | null {
    const serviceAccountUsername = this.normalizeText(
      process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME,
    );
    const serviceAccountSecret = this.normalizeText(
      process.env.MIXPANEL_SERVICE_ACCOUNT_SECRET,
    );
    if (serviceAccountUsername && serviceAccountSecret) {
      return `Basic ${Buffer.from(`${serviceAccountUsername}:${serviceAccountSecret}`).toString(
        'base64',
      )}`;
    }

    const apiSecret = this.normalizeText(process.env.MIXPANEL_API_SECRET);
    if (apiSecret) {
      return `Basic ${Buffer.from(`${apiSecret}:`).toString('base64')}`;
    }

    return null;
  }

  private resolveEventTimestampMs(event: MixpanelEventRecord): number | null {
    const properties = event.properties ?? {};
    const timeValue = properties.time;
    if (typeof timeValue === 'number' && Number.isFinite(timeValue)) {
      return timeValue > 1e12 ? timeValue : Math.floor(timeValue * 1000);
    }

    const timestampValue = properties.timestamp;
    if (typeof timestampValue === 'string') {
      const parsed = Date.parse(timestampValue);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private async fetchMixpanelEvents(
    fromDate: string,
    toDate: string,
  ): Promise<MixpanelEventRecord[]> {
    const authHeader = this.getMixpanelAuthorizationHeader();
    if (!authHeader) {
      return [];
    }

    const params = new URLSearchParams({
      project_id: MIXPANEL_PROJECT_ID,
      from_date: fromDate,
      to_date: toDate,
      event: JSON.stringify(MIXPANEL_PERFORMANCE_EVENTS),
    });

    const response = await fetch(`${MIXPANEL_EXPORT_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'text/plain',
      },
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new BadRequestException(
        `Mixpanel export request failed (${response.status}): ${bodyText || 'unknown error'}`,
      );
    }

    const bodyText = await response.text();
    if (!bodyText.trim()) {
      return [];
    }

    const rows: MixpanelEventRecord[] = [];
    for (const line of bodyText.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      try {
        rows.push(JSON.parse(trimmed) as MixpanelEventRecord);
      } catch {
        // Skip malformed records to avoid failing the entire response.
      }
    }
    return rows;
  }

  private buildPerformanceCacheKey(estateId: string, fromDate: string, toDate: string): string {
    return `${estateId}|${fromDate}|${toDate}`;
  }

  private readPerformanceCache(cacheKey: string): EstatePerformanceSummary | null {
    const entry = AdminEstateController.performanceCache.get(cacheKey);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      AdminEstateController.performanceCache.delete(cacheKey);
      return null;
    }
    return entry.payload;
  }

  private writePerformanceCache(cacheKey: string, payload: EstatePerformanceSummary) {
    AdminEstateController.performanceCache.set(cacheKey, {
      expiresAt: Date.now() + PERFORMANCE_CACHE_TTL_MS,
      payload,
    });
  }

  private buildLotLabel(lot: EstateLotSummary): string {
    if (typeof lot.blockNumber === 'number') {
      return `Lot ${lot.blockNumber}`;
    }
    const blockKey = this.normalizeText(lot.blockKey);
    if (blockKey) {
      return blockKey;
    }
    const address = this.normalizeText(lot.address);
    if (address) {
      return address;
    }
    return lot.id.toString();
  }

  private buildEmptyPerformanceSummary(
    estateId: string,
    fromDate: string,
    toDate: string,
    configured: boolean,
    available: boolean,
    stats: EstatePerformanceNonViewStats,
    matchesByDesign: EstatePerformanceSummary['matchesByDesign'],
    enquiriesByLot: EstatePerformanceSummary['enquiriesByLot'],
    enquiriesByBuilder: EstatePerformanceSummary['enquiriesByBuilder'],
    message?: string,
  ): EstatePerformanceSummary {
    return {
      estateId,
      range: {
        from: fromDate,
        to: toDate,
      },
      source: {
        provider: 'mixpanel',
        configured,
        available,
        message,
      },
      stats: {
        ...stats,
        viewsTotal: 0,
        viewsLast7Days: 0,
        viewsLast30Days: 0,
        uniqueLotsViewed: 0,
        uniqueDesignsViewed: 0,
        uniqueBuildersViewed: 0,
      },
      viewsByLot: [],
      viewsByDesign: [],
      viewsByBuilder: [],
      matchesByDesign,
      enquiriesByLot,
      enquiriesByBuilder,
    };
  }

  @Get()
  @Roles('ADMIN', 'USER')
  async findAll(@Req() req: AuthenticatedRequest) {
    if (req.auth?.role === 'ADMIN') {
      return this.prisma.estate.findMany({
        orderBy: { id: 'asc' },
        include: ESTATE_INCLUDE,
      });
    }

    const estateIds = await this.prisma.userEstate.findMany({
      where: { userId: req.auth?.id },
      select: { estateId: true },
    });

    return this.prisma.estate.findMany({
      where: { id: { in: estateIds.map((item) => item.estateId) } },
      orderBy: { id: 'asc' },
      include: ESTATE_INCLUDE,
    });
  }

  @Get(':id/performance')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'id' })
  async getEstatePerformance(
    @Param('id') id: string,
    @Query('from') fromDateQuery?: string,
    @Query('to') toDateQuery?: string,
    @Query('forceRefresh') forceRefreshQuery?: string,
  ): Promise<EstatePerformanceSummary> {
    const estateIdValue = parseBigIntId(id, 'id');
    const estateId = estateIdValue.toString();

    const estate = await this.prisma.estate.findUnique({
      where: { id: estateIdValue },
      select: { id: true },
    });
    if (!estate) {
      throw new BadRequestException('Estate not found');
    }

    const today = new Date();
    const defaultFromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = this.parseDateQuery(fromDateQuery, 'from', defaultFromDate);
    const toDate = this.parseDateQuery(toDateQuery, 'to', today);
    if (fromDate.getTime() > toDate.getTime()) {
      throw new BadRequestException('Invalid range. "from" must be before or equal to "to".');
    }

    const fromDateOnly = this.toDateOnly(fromDate);
    const toDateOnly = this.toDateOnly(toDate);
    const normalizedForceRefresh = this.normalizeText(forceRefreshQuery).toLowerCase();
    const forceRefresh =
      normalizedForceRefresh === 'true' ||
      normalizedForceRefresh === '1' ||
      normalizedForceRefresh === 'yes';
    const cacheKey = this.buildPerformanceCacheKey(estateId, fromDateOnly, toDateOnly);
    if (!forceRefresh) {
      const cached = this.readPerformanceCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const lots = await this.prisma.lot.findMany({
      where: { estateId: estateIdValue },
      select: {
        id: true,
        blockKey: true,
        blockNumber: true,
        address: true,
      },
    });

    const lotLookup = new Map<string, { lotId: string; lotLabel: string }>();
    const lotLabelById = new Map<string, string>();
    for (const lot of lots) {
      const lotId = lot.id.toString();
      const lotLabel = this.buildLotLabel(lot);
      lotLabelById.set(lotId, lotLabel);
      lotLookup.set(lotId, { lotId, lotLabel });
      const blockKey = this.normalizeText(lot.blockKey);
      if (blockKey) {
        lotLookup.set(blockKey, { lotId, lotLabel });
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const estateEnquiryWhere: Prisma.enquiryWhereInput = {
      OR: [{ estateId: estateIdValue }, { lot: { estateId: estateIdValue } }],
    };

    const [
      enquiriesTotal,
      enquiriesHot,
      enquiriesLast7Days,
      enquiriesLast30Days,
      enquiriesPending,
      enquiriesProcessed,
      enquiriesForLots,
      enquiryBuilderRows,
      matchRows,
    ] = await this.prisma.$transaction([
      this.prisma.enquiry.count({
        where: estateEnquiryWhere,
      }),
      this.prisma.enquiry.count({
        where: {
          AND: [estateEnquiryWhere, { hotLead: true }],
        },
      }),
      this.prisma.enquiry.count({
        where: {
          AND: [estateEnquiryWhere, { createdAt: { gte: sevenDaysAgo } }],
        },
      }),
      this.prisma.enquiry.count({
        where: {
          AND: [estateEnquiryWhere, { createdAt: { gte: thirtyDaysAgo } }],
        },
      }),
      this.prisma.enquiry.count({
        where: {
          AND: [estateEnquiryWhere, { status: EnquiryStatus.PENDING }],
        },
      }),
      this.prisma.enquiry.count({
        where: {
          AND: [estateEnquiryWhere, { status: EnquiryStatus.PROCESSED }],
        },
      }),
      this.prisma.enquiry.findMany({
        where: estateEnquiryWhere,
        select: { lotId: true },
      }),
      this.prisma.enquiryBuilder.findMany({
        where: { enquiry: estateEnquiryWhere },
        select: {
          builderId: true,
          builder: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.$queryRaw<EstateMatchByDesignRow[]>`
        SELECT
          dol."floorPlanId" AS "floorPlanId",
          COUNT(*)::bigint AS matches
        FROM "designOnLot" dol
        INNER JOIN lot l ON l.id = dol."lotId"
        WHERE l."estateId" = ${estateIdValue}
          AND dol."isCompatible" = true
          AND dol.status = 'PASS'
        GROUP BY dol."floorPlanId"
        ORDER BY matches DESC
        LIMIT 200
      `,
    ]);

    const enquiryLotCounts = new Map<string, number>();
    for (const row of enquiriesForLots) {
      const lotId = row.lotId?.toString();
      if (!lotId) {
        continue;
      }
      enquiryLotCounts.set(lotId, (enquiryLotCounts.get(lotId) || 0) + 1);
    }
    const enquiriesByLot = Array.from(enquiryLotCounts.entries())
      .map(([lotId, enquiries]) => ({
        lotId,
        lotLabel: lotLabelById.get(lotId),
        enquiries,
      }))
      .sort((a, b) => b.enquiries - a.enquiries || a.lotId.localeCompare(b.lotId))
      .slice(0, 50);

    const enquiryBuilderCounts = new Map<string, { builderName?: string; enquiries: number }>();
    for (const row of enquiryBuilderRows) {
      const builderId = row.builderId.toString();
      const existing = enquiryBuilderCounts.get(builderId);
      if (existing) {
        existing.enquiries += 1;
        if (!existing.builderName && row.builder?.name) {
          existing.builderName = row.builder.name;
        }
      } else {
        enquiryBuilderCounts.set(builderId, {
          builderName: row.builder?.name ?? undefined,
          enquiries: 1,
        });
      }
    }
    const enquiriesByBuilder = Array.from(enquiryBuilderCounts.entries())
      .map(([builderId, value]) => ({
        builderId,
        builderName: value.builderName,
        enquiries: value.enquiries,
      }))
      .sort((a, b) => b.enquiries - a.enquiries || a.builderId.localeCompare(b.builderId))
      .slice(0, 50);

    const matchCountsByDesign = new Map<string, number>();
    for (const row of matchRows) {
      const designId = row.floorPlanId.toString();
      const rawCount =
        typeof row.matches === 'bigint'
          ? Number(row.matches)
          : Number.parseInt(String(row.matches), 10);
      const matches = Number.isFinite(rawCount) ? rawCount : 0;
      matchCountsByDesign.set(designId, matches);
    }

    const configured = Boolean(this.getMixpanelAuthorizationHeader());
    const baseStats = {
      enquiriesTotal,
      enquiriesHot,
      enquiriesLast7Days,
      enquiriesLast30Days,
      enquiriesPending,
      enquiriesProcessed,
      totalMatchedPlans: matchCountsByDesign.size,
    };

    if (!configured) {
      const designIdsForLookup = Array.from(matchCountsByDesign.keys())
        .filter((value) => /^\d+$/.test(value))
        .map((value) => BigInt(value));

      const matchedPlans = designIdsForLookup.length
        ? await this.prisma.floorPlan.findMany({
            where: { id: { in: designIdsForLookup } },
            select: {
              id: true,
              name: true,
              builder: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : [];

      const matchedPlanLookup = new Map(
        matchedPlans.map((item) => [
          item.id.toString(),
          {
            designName: item.name,
            builderId: item.builder?.id.toString(),
            builderName: item.builder?.name ?? undefined,
          },
        ]),
      );

      const matchesByDesign = Array.from(matchCountsByDesign.entries())
        .map(([designId, matches]) => {
          const detail = matchedPlanLookup.get(designId);
          return {
            designId,
            designName: detail?.designName,
            builderId: detail?.builderId,
            builderName: detail?.builderName,
            matches,
          };
        })
        .sort((a, b) => b.matches - a.matches || a.designId.localeCompare(b.designId))
        .slice(0, 50);

      return this.buildEmptyPerformanceSummary(
        estateId,
        fromDateOnly,
        toDateOnly,
        false,
        false,
        baseStats,
        matchesByDesign,
        enquiriesByLot,
        enquiriesByBuilder,
        'Mixpanel credentials are not configured in backend environment variables.',
      );
    }

    let events: MixpanelEventRecord[] = [];
    try {
      events = await this.fetchMixpanelEvents(fromDateOnly, toDateOnly);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Unable to fetch Mixpanel estate performance data: ${reason}`);

      const designIdsForLookup = Array.from(matchCountsByDesign.keys())
        .filter((value) => /^\d+$/.test(value))
        .map((value) => BigInt(value));
      const matchedPlans = designIdsForLookup.length
        ? await this.prisma.floorPlan.findMany({
            where: { id: { in: designIdsForLookup } },
            select: {
              id: true,
              name: true,
              builder: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : [];
      const matchedPlanLookup = new Map(
        matchedPlans.map((item) => [
          item.id.toString(),
          {
            designName: item.name,
            builderId: item.builder?.id.toString(),
            builderName: item.builder?.name ?? undefined,
          },
        ]),
      );
      const matchesByDesign = Array.from(matchCountsByDesign.entries())
        .map(([designId, matches]) => {
          const detail = matchedPlanLookup.get(designId);
          return {
            designId,
            designName: detail?.designName,
            builderId: detail?.builderId,
            builderName: detail?.builderName,
            matches,
          };
        })
        .sort((a, b) => b.matches - a.matches || a.designId.localeCompare(b.designId))
        .slice(0, 50);

      return this.buildEmptyPerformanceSummary(
        estateId,
        fromDateOnly,
        toDateOnly,
        true,
        false,
        baseStats,
        matchesByDesign,
        enquiriesByLot,
        enquiriesByBuilder,
        reason,
      );
    }

    const nowMs = Date.now();
    const cutoff7Days = nowMs - 7 * 24 * 60 * 60 * 1000;
    const cutoff30Days = nowMs - 30 * 24 * 60 * 60 * 1000;

    const lotViewCounts = new Map<string, number>();
    const designViewCounts = new Map<
      string,
      { designId: string; designName?: string; builderId?: string; views: number }
    >();

    let viewsTotal = 0;
    let viewsLast7Days = 0;
    let viewsLast30Days = 0;

    for (const event of events) {
      const eventName = this.normalizeText(event.event);
      if (!MIXPANEL_PERFORMANCE_EVENTS.includes(eventName)) {
        continue;
      }

      const properties = event.properties ?? {};
      const eventLotId = this.normalizeText(properties.lotId);
      if (!eventLotId) {
        continue;
      }
      const lotEntry = lotLookup.get(eventLotId);
      if (!lotEntry) {
        continue;
      }

      viewsTotal += 1;
      const timestampMs = this.resolveEventTimestampMs(event);
      if (timestampMs !== null) {
        if (timestampMs >= cutoff7Days) {
          viewsLast7Days += 1;
        }
        if (timestampMs >= cutoff30Days) {
          viewsLast30Days += 1;
        }
      }

      lotViewCounts.set(lotEntry.lotId, (lotViewCounts.get(lotEntry.lotId) || 0) + 1);

      const designId = this.normalizeText(properties.designId);
      const designName = this.normalizeText(properties.designName) || undefined;
      const directBuilderId = this.normalizeText(properties.builderId) || undefined;
      const builderIds = Array.isArray(properties.builderIds)
        ? properties.builderIds
            .map((value) => this.normalizeText(value))
            .filter(Boolean)
        : [];
      const builderId = directBuilderId || builderIds[0] || undefined;

      const designKey = designId || (designName ? `name:${designName.toLowerCase()}` : '');
      if (!designKey) {
        continue;
      }

      const existing = designViewCounts.get(designKey);
      if (existing) {
        existing.views += 1;
        if (!existing.designName && designName) {
          existing.designName = designName;
        }
        if (!existing.builderId && builderId) {
          existing.builderId = builderId;
        }
      } else {
        designViewCounts.set(designKey, {
          designId: designId || designName || 'unknown',
          designName,
          builderId,
          views: 1,
        });
      }
    }

    const designIdsForLookup = new Set<string>();
    for (const row of designViewCounts.values()) {
      if (/^\d+$/.test(row.designId)) {
        designIdsForLookup.add(row.designId);
      }
    }
    for (const idValue of matchCountsByDesign.keys()) {
      if (/^\d+$/.test(idValue)) {
        designIdsForLookup.add(idValue);
      }
    }

    const floorPlanIds = Array.from(designIdsForLookup).map((value) => BigInt(value));
    const floorPlanRows = floorPlanIds.length
      ? await this.prisma.floorPlan.findMany({
          where: { id: { in: floorPlanIds } },
          select: {
            id: true,
            name: true,
            builder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : [];

    const floorPlanLookup = new Map(
      floorPlanRows.map((row) => [
        row.id.toString(),
        {
          designName: row.name,
          builderId: row.builder?.id.toString(),
          builderName: row.builder?.name ?? undefined,
        },
      ]),
    );

    const viewsByDesign = Array.from(designViewCounts.values())
      .map((row) => {
        const lookup = floorPlanLookup.get(row.designId);
        const designName = row.designName || lookup?.designName;
        const builderId = row.builderId || lookup?.builderId;
        const builderName = builderId
          ? enquiryBuilderCounts.get(builderId)?.builderName ?? lookup?.builderName
          : undefined;
        return {
          designId: row.designId,
          designName,
          builderId,
          builderName,
          views: row.views,
        };
      })
      .sort((a, b) => b.views - a.views || a.designId.localeCompare(b.designId))
      .slice(0, 50);

    const builderViewCounts = new Map<string, { builderName?: string; views: number }>();
    for (const row of viewsByDesign) {
      if (!row.builderId) {
        continue;
      }
      const existing = builderViewCounts.get(row.builderId);
      if (existing) {
        existing.views += row.views;
        if (!existing.builderName && row.builderName) {
          existing.builderName = row.builderName;
        }
      } else {
        builderViewCounts.set(row.builderId, {
          builderName: row.builderName,
          views: row.views,
        });
      }
    }
    const viewsByBuilder = Array.from(builderViewCounts.entries())
      .map(([builderId, value]) => ({
        builderId,
        builderName: value.builderName,
        views: value.views,
      }))
      .sort((a, b) => b.views - a.views || a.builderId.localeCompare(b.builderId))
      .slice(0, 50);

    const matchesByDesign = Array.from(matchCountsByDesign.entries())
      .map(([designId, matches]) => {
        const lookup = floorPlanLookup.get(designId);
        const builderId = lookup?.builderId;
        return {
          designId,
          designName: lookup?.designName,
          builderId,
          builderName: builderId
            ? enquiryBuilderCounts.get(builderId)?.builderName ?? lookup?.builderName
            : undefined,
          matches,
        };
      })
      .sort((a, b) => b.matches - a.matches || a.designId.localeCompare(b.designId))
      .slice(0, 50);

    const viewsByLot = Array.from(lotViewCounts.entries())
      .map(([lotId, views]) => ({
        lotId,
        lotLabel: lotLabelById.get(lotId),
        views,
      }))
      .sort((a, b) => b.views - a.views || a.lotId.localeCompare(b.lotId))
      .slice(0, 50);

    const payload: EstatePerformanceSummary = {
      estateId,
      range: {
        from: fromDateOnly,
        to: toDateOnly,
      },
      source: {
        provider: 'mixpanel',
        configured: true,
        available: true,
      },
      stats: {
        ...baseStats,
        viewsTotal,
        viewsLast7Days,
        viewsLast30Days,
        uniqueLotsViewed: lotViewCounts.size,
        uniqueDesignsViewed: viewsByDesign.length,
        uniqueBuildersViewed: viewsByBuilder.length,
      },
      viewsByLot,
      viewsByDesign,
      viewsByBuilder,
      matchesByDesign,
      enquiriesByLot,
      enquiriesByBuilder,
    };

    this.writePerformanceCache(cacheKey, payload);
    return payload;
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'id' })
  async findOne(@Param('id') id: string) {
    return this.prisma.estate.findUnique({
      where: { id: parseBigIntId(id, 'id') },
      include: ESTATE_INCLUDE,
    });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() body: EstateCreateBody) {
    const { brandGuid: rawBrandGuid, ...estateBody } = body;
    const brandGuid = this.normalizeBrandGuid(rawBrandGuid);
    const normalizedIsPrototype = normalizeBooleanFlag(
      (estateBody as { isPrototype?: unknown }).isPrototype,
      'isPrototype',
    );
    const createDataBase =
      normalizedIsPrototype === undefined
        ? (estateBody as Prisma.estateCreateInput)
        : ({ ...estateBody, isPrototype: normalizedIsPrototype } as Prisma.estateCreateInput);

    return this.prisma.$transaction(async (tx) => {
      await this.ensureBrandGuidExists(tx, brandGuid);

      if (normalizedIsPrototype === true) {
        await tx.estate.updateMany({
          where: { isPrototype: true },
          data: { isPrototype: false },
        });
      }

      const createData: Prisma.estateCreateInput =
        brandGuid === undefined || brandGuid === null
          ? createDataBase
          : {
              ...createDataBase,
              brandSetting: {
                connect: { guid: brandGuid },
              },
            };

      const created = await tx.estate.create({ data: createData });

      return tx.estate.findUniqueOrThrow({
        where: { id: created.id },
        include: ESTATE_INCLUDE,
      });
    });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() body: EstateUpdateBody,
  ) {
    const estateId = parseBigIntId(id, 'id');
    const { brandGuid: rawBrandGuid, ...estateBody } = body;
    const brandGuid = this.normalizeBrandGuid(rawBrandGuid);
    const normalizedIsPrototype = normalizeBooleanFlag(
      (estateBody as { isPrototype?: unknown }).isPrototype,
      'isPrototype',
    );
    const updateDataBase =
      normalizedIsPrototype === undefined
        ? (estateBody as Prisma.estateUpdateInput)
        : ({ ...estateBody, isPrototype: normalizedIsPrototype } as Prisma.estateUpdateInput);

    return this.prisma.$transaction(async (tx) => {
      await this.ensureBrandGuidExists(tx, brandGuid);

      if (normalizedIsPrototype === true) {
        await tx.estate.updateMany({
          where: {
            isPrototype: true,
            id: { not: estateId },
          },
          data: { isPrototype: false },
        });
      }

      const updateData: Prisma.estateUpdateInput =
        brandGuid === undefined
          ? updateDataBase
          : {
              ...updateDataBase,
              brandSetting:
                brandGuid === null
                  ? { disconnect: true }
                  : { connect: { guid: brandGuid } },
            };

      await tx.estate.update({
        where: { id: estateId },
        data: updateData,
      });

      return tx.estate.findUniqueOrThrow({
        where: { id: estateId },
        include: ESTATE_INCLUDE,
      });
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.prisma.estate.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
  }

  @Delete(':id/lots')
  @Roles('ADMIN')
  async removeLots(@Param('id') id: string) {
    const estateId = parseBigIntId(id, 'id');
    const result = await this.prisma.lot.deleteMany({
      where: { estateId },
    });
    return {
      estateId: estateId.toString(),
      deleted: result.count,
    };
  }

  @Get(':id/users')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'id' })
  async listUsers(@Param('id') id: string) {
    const estateId = parseBigIntId(id, 'id');
    const estate = await this.prisma.estate.findUnique({ where: { id: estateId } });
    if (!estate) {
      throw new BadRequestException('Estate not found');
    }

    const estateUsers = await this.prisma.userEstate.findMany({
      where: { estateId },
      include: { user: true },
      orderBy: { userId: 'asc' },
    });

    return estateUsers.map((item) => ({
      estateId: item.estateId.toString(),
      userId: item.userId.toString(),
      user: item.user,
    }));
  }

  @Post(':id/lots/import-dxf')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'id' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async importLotsFromDxf(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
  ) {
    if (!file) {
      throw new BadRequestException('Missing DXF file');
    }

    const buffer =
      file.buffer ??
      (file.path ? readFileSync(file.path) : Buffer.alloc(0));
    if (!buffer.length) {
      throw new BadRequestException('Unable to read DXF file');
    }

    const estateId = parseBigIntId(id, 'id');
    const options = this.lotImportService.parseOptions(body);
    const importResult = await this.lotImportService.importDxfLots(
      estateId,
      buffer.toString('utf8'),
      options,
    );
    const recompute = await this.designOnLotService.recomputeForEstate(estateId);
    return {
      ...importResult,
      recompute,
    };
  }

  @Post(':id/recompute-design-on-lot')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'id' })
  async recomputeDesignOnLotForEstate(@Param('id') id: string) {
    const estateId = parseBigIntId(id, 'id');
    return this.designOnLotService.recomputeForEstate(estateId);
  }
}
