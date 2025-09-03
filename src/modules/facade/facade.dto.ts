import { ApiProperty } from '@nestjs/swagger';

export class FacadeResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the facade', 
    example: '1234567890123456789',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Label/name of the facade design', 
    example: 'Modern Contemporary' 
  })
  label: string;

  @ApiProperty({ 
    description: 'URL to the facade image', 
    example: 'https://example.com/facades/modern-contemporary.jpg' 
  })
  imageUrl: string;

  @ApiProperty({ 
    description: 'Associated floor plan ID', 
    example: '1234567890123456789' 
  })
  floorPlanId: string;

  @ApiProperty({ 
    description: 'Timestamp when the facade was created', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Timestamp when the facade was last updated', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  updatedAt: Date;
}

export class CreateFacadeDto {
  @ApiProperty({ 
    description: 'Label/name of the facade design', 
    example: 'Modern Contemporary' 
  })
  label: string;

  @ApiProperty({ 
    description: 'URL to the facade image', 
    example: 'https://example.com/facades/modern-contemporary.jpg' 
  })
  imageUrl: string;

  @ApiProperty({ 
    description: 'Associated floor plan ID', 
    example: '1234567890123456789' 
  })
  floorPlanId: number;
}

export class UpdateFacadeDto {
  @ApiProperty({ 
    description: 'Label/name of the facade design', 
    example: 'Modern Contemporary',
    required: false
  })
  label?: string;

  @ApiProperty({ 
    description: 'URL to the facade image', 
    example: 'https://example.com/facades/modern-contemporary.jpg',
    required: false
  })
  imageUrl?: string;

  @ApiProperty({ 
    description: 'Associated floor plan ID', 
    example: '1234567890123456789',
    required: false
  })
  floorPlanId?: number;
}

export class FacadeListResponseDto {
  @ApiProperty({ 
    description: 'Array of facades', 
    type: [FacadeResponseDto] 
  })
  facades: FacadeResponseDto[];

  @ApiProperty({ 
    description: 'Total number of facades', 
    example: 25 
  })
  total: number;

  @ApiProperty({ 
    description: 'Current page number', 
    example: 1 
  })
  page: number;

  @ApiProperty({ 
    description: 'Number of facades per page', 
    example: 10 
  })
  limit: number;
}

export class FacadeSearchQueryDto {
  @ApiProperty({ 
    description: 'Search by facade label', 
    example: 'Modern',
    required: false
  })
  search?: string;

  @ApiProperty({ 
    description: 'Filter by floor plan ID', 
    example: '1234567890123456789',
    required: false
  })
  floorPlanId?: string;

  @ApiProperty({ 
    description: 'Filter by facade style', 
    example: 'Contemporary',
    required: false
  })
  style?: string;

  @ApiProperty({ 
    description: 'Page number for pagination', 
    example: 1,
    required: false,
    default: 1
  })
  page?: number;

  @ApiProperty({ 
    description: 'Number of items per page', 
    example: 10,
    required: false,
    default: 10
  })
  limit?: number;
}
