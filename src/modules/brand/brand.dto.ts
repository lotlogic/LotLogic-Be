import { ApiProperty } from '@nestjs/swagger';

export class UpsertBrandDto {
  @ApiProperty({
    description: 'Brand name',
    example: 'XYZ',
    type: 'string'
  })
  name: string;

  @ApiProperty({
    description: 'Brand title',
    example: 'XYZ',
    type: 'string'
  })
  title: string;

  @ApiProperty({
    description: 'Brand domain',
    example: 'localhost:3002',
    type: 'string'
  })
  domain: string;

  @ApiProperty({
    description: 'Brand logo URL',
    example: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0qCreqkTZL0F0bF9kZctFE1XVFocO__70kw&s',
    type: 'string'
  })
  logoUrl: string;

  @ApiProperty({
    description: 'Primary brand color in hex format',
    example: '#E4D00A',
    type: 'string'
  })
  primaryColor: string;

  @ApiProperty({
    description: 'Secondary brand color in hex format',
    example: '#8B8000',
    type: 'string'
  })
  secondaryColor: string;
}

export class BrandResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Updated',
    type: 'string'
  })
  message: string;
}
