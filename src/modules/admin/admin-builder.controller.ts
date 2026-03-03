import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DesignOnLotStatus, EnquiryStatus, Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { BuilderScopeGuard } from '@/modules/auth/guards/builder-scope.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { BuilderScope } from '@/modules/auth/decorators/builder-scope.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { parseBigIntId } from '@/modules/admin/admin.utils';
import { Response } from 'express';

interface BuilderUserAssignmentBody {
  userIds?: string[];
}

const parsePositiveIntQuery = (
  rawValue: string | undefined,
  fieldName: string,
  options: { defaultValue: number; maxValue: number },
): number => {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return options.defaultValue;
  }

  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException(`Invalid ${fieldName}. Expected a positive integer.`);
  }

  if (parsed > options.maxValue) {
    throw new BadRequestException(
      `Invalid ${fieldName}. Maximum supported value is ${options.maxValue}.`,
    );
  }

  return parsed;
};

const parseOptionalBooleanQuery = (
  rawValue: string | undefined,
  fieldName: string,
): boolean | null => {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return null;
  }

  const normalized = String(rawValue).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }

  throw new BadRequestException(`Invalid ${fieldName}. Expected true or false.`);
};

const ENQUIRY_STATUSES = new Set<EnquiryStatus>([
  EnquiryStatus.PENDING,
  EnquiryStatus.PROCESSED,
]);

const parseOptionalEnquiryStatusQuery = (
  rawValue: string | undefined,
  fieldName: string,
): EnquiryStatus | null => {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return null;
  }

  const normalized = String(rawValue).trim().toUpperCase() as EnquiryStatus;
  if (!ENQUIRY_STATUSES.has(normalized)) {
    throw new BadRequestException(
      `Invalid ${fieldName}. Expected one of: ${Array.from(ENQUIRY_STATUSES).join(', ')}`,
    );
  }
  return normalized;
};

const parseRequiredEnquiryStatus = (
  rawValue: unknown,
  fieldName: string,
): EnquiryStatus => {
  const parsed = parseOptionalEnquiryStatusQuery(
    rawValue === undefined ? undefined : String(rawValue),
    fieldName,
  );
  if (!parsed) {
    throw new BadRequestException(
      `Missing ${fieldName}. Expected one of: ${Array.from(ENQUIRY_STATUSES).join(', ')}`,
    );
  }
  return parsed;
};

const toCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
};

const MIXPANEL_EXPORT_URL = 'https://data.mixpanel.com/api/2.0/export';
const MIXPANEL_PROJECT_ID = '3834941';
const MIXPANEL_PERFORMANCE_EVENTS = ['House Design Viewed', 'House Design Opened'];
const PERFORMANCE_CACHE_TTL_MS = 5 * 60 * 1000;

type MixpanelEventRecord = {
  event?: string;
  properties?: Record<string, unknown>;
};

type BuilderPerformanceSummary = {
  builderId: string;
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
  };
  viewsByLot: Array<{
    lotId: string;
    lotLabel?: string;
    lotDbId?: string;
    views: number;
  }>;
  viewsByDesign: Array<{
    designId: string;
    designName?: string;
    designLabel?: string;
    houseDesignLabel?: string;
    views: number;
  }>;
};

@UseGuards(EasyAuthGuard, RolesGuard, BuilderScopeGuard)
@Controller('admin/builders')
export class AdminBuilderController {
  private readonly logger = new Logger(AdminBuilderController.name);
  private static readonly performanceCache = new Map<
    string,
    { expiresAt: number; payload: BuilderPerformanceSummary }
  >();

  constructor(private prisma: PrismaService) {}

