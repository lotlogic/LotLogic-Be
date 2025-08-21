import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BrandService } from './brand.service';

@Controller('brand')
export class BrandController {
    constructor(private readonly brandService: BrandService) {}
    
    @Get(':domain')
    async findOne(@Param('domain') domain: string) {
        return await this.brandService.findBrand(domain);
    }
    
    @Post()
    async insertBrand(
    @Body('name') name: string,
    @Body('title') title: string,
    @Body('domain') domain: string,
    @Body('logoUrl') logoUrl: string,
    @Body('primaryColor') primaryColor?: string,
    @Body('secondaryColor') secondaryColor?: string,
    @Body('bgPrimaryColor') bgPrimaryColor?: string,
    @Body('bgSecondaryColor') bgSecondaryColor?: string,
    @Body('textPrimaryColor') textPrimaryColor?: string,
    @Body('textSecondaryColor') textSecondaryColor?: string,
    @Body('fontFamilyPrimary') fontFamilyPrimary?: string,
    @Body('fontFamilySecondary') fontFamilySecondary?: string
    ) {
        await this.brandService.addBrand({
            name,
            title,
            domain,
            logoUrl,
            primaryColor: primaryColor ?? null,
            secondaryColor: secondaryColor ?? null,
            bgPrimaryColor: bgPrimaryColor ?? null,
            bgSecondaryColor: bgSecondaryColor ?? null,
            textPrimaryColor: textPrimaryColor ?? null,
            textSecondaryColor: textSecondaryColor ?? null,
            fontFamilyPrimary: fontFamilyPrimary ?? null,
            fontFamilySecondary: fontFamilySecondary ?? null
        });
        return { message: "Added" };
    }
}
