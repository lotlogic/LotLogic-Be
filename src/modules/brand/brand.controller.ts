// brand.controller.ts
import { Body, Controller, Get, Post, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BrandService } from '@modules/brand/brand.service';
import { UpsertBrandDto, BrandResponseDto } from './brand.dto';

@ApiTags('brand')
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get brand settings', 
    description: 'Retrieve the current brand configuration and styling' 
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved brand settings' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getBrand() {
    return this.brandService.get();
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create or update brand', 
    description: 'Create a new brand configuration or update existing one with styling options' 
  })
  @ApiBody({ 
    type: UpsertBrandDto,
    description: 'Brand configuration data including name, title, domain, logo, and styling options'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Brand created/updated successfully',
    type: BrandResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - missing required fields' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async upsertBrand(@Body() upsertBrandDto: UpsertBrandDto): Promise<BrandResponseDto> {
    if (!upsertBrandDto.name || !upsertBrandDto.title || !upsertBrandDto.logoUrl) {
      throw new BadRequestException('name, title, and logoUrl are required');
    }

    await this.brandService.upsert({
      name: upsertBrandDto.name,
      title: upsertBrandDto.title,
      logoUrl: upsertBrandDto.logoUrl,
      primaryColor: upsertBrandDto.primaryColor ?? null,
      secondaryColor: upsertBrandDto.secondaryColor ?? null,
      bgPrimaryColor: null,
      bgSecondaryColor: null,
      textPrimaryColor: null,
      textSecondaryColor: null,
      fontFamilyPrimary: null,
      fontFamilySecondary: null,
    });

    return { message: 'Updated' };
  }
}