  private normalizeText(value: unknown): string {
    return String(value ?? '').trim();
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

  private buildLotLabel(lot: {
    id: bigint;
    blockKey: string;
    blockNumber: number | null;
    address: string | null;
  }): string {
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

  private eventMatchesBuilder(event: MixpanelEventRecord, builderId: string): boolean {
    const properties = event.properties ?? {};
    const direct = this.normalizeText(properties.builderId);
    if (direct === builderId) {
      return true;
    }

    const ids = properties.builderIds;
    if (Array.isArray(ids)) {
      const normalizedIds = ids.map((value) => this.normalizeText(value)).filter(Boolean);
      if (normalizedIds.includes(builderId)) {
        return true;
      }
    }

    return false;
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

  private buildEmptyPerformanceSummary(
    builderId: string,
    fromDate: string,
    toDate: string,
    configured: boolean,
    available: boolean,
    message?: string,
  ): BuilderPerformanceSummary {
    return {
      builderId,
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
        viewsTotal: 0,
        viewsLast7Days: 0,
        viewsLast30Days: 0,
        uniqueLotsViewed: 0,
        uniqueDesignsViewed: 0,
      },
      viewsByLot: [],
      viewsByDesign: [],
    };
  }

  private buildPerformanceCacheKey(builderId: string, fromDate: string, toDate: string): string {
    return `${builderId}|${fromDate}|${toDate}`;
  }

  private readPerformanceCache(
    cacheKey: string,
  ): BuilderPerformanceSummary | null {
    const entry = AdminBuilderController.performanceCache.get(cacheKey);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      AdminBuilderController.performanceCache.delete(cacheKey);
      return null;
    }
    return entry.payload;
  }

  private writePerformanceCache(cacheKey: string, payload: BuilderPerformanceSummary) {
    AdminBuilderController.performanceCache.set(cacheKey, {
      expiresAt: Date.now() + PERFORMANCE_CACHE_TTL_MS,
      payload,
    });
  }

  private buildLeadWhere(
    builderId: bigint,
    hotLeadFilter: boolean | null,
    statusFilter: EnquiryStatus | null,
  ): Prisma.enquiryBuilderWhereInput {
    const enquiryFilter: Prisma.enquiryWhereInput = {};
    if (hotLeadFilter !== null) {
      enquiryFilter.hotLead = hotLeadFilter;
    }
    if (statusFilter !== null) {
      enquiryFilter.status = statusFilter;
    }

    if (Object.keys(enquiryFilter).length === 0) {
      return { builderId };
    }

    return {
      builderId,
      enquiry: enquiryFilter,
    };
  }

  private mapLeadRow(row: {
    id: bigint;
    builderId: bigint;
    createdAt: Date;
    enquiry: {
      id: bigint;
      name: string;
      email: string;
      phone: string;
      comments: string | null;
      hotLead: boolean;
      status: EnquiryStatus;
      estateId: bigint | null;
      lotId: bigint | null;
      floorPlanId: bigint | null;
      facadeId: bigint | null;
      createdAt: Date;
      lot: {
        id: bigint;
        blockKey: string;
        blockNumber: number | null;
        address: string | null;
        lifecycleStage: string | null;
        estateId: bigint | null;
      } | null;
      floorPlan: {
        id: bigint;
        name: string;
        builderId: bigint;
      } | null;
    } | null;
  }) {
    return {
      id: row.id,
      builderId: row.builderId,
      createdAt: row.createdAt,
      enquiry: row.enquiry
        ? {
            id: row.enquiry.id,
            name: row.enquiry.name,
            email: row.enquiry.email,
            phone: row.enquiry.phone,
            comments: row.enquiry.comments,
            hotLead: row.enquiry.hotLead,
            status: row.enquiry.status,
            estateId: row.enquiry.estateId,
            lotId: row.enquiry.lotId,
            floorPlanId: row.enquiry.floorPlanId,
            facadeId: row.enquiry.facadeId,
            createdAt: row.enquiry.createdAt,
            lot: row.enquiry.lot,
            floorPlan: row.enquiry.floorPlan,
          }
        : null,
    };
  }

  @Get()
  @Roles('ADMIN', 'USER')
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('builderId') builderId?: string,
  ) {
    const builderIdFilter = builderId ? parseBigIntId(builderId, 'builderId') : null;

    if (req.auth?.role === 'ADMIN') {
      const where: Prisma.builderWhereInput = builderIdFilter
        ? { id: builderIdFilter }
        : {};
      return this.prisma.builder.findMany({
        where,
        orderBy: { id: 'asc' },
        include: {
          builderUsers: {
            include: { user: true },
          },
        },
      });
    }

    const builderIds = await this.prisma.builderUser.findMany({
      where: { userId: req.auth?.id },
      select: { builderId: true },
    });

    const allowedBuilderIds = builderIds.map((item) => item.builderId);
    const builderIdsForQuery = builderIdFilter
      ? allowedBuilderIds.filter((id) => id === builderIdFilter)
      : allowedBuilderIds;

    if (builderIdsForQuery.length === 0) {
      return [];
    }

    return this.prisma.builder.findMany({
      where: { id: { in: builderIdsForQuery } },
      orderBy: { id: 'asc' },
    });
  }

