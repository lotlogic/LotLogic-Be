import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { parseBigIntId } from '@/modules/admin/admin.utils';

interface BrandSettingBody {
  name?: string;
  title?: string;
  logoUrl?: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  bgPrimaryColor?: string | null;
  bgSecondaryColor?: string | null;
  textPrimaryColor?: string | null;
  textSecondaryColor?: string | null;
  fontFamilyPrimary?: string | null;
  fontFamilySecondary?: string | null;
  estateId?: string | null;
}

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/brand-settings')
export class AdminBrandSettingController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN')
  async findAll(@Query('estateId') estateId?: string) {
    const where: Prisma.brandSettingWhereInput = {};
    if (estateId) {
      where.estateId = parseBigIntId(estateId, 'estateId');
    }
    return this.prisma.brandSetting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { estate: { select: { id: true, name: true } } },
    });
  }

  @Get(':guid')
  @Roles('ADMIN')
  async findOne(@Param('guid') guid: string) {
    return this.prisma.brandSetting.findUnique({
      where: { guid },
      include: { estate: { select: { id: true, name: true } } },
    });
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() body: BrandSettingBody) {
    if (!body.name || !body.title || !body.logoUrl) {
      throw new BadRequestException('name, title, and logoUrl are required');
    }

    const data: Prisma.brandSettingCreateInput = {
      name: body.name,
      title: body.title,
      logoUrl: body.logoUrl,
      primaryColor: body.primaryColor ?? null,
      secondaryColor: body.secondaryColor ?? null,
      bgPrimaryColor: body.bgPrimaryColor ?? null,
      bgSecondaryColor: body.bgSecondaryColor ?? null,
      textPrimaryColor: body.textPrimaryColor ?? null,
      textSecondaryColor: body.textSecondaryColor ?? null,
      fontFamilyPrimary: body.fontFamilyPrimary ?? null,
      fontFamilySecondary: body.fontFamilySecondary ?? null,
    };

    if (body.estateId) {
      const estateId = parseBigIntId(body.estateId, 'estateId');
      const estate = await this.prisma.estate.findUnique({
        where: { id: estateId },
        select: { id: true },
      });
      if (!estate) {
        throw new BadRequestException('estateId does not exist');
      }
      const existing = await this.prisma.brandSetting.findUnique({
        where: { estateId },
        select: { guid: true },
      });
      if (existing) {
        throw new BadRequestException('Brand setting already exists for this estate');
      }
      data.estate = { connect: { id: estateId } };
    }

    return this.prisma.brandSetting.create({
      data,
      include: { estate: { select: { id: true, name: true } } },
    });
  }

  @Patch(':guid')
  @Roles('ADMIN')
  async update(@Param('guid') guid: string, @Body() body: BrandSettingBody) {
    const data: Prisma.brandSettingUpdateInput = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
      ...(body.primaryColor !== undefined
        ? { primaryColor: body.primaryColor }
        : {}),
      ...(body.secondaryColor !== undefined
        ? { secondaryColor: body.secondaryColor }
        : {}),
      ...(body.bgPrimaryColor !== undefined
        ? { bgPrimaryColor: body.bgPrimaryColor }
        : {}),
      ...(body.bgSecondaryColor !== undefined
        ? { bgSecondaryColor: body.bgSecondaryColor }
        : {}),
      ...(body.textPrimaryColor !== undefined
        ? { textPrimaryColor: body.textPrimaryColor }
        : {}),
      ...(body.textSecondaryColor !== undefined
        ? { textSecondaryColor: body.textSecondaryColor }
        : {}),
      ...(body.fontFamilyPrimary !== undefined
        ? { fontFamilyPrimary: body.fontFamilyPrimary }
        : {}),
      ...(body.fontFamilySecondary !== undefined
        ? { fontFamilySecondary: body.fontFamilySecondary }
        : {}),
    };

    if (body.estateId !== undefined) {
      if (body.estateId === null || body.estateId === '') {
        data.estate = { disconnect: true };
      } else {
        const estateId = parseBigIntId(body.estateId, 'estateId');
        const estate = await this.prisma.estate.findUnique({
          where: { id: estateId },
          select: { id: true },
        });
        if (!estate) {
          throw new BadRequestException('estateId does not exist');
        }
        const existing = await this.prisma.brandSetting.findUnique({
          where: { estateId },
          select: { guid: true },
        });
        if (existing && existing.guid !== guid) {
          throw new BadRequestException('Brand setting already exists for this estate');
        }
        data.estate = { connect: { id: estateId } };
      }
    }

    return this.prisma.brandSetting.update({
      where: { guid },
      data,
      include: { estate: { select: { id: true, name: true } } },
    });
  }

  @Delete(':guid')
  @Roles('ADMIN')
  async remove(@Param('guid') guid: string) {
    return this.prisma.brandSetting.delete({ where: { guid } });
  }
}
