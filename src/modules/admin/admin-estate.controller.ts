import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
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

@UseGuards(EasyAuthGuard, RolesGuard, EstateScopeGuard)
@Controller('admin/estates')
export class AdminEstateController {
  constructor(
    private prisma: PrismaService,
    private lotImportService: AdminLotImportService,
    private designOnLotService: DesignOnLotService,
  ) {}

  @Get()
  @Roles('ADMIN', 'USER')
  async findAll(@Req() req: AuthenticatedRequest) {
    if (req.auth?.role === 'ADMIN') {
      return this.prisma.estate.findMany({ orderBy: { id: 'asc' } });
    }

    const estateIds = await this.prisma.userEstate.findMany({
      where: { userId: req.auth?.id },
      select: { estateId: true },
    });

    return this.prisma.estate.findMany({
      where: { id: { in: estateIds.map((item) => item.estateId) } },
      orderBy: { id: 'asc' },
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'USER')
  @EstateScope({ estateIdParam: 'id' })
  async findOne(@Param('id') id: string) {
    return this.prisma.estate.findUnique({ where: { id: parseBigIntId(id, 'id') } });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() data: Prisma.estateCreateInput) {
    const normalizedIsPrototype = normalizeBooleanFlag(
      (data as { isPrototype?: unknown }).isPrototype,
      'isPrototype',
    );
    const createData =
      normalizedIsPrototype === undefined
        ? data
        : { ...data, isPrototype: normalizedIsPrototype };

    if (normalizedIsPrototype === true) {
      return this.prisma.$transaction(async (tx) => {
        await tx.estate.updateMany({
          where: { isPrototype: true },
          data: { isPrototype: false },
        });
        return tx.estate.create({ data: createData });
      });
    }

    return this.prisma.estate.create({ data: createData });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.estateUpdateInput,
  ) {
    const estateId = parseBigIntId(id, 'id');
    const normalizedIsPrototype = normalizeBooleanFlag(
      (data as { isPrototype?: unknown }).isPrototype,
      'isPrototype',
    );
    const updateData =
      normalizedIsPrototype === undefined
        ? data
        : { ...data, isPrototype: normalizedIsPrototype };

    if (normalizedIsPrototype === true) {
      return this.prisma.$transaction(async (tx) => {
        await tx.estate.updateMany({
          where: {
            isPrototype: true,
            id: { not: estateId },
          },
          data: { isPrototype: false },
        });
        return tx.estate.update({
          where: { id: estateId },
          data: updateData,
        });
      });
    }

    return this.prisma.estate.update({
      where: { id: estateId },
      data: updateData,
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