  @Get(':id/leads')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async listLeads(
    @Param('id') id: string,
    @Query('page') pageQuery?: string,
    @Query('pageSize') pageSizeQuery?: string,
    @Query('hotLead') hotLeadQuery?: string,
    @Query('status') statusQuery?: string,
  ) {
    const builderId = parseBigIntId(id, 'id');
    const page = parsePositiveIntQuery(pageQuery, 'page', {
      defaultValue: 1,
      maxValue: 100_000,
    });
    const pageSize = parsePositiveIntQuery(pageSizeQuery, 'pageSize', {
      defaultValue: 25,
      maxValue: 200,
    });
    const hotLeadFilter = parseOptionalBooleanQuery(hotLeadQuery, 'hotLead');
    const statusFilter = parseOptionalEnquiryStatusQuery(statusQuery, 'status');
    const skip = (page - 1) * pageSize;

    const baseWhere: Prisma.enquiryBuilderWhereInput = { builderId };
    const filteredWhere = this.buildLeadWhere(builderId, hotLeadFilter, statusFilter);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      builder,
      filteredTotal,
      totalSubmitted,
      hotLeadSubmitted,
      submittedLast7Days,
      submittedLast30Days,
      pendingSubmitted,
      processedSubmitted,
      rows,
    ] = await this.prisma.$transaction([
      this.prisma.builder.findUnique({
        where: { id: builderId },
        select: { id: true, name: true, email: true, phone: true },
      }),
      this.prisma.enquiryBuilder.count({ where: filteredWhere }),
      this.prisma.enquiryBuilder.count({ where: baseWhere }),
      this.prisma.enquiryBuilder.count({
        where: {
          ...baseWhere,
          enquiry: { hotLead: true },
        },
      }),
      this.prisma.enquiryBuilder.count({
        where: {
          ...baseWhere,
          enquiry: { createdAt: { gte: sevenDaysAgo } },
        },
      }),
      this.prisma.enquiryBuilder.count({
        where: {
          ...baseWhere,
          enquiry: { createdAt: { gte: thirtyDaysAgo } },
        },
      }),
      this.prisma.enquiryBuilder.count({
        where: {
          ...baseWhere,
          enquiry: { status: EnquiryStatus.PENDING },
        },
      }),
      this.prisma.enquiryBuilder.count({
        where: {
          ...baseWhere,
          enquiry: { status: EnquiryStatus.PROCESSED },
        },
      }),
      this.prisma.enquiryBuilder.findMany({
        where: filteredWhere,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: pageSize,
        include: {
          enquiry: {
            include: {
              lot: {
                select: {
                  id: true,
                  blockKey: true,
                  blockNumber: true,
                  address: true,
                  lifecycleStage: true,
                  estateId: true,
                },
              },
              floorPlan: {
                select: {
                  id: true,
                  name: true,
                  builderId: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (!builder) {
      throw new BadRequestException('Builder not found');
    }

    return {
      builder,
      filters: {
        hotLead: hotLeadFilter,
        status: statusFilter,
      },
      pagination: {
        page,
        pageSize,
        total: filteredTotal,
        totalPages: filteredTotal > 0 ? Math.ceil(filteredTotal / pageSize) : 0,
      },
      stats: {
        totalSubmitted,
        hotLeadSubmitted,
        submittedLast7Days,
        submittedLast30Days,
        pendingSubmitted,
        processedSubmitted,
      },
      items: rows.map((row) => this.mapLeadRow(row)),
    };
  }

  @Get(':id/performance')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async getBuilderPerformance(
    @Param('id') id: string,
    @Query('from') fromDateQuery?: string,
    @Query('to') toDateQuery?: string,
    @Query('forceRefresh') forceRefreshQuery?: string,
  ): Promise<BuilderPerformanceSummary> {
    const builderIdValue = parseBigIntId(id, 'id');
    const builderId = builderIdValue.toString();

    const builder = await this.prisma.builder.findUnique({
      where: { id: builderIdValue },
      select: { id: true },
    });
    if (!builder) {
      throw new BadRequestException('Builder not found');
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
    const cacheKey = this.buildPerformanceCacheKey(builderId, fromDateOnly, toDateOnly);
    if (!forceRefresh) {
      const cached = this.readPerformanceCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const configured = Boolean(this.getMixpanelAuthorizationHeader());
    if (!configured) {
      return this.buildEmptyPerformanceSummary(
        builderId,
        fromDateOnly,
        toDateOnly,
        false,
        false,
        'Mixpanel credentials are not configured in backend environment variables.',
      );
    }

    let events: MixpanelEventRecord[] = [];
    try {
      events = await this.fetchMixpanelEvents(fromDateOnly, toDateOnly);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Unable to fetch Mixpanel performance data: ${reason}`);
      return this.buildEmptyPerformanceSummary(
        builderId,
        fromDateOnly,
        toDateOnly,
        true,
        false,
        reason,
      );
    }

    const nowMs = Date.now();
    const cutoff7Days = nowMs - 7 * 24 * 60 * 60 * 1000;
    const cutoff30Days = nowMs - 30 * 24 * 60 * 60 * 1000;
    const lotCounts = new Map<string, number>();
    const designCounts = new Map<string, { designId: string; designName?: string; views: number }>();

    let viewsTotal = 0;
    let viewsLast7Days = 0;
    let viewsLast30Days = 0;

    for (const event of events) {
      const eventName = this.normalizeText(event.event);
      if (!MIXPANEL_PERFORMANCE_EVENTS.includes(eventName)) {
        continue;
      }

      if (!this.eventMatchesBuilder(event, builderId)) {
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

      const properties = event.properties ?? {};
      const lotId = this.normalizeText(properties.lotId);
      if (lotId) {
        lotCounts.set(lotId, (lotCounts.get(lotId) || 0) + 1);
      }

      const designId = this.normalizeText(properties.designId);
      const designName = this.normalizeText(properties.designName) || undefined;
      const designKey = designId || (designName ? `name:${designName.toLowerCase()}` : '');
      if (designKey) {
        const existing = designCounts.get(designKey);
        if (existing) {
          existing.views += 1;
          if (!existing.designName && designName) {
            existing.designName = designName;
          }
        } else {
          designCounts.set(designKey, {
            designId: designId || designName || 'unknown',
            designName,
            views: 1,
          });
        }
      }
    }

    const viewsByLot = Array.from(lotCounts.entries())
      .map(([lotId, views]) => ({ lotId, views }))
      .sort((a, b) => b.views - a.views || a.lotId.localeCompare(b.lotId));

    const lotIdsForLookup = Array.from(
      new Set(viewsByLot.map((row) => row.lotId).filter((value) => /^\d+$/.test(value))),
    ).map((value) => BigInt(value));

    const lots = lotIdsForLookup.length
      ? await this.prisma.lot.findMany({
          where: { id: { in: lotIdsForLookup } },
          select: {
            id: true,
            blockKey: true,
            blockNumber: true,
            address: true,
          },
        })
      : [];

    const lotLabelById = new Map(
      lots.map((lot) => [lot.id.toString(), this.buildLotLabel(lot)]),
    );

    const viewsByLotWithLabels = viewsByLot.map((row) => {
      const mappedLotLabel = lotLabelById.get(row.lotId);
      const fallbackLabel = /^\d+$/.test(row.lotId) ? undefined : row.lotId;
      return {
        lotId: row.lotId,
        lotDbId: /^\d+$/.test(row.lotId) ? row.lotId : undefined,
        lotLabel: mappedLotLabel ?? fallbackLabel,
        views: row.views,
      };
    });

    const viewsByDesign = Array.from(designCounts.values())
      .map((row) => ({
        ...row,
        designLabel: row.designName,
        houseDesignLabel: row.designName,
      }))
      .sort((a, b) => b.views - a.views || a.designId.localeCompare(b.designId));

    const payload: BuilderPerformanceSummary = {
      builderId,
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
        viewsTotal,
        viewsLast7Days,
        viewsLast30Days,
        uniqueLotsViewed: lotCounts.size,
        uniqueDesignsViewed: designCounts.size,
      },
      viewsByLot: viewsByLotWithLabels.slice(0, 50),
      viewsByDesign: viewsByDesign.slice(0, 50),
    };

    this.writePerformanceCache(cacheKey, payload);
    return payload;
  }

  @Get(':id/leads/export')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async exportLeadsCsv(
    @Param('id') id: string,
    @Query('hotLead') hotLeadQuery?: string,
    @Query('status') statusQuery?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const builderId = parseBigIntId(id, 'id');
    const hotLeadFilter = parseOptionalBooleanQuery(hotLeadQuery, 'hotLead');
    const statusFilter = parseOptionalEnquiryStatusQuery(statusQuery, 'status');
    const filteredWhere = this.buildLeadWhere(builderId, hotLeadFilter, statusFilter);

    const rows = await this.prisma.enquiryBuilder.findMany({
      where: filteredWhere,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        enquiry: {
          include: {
            lot: {
              select: {
                id: true,
                blockKey: true,
                blockNumber: true,
                address: true,
                lifecycleStage: true,
                estateId: true,
              },
            },
            floorPlan: {
              select: {
                id: true,
                name: true,
                builderId: true,
              },
            },
          },
        },
      },
    });

    const header = [
      'Submitted',
      'Status',
      'Lead',
      'Email',
      'Phone',
      'Estate ID',
      'Lot',
      'Floor Plan',
      'Hot Lead',
      'Comments',
    ];

    const csvRows = rows.map((row) => {
      const enquiry = row.enquiry;
      const lot = enquiry?.lot;
      const lotLabel =
        typeof lot?.blockNumber === 'number'
          ? `Lot ${lot.blockNumber}`
          : (lot?.blockKey || lot?.address || '').trim();
      const estateId = enquiry?.estateId?.toString() || lot?.estateId?.toString() || '';
      const floorPlanLabel = (enquiry?.floorPlan?.name || enquiry?.floorPlan?.id?.toString() || '').trim();
      return [
        toCsvCell(enquiry?.createdAt ? enquiry.createdAt.toISOString() : ''),
        toCsvCell(enquiry?.status || ''),
        toCsvCell(enquiry?.name || ''),
        toCsvCell(enquiry?.email || ''),
        toCsvCell(enquiry?.phone || ''),
        toCsvCell(estateId),
        toCsvCell(lotLabel),
        toCsvCell(floorPlanLabel),
        toCsvCell(enquiry?.hotLead ? 'Yes' : 'No'),
        toCsvCell(enquiry?.comments || ''),
      ].join(',');
    });

    const csvContent = [header.map((value) => toCsvCell(value)).join(','), ...csvRows].join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (res) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=\"builder-${id}-leads-${timestamp}.csv\"`,
      );
    }

    return csvContent;
  }

  @Patch(':id/leads/:leadId')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async updateLeadStatus(
    @Param('id') id: string,
    @Param('leadId') leadId: string,
    @Body('status') statusRaw: string,
  ) {
    const builderId = parseBigIntId(id, 'id');
    const leadAssignmentId = parseBigIntId(leadId, 'leadId');
    const status = parseRequiredEnquiryStatus(statusRaw, 'status');

    const leadAssignment = await this.prisma.enquiryBuilder.findFirst({
      where: {
        id: leadAssignmentId,
        builderId,
      },
      select: {
        id: true,
        enquiryId: true,
      },
    });

    if (!leadAssignment) {
      throw new BadRequestException('Lead not found for this builder');
    }

    const updated = await this.prisma.enquiry.update({
      where: { id: leadAssignment.enquiryId },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });

    return {
      leadId: leadAssignment.id,
      enquiryId: updated.id,
      status: updated.status,
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const include =
      req.auth?.role === 'ADMIN'
        ? {
            builderUsers: {
              include: { user: true },
            },
          }
        : undefined;

    return this.prisma.builder.findUnique({
      where: { id: parseBigIntId(id, 'id') },
      ...(include ? { include } : {}),
    });
  }

  @Get(':id/approved-estates')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async listApprovedEstates(@Param('id') id: string) {
    const builderId = parseBigIntId(id, 'id');
    const approvals = await this.prisma.builderEstateApproval.findMany({
      where: { builderId },
      include: {
        estate: {
          select: {
            id: true,
            name: true,
            jurisdiction: true,
            estateRuleSets: {
              orderBy: [{ version: 'desc' }, { id: 'desc' }],
              select: {
                id: true,
                estateId: true,
                name: true,
                version: true,
                status: true,
                effectiveFrom: true,
                effectiveTo: true,
                rules: true,
                notes: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
      orderBy: [{ estateId: 'asc' }],
    });

    const estateIds = Array.from(new Set(approvals.map((item) => item.estateId)));
    const availableLots = estateIds.length
      ? await this.prisma.lot.findMany({
          where: {
            estateId: { in: estateIds },
            lifecycleStage: {
              equals: 'available',
              mode: 'insensitive',
            },
          },
          select: {
            id: true,
            estateId: true,
            blockKey: true,
            blockNumber: true,
            address: true,
          },
          orderBy: [{ estateId: 'asc' }, { blockNumber: 'asc' }, { id: 'asc' }],
        })
      : [];

    const availableLotsByEstateId = new Map<
      string,
      Array<{
        id: bigint;
        estateId: bigint | null;
        blockKey: string;
        blockNumber: number | null;
        address: string | null;
      }>
    >();
    const lotById = new Map<
      string,
      {
        id: bigint;
        estateId: bigint | null;
        blockKey: string;
        blockNumber: number | null;
        address: string | null;
      }
    >();

    for (const lot of availableLots) {
      const lotId = lot.id.toString();
      lotById.set(lotId, lot);

      const estateIdKey = lot.estateId?.toString();
      if (!estateIdKey) {
        continue;
      }
      const existing = availableLotsByEstateId.get(estateIdKey) ?? [];
      existing.push(lot);
      availableLotsByEstateId.set(estateIdKey, existing);
    }

    const availableLotIds = availableLots.map((lot) => lot.id);
    const compatibleDesignOnLots = availableLotIds.length
      ? await this.prisma.designOnLot.findMany({
          where: {
            lotId: { in: availableLotIds },
            status: DesignOnLotStatus.PASS,
            isCompatible: true,
            floorPlan: {
              builderId,
            },
          },
          select: {
            lotId: true,
            floorPlanId: true,
            floorPlan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : [];

    const matchesByEstateId = new Map<
      string,
      {
        matchedLotIds: Set<string>;
        passCombinationCount: number;
        plans: Map<
          string,
          {
            floorPlanId: string;
            floorPlanName: string;
            matchedLotIds: Set<string>;
          }
        >;
      }
    >();

    for (const record of compatibleDesignOnLots) {
      const lotId = record.lotId.toString();
      const lot = lotById.get(lotId);
      const estateIdKey = lot?.estateId?.toString();
      if (!lot || !estateIdKey) {
        continue;
      }

      const estateBucket = matchesByEstateId.get(estateIdKey) ?? {
        matchedLotIds: new Set<string>(),
        passCombinationCount: 0,
        plans: new Map<
          string,
          {
            floorPlanId: string;
            floorPlanName: string;
            matchedLotIds: Set<string>;
          }
        >(),
      };
      estateBucket.passCombinationCount += 1;
      estateBucket.matchedLotIds.add(lotId);

      const floorPlanId = record.floorPlanId.toString();
      const existingPlan = estateBucket.plans.get(floorPlanId) ?? {
        floorPlanId,
        floorPlanName: record.floorPlan?.name || floorPlanId,
        matchedLotIds: new Set<string>(),
      };
      existingPlan.matchedLotIds.add(lotId);
      estateBucket.plans.set(floorPlanId, existingPlan);

      matchesByEstateId.set(estateIdKey, estateBucket);
    }

    const jurisdictions = Array.from(
      new Set(
        approvals
          .map((item) => item.estate?.jurisdiction)
          .filter((value): value is 'ACT' | 'NSW' => value === 'ACT' || value === 'NSW'),
      ),
    );

    const statusRank = (status: string) => {
      if (status === 'PUBLISHED') return 0;
      if (status === 'DRAFT') return 1;
      return 2;
    };

    const sortRuleSets = <T extends { status: string; version: number }>(
      items: T[],
    ): T[] =>
      [...items].sort((left, right) => {
        const rankDelta = statusRank(left.status) - statusRank(right.status);
        if (rankDelta !== 0) {
          return rankDelta;
        }
        return right.version - left.version;
      });

    const stateRuleSets = jurisdictions.length
      ? await this.prisma.stateRuleSet.findMany({
          where: {
            jurisdiction: {
              in: jurisdictions,
            },
          },
          orderBy: [{ version: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            jurisdiction: true,
            name: true,
            version: true,
            status: true,
            effectiveFrom: true,
            effectiveTo: true,
            rules: true,
            sourceUrl: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : [];

    const stateRuleSetsByJurisdiction = new Map<
      'ACT' | 'NSW',
      typeof stateRuleSets
    >();
    for (const ruleSet of stateRuleSets) {
      const jurisdiction = ruleSet.jurisdiction;
      const existing = stateRuleSetsByJurisdiction.get(jurisdiction) ?? [];
      existing.push(ruleSet);
      stateRuleSetsByJurisdiction.set(jurisdiction, existing);
    }

    return approvals.map((approval) => {
      const sortedRuleSets = sortRuleSets(approval.estate?.estateRuleSets || []);
      const jurisdiction = approval.estate?.jurisdiction ?? null;
      const sortedStateRuleSets =
        jurisdiction && (jurisdiction === 'ACT' || jurisdiction === 'NSW')
          ? sortRuleSets(stateRuleSetsByJurisdiction.get(jurisdiction) || [])
          : [];

      const currentStateRuleSet =
        sortedStateRuleSets.find((item) => item.status === 'PUBLISHED') ||
        sortedStateRuleSets[0] ||
        null;

      const currentRuleSet =
        sortedRuleSets.find((item) => item.status === 'PUBLISHED') ||
        sortedRuleSets[0] ||
        null;

      const estateIdKey = approval.estateId.toString();
      const availableLotsForEstate = availableLotsByEstateId.get(estateIdKey) ?? [];
      const estateMatches = matchesByEstateId.get(estateIdKey);
      const includeMatching = approval.status === 'APPROVED';
      const matchingPlans = includeMatching
        ? Array.from(estateMatches?.plans.values() ?? [])
            .map((plan) => ({
              floorPlanId: plan.floorPlanId,
              floorPlanName: plan.floorPlanName,
              matchedLotCount: plan.matchedLotIds.size,
              matchedLots: Array.from(plan.matchedLotIds)
                .map((lotId) => {
                  const lot = lotById.get(lotId);
                  return {
                    lotId,
                    lotLabel: lot
                      ? this.buildLotLabel({
                          id: lot.id,
                          blockKey: lot.blockKey,
                          blockNumber: lot.blockNumber,
                          address: lot.address,
                        })
                      : lotId,
                  };
                })
                .sort((left, right) => left.lotLabel.localeCompare(right.lotLabel)),
            }))
            .sort((left, right) => {
              const countDelta = right.matchedLotCount - left.matchedLotCount;
              if (countDelta !== 0) {
                return countDelta;
              }
              return left.floorPlanName.localeCompare(right.floorPlanName);
            })
        : [];

      return {
        id: approval.id.toString(),
        builderId: approval.builderId.toString(),
        estateId: approval.estateId.toString(),
        status: approval.status,
        effectiveFrom: approval.effectiveFrom,
        effectiveTo: approval.effectiveTo,
        notes: approval.notes,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt,
        estate: approval.estate
          ? {
              id: approval.estate.id.toString(),
              name: approval.estate.name,
              jurisdiction: approval.estate.jurisdiction,
            }
          : null,
        ruleSets: sortedRuleSets.map((ruleSet) => ({
          id: ruleSet.id.toString(),
          estateId: ruleSet.estateId.toString(),
          name: ruleSet.name,
          version: ruleSet.version,
          status: ruleSet.status,
          effectiveFrom: ruleSet.effectiveFrom,
          effectiveTo: ruleSet.effectiveTo,
          rules: ruleSet.rules,
          notes: ruleSet.notes,
          createdAt: ruleSet.createdAt,
          updatedAt: ruleSet.updatedAt,
        })),
        currentRuleSet: currentRuleSet
          ? {
              id: currentRuleSet.id.toString(),
              estateId: currentRuleSet.estateId.toString(),
              name: currentRuleSet.name,
              version: currentRuleSet.version,
              status: currentRuleSet.status,
              effectiveFrom: currentRuleSet.effectiveFrom,
              effectiveTo: currentRuleSet.effectiveTo,
              rules: currentRuleSet.rules,
              notes: currentRuleSet.notes,
              createdAt: currentRuleSet.createdAt,
              updatedAt: currentRuleSet.updatedAt,
            }
          : null,
        stateRuleSets: sortedStateRuleSets.map((ruleSet) => ({
          id: ruleSet.id.toString(),
          jurisdiction: ruleSet.jurisdiction,
          name: ruleSet.name,
          version: ruleSet.version,
          status: ruleSet.status,
          effectiveFrom: ruleSet.effectiveFrom,
          effectiveTo: ruleSet.effectiveTo,
          rules: ruleSet.rules,
          sourceUrl: ruleSet.sourceUrl,
          notes: ruleSet.notes,
          createdAt: ruleSet.createdAt,
          updatedAt: ruleSet.updatedAt,
        })),
        currentStateRuleSet: currentStateRuleSet
          ? {
              id: currentStateRuleSet.id.toString(),
              jurisdiction: currentStateRuleSet.jurisdiction,
              name: currentStateRuleSet.name,
              version: currentStateRuleSet.version,
              status: currentStateRuleSet.status,
              effectiveFrom: currentStateRuleSet.effectiveFrom,
              effectiveTo: currentStateRuleSet.effectiveTo,
              rules: currentStateRuleSet.rules,
              sourceUrl: currentStateRuleSet.sourceUrl,
              notes: currentStateRuleSet.notes,
              createdAt: currentStateRuleSet.createdAt,
              updatedAt: currentStateRuleSet.updatedAt,
            }
          : null,
        matching: {
          availableLotCount: includeMatching ? availableLotsForEstate.length : 0,
          matchedLotCount: includeMatching ? estateMatches?.matchedLotIds.size ?? 0 : 0,
          matchedPlanCount: includeMatching ? matchingPlans.length : 0,
          passCombinationCount: includeMatching ? estateMatches?.passCombinationCount ?? 0 : 0,
          plans: matchingPlans,
        },
      };
    });
  }

  @Post()
  @Roles('ADMIN', 'USER')
  async create(@Req() req: AuthenticatedRequest, @Body() data: Prisma.builderCreateInput) {
    if (req.auth?.role === 'ADMIN') {
      return this.prisma.builder.create({ data });
    }

    const forbiddenKeys = ['builderUsers', 'floorPlans', 'enquiryBuilders'];
    const extras = Object.keys(data || {}).filter((key) => forbiddenKeys.includes(key));
    if (extras.length > 0) {
      throw new BadRequestException(
        'Nested builder assignments are not allowed for user-created builders',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const builder = await tx.builder.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      });

      await tx.builderUser.create({
        data: {
          builderId: builder.id,
          userId: req.auth!.id,
        },
      });

      return builder;
    });
  }

  @Patch(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: Prisma.builderUpdateInput,
  ) {
    if (req.auth?.role !== 'ADMIN') {
      const allowedKeys = new Set(['name', 'email', 'phone']);
      const extras = Object.keys(data || {}).filter((key) => !allowedKeys.has(key));
      if (extras.length > 0) {
        throw new BadRequestException('Only name, email, and phone can be updated');
      }
    }

    return this.prisma.builder.update({
      where: { id: parseBigIntId(id, 'id') },
      data:
        req.auth?.role === 'ADMIN'
          ? data
          : {
              ...(data.name !== undefined ? { name: data.name } : {}),
              ...(data.email !== undefined ? { email: data.email } : {}),
              ...(data.phone !== undefined ? { phone: data.phone } : {}),
            },
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async remove(@Param('id') id: string) {
    return this.prisma.builder.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
  }

  @Get(':id/users')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async listUsers(@Param('id') id: string) {
    const builderId = parseBigIntId(id, 'id');
    const builder = await this.prisma.builder.findUnique({ where: { id: builderId } });
    if (!builder) {
      throw new BadRequestException('Builder not found');
    }

    const builderUsers = await this.prisma.builderUser.findMany({
      where: { builderId },
      include: { user: true },
      orderBy: { userId: 'asc' },
    });

    return builderUsers.map((item) => ({
      builderId: item.builderId.toString(),
      userId: item.userId.toString(),
      user: item.user,
    }));
  }

  @Put(':id/users')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async setUsers(
    @Param('id') id: string,
    @Body() body: BuilderUserAssignmentBody,
  ) {
    const builderId = parseBigIntId(id, 'id');
    const builder = await this.prisma.builder.findUnique({ where: { id: builderId } });
    if (!builder) {
      throw new BadRequestException('Builder not found');
    }

    const userIds = (body.userIds || []).map((userId) =>
      parseBigIntId(userId, 'userId'),
    );

    if (userIds.length > 0) {
      const existing = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });
      if (existing.length !== userIds.length) {
        throw new BadRequestException('One or more userIds do not exist');
      }
    }

    await this.prisma.$transaction([
      this.prisma.builderUser.deleteMany({ where: { builderId } }),
      ...(userIds.length > 0
        ? [
            this.prisma.builderUser.createMany({
              data: userIds.map((userId) => ({ builderId, userId })),
            }),
          ]
        : []),
    ]);

    const builderUsers = await this.prisma.builderUser.findMany({
      where: { builderId },
      include: { user: true },
      orderBy: { userId: 'asc' },
    });

    return builderUsers.map((item) => ({
      builderId: item.builderId.toString(),
      userId: item.userId.toString(),
      user: item.user,
    }));
  }

  @Post(':id/users')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async addUsers(
    @Param('id') id: string,
    @Body() body: BuilderUserAssignmentBody,
  ) {
    const builderId = parseBigIntId(id, 'id');
    const builder = await this.prisma.builder.findUnique({ where: { id: builderId } });
    if (!builder) {
      throw new BadRequestException('Builder not found');
    }

    const userIds = (body.userIds || []).map((userId) =>
      parseBigIntId(userId, 'userId'),
    );
    if (userIds.length === 0) {
      return { added: 0 };
    }

    const existing = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });
    if (existing.length !== userIds.length) {
      throw new BadRequestException('One or more userIds do not exist');
    }

    const result = await this.prisma.builderUser.createMany({
      data: userIds.map((userId) => ({ builderId, userId })),
      skipDuplicates: true,
    });

    return { added: result.count };
  }

  @Delete(':id/users/:userId')
  @Roles('ADMIN', 'USER')
  @BuilderScope({ builderIdParam: 'id' })
  async removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    const builderId = parseBigIntId(id, 'id');
    const parsedUserId = parseBigIntId(userId, 'userId');

    const result = await this.prisma.builderUser.deleteMany({
      where: { builderId, userId: parsedUserId },
    });

    return { deleted: result.count };
  }
}
