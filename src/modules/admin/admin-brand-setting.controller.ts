import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

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
}

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/brand-settings')
export class AdminBrandSettingController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.prisma.brandSetting.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { estates: true } } },
    });
  }

  @Get(':guid')
  @Roles('ADMIN')
  async findOne(@Param('guid') guid: string) {
    return this.prisma.brandSetting.findUnique({
      where: { guid },
      include: { _count: { select: { estates: true } } },
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

    return this.prisma.brandSetting.create({
      data,
      include: { _count: { select: { estates: true } } },
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

    return this.prisma.brandSetting.update({
      where: { guid },
      data,
      include: { _count: { select: { estates: true } } },
    });
  }

  @Delete(':guid')
  @Roles('ADMIN')
  async remove(@Param('guid') guid: string) {
    return this.prisma.brandSetting.delete({ where: { guid } });
  }
}
