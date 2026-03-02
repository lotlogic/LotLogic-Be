import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { BuilderScopeGuard } from '@/modules/auth/guards/builder-scope.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { BuilderScope } from '@/modules/auth/decorators/builder-scope.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { parseBigIntId } from '@/modules/admin/admin.utils';

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

@UseGuards(EasyAuthGuard, RolesGuard, BuilderScopeGuard)
@Controller('admin/builders')
export class AdminBuilderController {
  constructor(private prisma: PrismaService) {}

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
    const skip = (page - 1) * pageSize;

    const baseWhere: Prisma.enquiryBuilderWhereInput = { builderId };
    const filteredWhere: Prisma.enquiryBuilderWhereInput =
      hotLeadFilter === null
        ? baseWhere
        : {
            ...baseWhere,
            enquiry: { hotLead: hotLeadFilter },
          };

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      builder,
      filteredTotal,
      totalSubmitted,
      hotLeadSubmitted,
      submittedLast7Days,
      submittedLast30Days,
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
              facade: {
                select: {
                  id: true,
                  label: true,
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
      },
      items: rows.map((row) => ({
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
              lotId: row.enquiry.lotId,
              floorPlanId: row.enquiry.floorPlanId,
              facadeId: row.enquiry.facadeId,
              createdAt: row.enquiry.createdAt,
              lot: row.enquiry.lot,
              floorPlan: row.enquiry.floorPlan,
              facade: row.enquiry.facade,
            }
          : null,
      })),
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
