import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';

interface BuilderUserAssignmentBody {
  userIds?: string[];
}

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/builders')
export class AdminBuilderController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.prisma.builder.findMany({
      orderBy: { id: 'asc' },
      include: {
        builderUsers: {
          include: { user: true },
        },
      },
    });
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    return this.prisma.builder.findUnique({
      where: { id: parseBigIntId(id, 'id') },
      include: {
        builderUsers: {
          include: { user: true },
        },
      },
    });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: Prisma.builderCreateInput) {
    return this.prisma.builder.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.builderUpdateInput,
  ) {
    return this.prisma.builder.update({
      where: { id: parseBigIntId(id, 'id') },
      data,
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
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
