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

  // Read the one-and-only brand record
  async get() {
    const data = await this.prisma.brandSetting.findUnique({ where: { id: BRAND_ID } });
    return data || {};
  }

  // Create or update the singleton brand
  upsert(data: BrandUpsertData) {
    return this.prisma.brandSetting.upsert({
      where: { id: BRAND_ID },
      create: { id: BRAND_ID, ...data },
      update: { ...data },
    });
  }
}
