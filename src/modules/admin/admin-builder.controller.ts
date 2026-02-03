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
  @Roles('ADMIN')
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
  @Roles('ADMIN')
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
  @Roles('ADMIN')
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
  @Roles('ADMIN')
  async removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    const builderId = parseBigIntId(id, 'id');
    const parsedUserId = parseBigIntId(userId, 'userId');

    const result = await this.prisma.builderUser.deleteMany({
      where: { builderId, userId: parsedUserId },
    });

    return { deleted: result.count };
  }
}
