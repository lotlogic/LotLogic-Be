// brand.controller.ts
import { Body, Controller, Get, Post, BadRequestException } from '@nestjs/common';
import { BrandService } from '@modules/brand/brand.service';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  async getBrand() {
    return this.brandService.get();
  }

  @Post()
  async upsertBrand(
    @Body('name') name: string,
    @Body('title') title: string,
    @Body('logoUrl') logoUrl: string,
    @Body('primaryColor') primaryColor?: string,
    @Body('secondaryColor') secondaryColor?: string,
    @Body('bgPrimaryColor') bgPrimaryColor?: string,
    @Body('bgSecondaryColor') bgSecondaryColor?: string,
    @Body('textPrimaryColor') textPrimaryColor?: string,
    @Body('textSecondaryColor') textSecondaryColor?: string,
    @Body('fontFamilyPrimary') fontFamilyPrimary?: string,
    @Body('fontFamilySecondary') fontFamilySecondary?: string,
  ) {
    if (!name || !title || !logoUrl) {
      throw new BadRequestException('name, title, and logoUrl are required');
    }

    await this.brandService.upsert({
      name,
      title,
      logoUrl,
      primaryColor: primaryColor ?? null,
      secondaryColor: secondaryColor ?? null,
      bgPrimaryColor: bgPrimaryColor ?? null,
      bgSecondaryColor: bgSecondaryColor ?? null,
      textPrimaryColor: textPrimaryColor ?? null,
      textSecondaryColor: textSecondaryColor ?? null,
      fontFamilyPrimary: fontFamilyPrimary ?? null,
      fontFamilySecondary: fontFamilySecondary ?? null,
    });

    return { message: 'Updated' };
  }
}
