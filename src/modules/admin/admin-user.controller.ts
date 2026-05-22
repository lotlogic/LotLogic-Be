import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, UserStatus } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';
import {
  AdminEntraGraphService,
  GraphNotFoundError,
} from '@/modules/admin/admin-entra-graph.service';

interface EstateAssignmentBody {
  estateIds?: string[];
}

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUserController {
  constructor(
    private prisma: PrismaService,
    private readonly graph: AdminEntraGraphService,
  ) {}

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.prisma.user.findMany({
      include: { estates: true },
      orderBy: { id: 'asc' },
    });
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id: parseBigIntId(id, 'id') },
      include: { estates: true },
    });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: Prisma.userCreateInput) {
    return this.prisma.user.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.userUpdateInput,
  ) {
    return this.prisma.user.update({
      where: { id: parseBigIntId(id, 'id') },
      data,
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const userId = parseBigIntId(id, 'id');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let entra: {
      attempted: boolean;
      deleted: boolean;
      skipped: boolean;
      notFound: boolean;
    } = {
      attempted: false,
      deleted: false,
      skipped: false,
      notFound: false,
    };

    if (this.graph.isConfigured()) {
      entra.attempted = true;
      try {
        await this.graph.deleteUser(user.externalAuthId);
        entra.deleted = true;
      } catch (error) {
        if (error instanceof GraphNotFoundError) {
          // Entra user is already gone; continue with local cleanup.
          entra.notFound = true;
        } else {
          throw error;
        }
      }
    } else {
      entra.skipped = true;
    }

    await this.prisma.user.delete({ where: { id: userId } });

    return {
      id: userId.toString(),
      externalAuthId: user.externalAuthId,
      localDeleted: true,
      entra,
    };
  }

  @Post(':id/disable')
  @Roles('ADMIN')
  async disable(@Param('id') id: string) {
    const userId = parseBigIntId(id, 'id');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let entra: { attempted: boolean; disabled: boolean; skipped: boolean } = {
      attempted: false,
      disabled: false,
      skipped: false,
    };

    if (this.graph.isConfigured()) {
      entra.attempted = true;
      await this.graph.setUserAccountEnabled(user.externalAuthId, false);
      entra.disabled = true;
    } else {
      entra.skipped = true;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.DISABLED },
    });

    return {
      id: updated.id.toString(),
      externalAuthId: updated.externalAuthId,
      status: updated.status,
      entra,
    };
  }

  @Post(':id/enable')
  @Roles('ADMIN')
  async enable(@Param('id') id: string) {
    const userId = parseBigIntId(id, 'id');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let entra: { attempted: boolean; enabled: boolean; skipped: boolean } = {
      attempted: false,
      enabled: false,
      skipped: false,
    };

    if (this.graph.isConfigured()) {
      entra.attempted = true;
      await this.graph.setUserAccountEnabled(user.externalAuthId, true);
      entra.enabled = true;
    } else {
      entra.skipped = true;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    return {
      id: updated.id.toString(),
      externalAuthId: updated.externalAuthId,
      status: updated.status,
      entra,
    };
  }

  @Put(':id/estates')
  @Roles('ADMIN')
  async setEstates(@Param('id') id: string, @Body() body: EstateAssignmentBody) {
    const userId = parseBigIntId(id, 'id');
    const estateIds = (body.estateIds || []).map((estateId) =>
      parseBigIntId(estateId, 'estateId'),
    );

    await this.prisma.$transaction([
      this.prisma.userEstate.deleteMany({ where: { userId } }),
      this.prisma.userEstate.createMany({
        data: estateIds.map((estateId) => ({ userId, estateId })),
      }),
    ]);

    return this.prisma.userEstate.findMany({
      where: { userId },
      orderBy: { estateId: 'asc' },
    });
  }
}
