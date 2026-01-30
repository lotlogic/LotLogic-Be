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

@UseGuards(EasyAuthGuard, RolesGuard, EstateScopeGuard)
@Controller('admin/estates')
export class AdminEstateController {
  constructor(
    private prisma: PrismaService,
    private lotImportService: AdminLotImportService,
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
    return this.prisma.estate.create({ data });
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.estateUpdateInput,
  ) {
    return this.prisma.estate.update({
      where: { id: parseBigIntId(id, 'id') },
      data,
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.prisma.estate.delete({
      where: { id: parseBigIntId(id, 'id') },
    });
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
    return this.lotImportService.importDxfLots(
      estateId,
      buffer.toString('utf8'),
      options,
    );
  }
}
