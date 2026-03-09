import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const BRAND_ID = 'default';

export type BrandUpsertData = {
  name: string;
  title: string;
  logoUrl: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  bgPrimaryColor?: string | null;
  bgSecondaryColor?: string | null;
  textPrimaryColor?: string | null;
  textSecondaryColor?: string | null;
  fontFamilyPrimary?: string | null;
  fontFamilySecondary?: string | null;
};

@Injectable()
export class BrandService {
  constructor(private prisma: PrismaService) {}

  // Default brand prefers the prototype estate brand when configured.
  async getDefault() {
    const prototypeEstate = await this.prisma.estate.findFirst({
      where: {
        isPrototype: true,
        brandGuid: { not: null },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        brandSetting: true,
      },
    });
    if (prototypeEstate?.brandSetting) {
      return prototypeEstate.brandSetting;
    }

    const data = await this.prisma.brandSetting.findUnique({ where: { id: BRAND_ID } });
    return data || {};
  }

  async getByGuid(guid: string) {
    return this.prisma.brandSetting.findUnique({ where: { guid } });
  }

  async getByEstateId(estateId: string) {
    const estate = await this.prisma.estate.findUnique({
      where: { id: BigInt(estateId) },
      select: {
        brandSetting: true,
      },
    });

    if (estate?.brandSetting) {
      return estate.brandSetting;
    }

    return this.getDefault();
  }

  // Create or update the legacy singleton brand
  upsertDefault(data: BrandUpsertData) {
    return this.prisma.brandSetting.upsert({
      where: { id: BRAND_ID },
      create: { id: BRAND_ID, ...data },
      update: { ...data },
    });
  }
}
