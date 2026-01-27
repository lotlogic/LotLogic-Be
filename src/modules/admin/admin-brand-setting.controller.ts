import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

const BRAND_SETTING_ID = 'default';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/brand-settings')
export class AdminBrandSettingController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN')
  async get() {
    return this.prisma.brandSetting.findUnique({
      where: { id: BRAND_SETTING_ID },
    });
  }

  @Put()
  @Roles('ADMIN')
  async upsert(@Body() data: Prisma.brandSettingUpdateInput) {
    return this.prisma.brandSetting.upsert({
      where: { id: BRAND_SETTING_ID },
      create: { id: BRAND_SETTING_ID, ...(data as Prisma.brandSettingCreateInput) },
      update: data,
    });
  }

  @Patch()
  @Roles('ADMIN')
  async update(@Body() data: Prisma.brandSettingUpdateInput) {
    return this.prisma.brandSetting.update({
      where: { id: BRAND_SETTING_ID },
      data,
    });
  }
}
