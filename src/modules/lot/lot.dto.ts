import { ApiProperty } from '@nestjs/swagger';

export class LotResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the lot', 
    example: '1234567890123456789',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Unique block key identifier', 
    example: 'BLK001-LOT042' 
  })
  blockKey: string;

  @ApiProperty({ 
    description: 'Block number within the estate', 
    example: 1,
    required: false
  })
  blockNumber?: number;

  @ApiProperty({ 
    description: 'Section number within the estate', 
    example: 2,
    required: false
  })
  sectionNumber?: number;

  @ApiProperty({ 
    description: 'Lot area in square meters', 
    example: 450.5 
  })
  areaSqm: number;

  @ApiProperty({ 
    description: 'Zoning classification for the lot', 
    example: 'RZ2: Low Density Residential' 
  })
  zoning: string;

  @ApiProperty({ 
    description: 'Physical address of the lot', 
    example: '123 Hamilton Road, Mitchell ACT 2911',
    required: false
  })
  address?: string;

  @ApiProperty({ 
    description: 'District where the lot is located', 
    example: 'Mitchell',
    required: false
  })
  district?: string;

  @ApiProperty({ 
    description: 'Division within the district', 
    example: 'North',
    required: false
  })
  division?: string;

  @ApiProperty({ 
    description: 'Current lifecycle stage of the lot', 
    example: 'Available',
    required: false
  })
  lifecycleStage?: string;

  @ApiProperty({ 
    description: 'GeoJSON data for the lot boundaries', 
    example: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[149.1, -35.2], [149.2, -35.2], [149.2, -35.3], [149.1, -35.3], [149.1, -35.2]]] } },
    required: false
  })
  geojson?: any;

  @ApiProperty({ 
    description: 'Geometric data for the lot', 
    example: 'POLYGON((149.1 -35.2, 149.2 -35.2, 149.2 -35.3, 149.1 -35.3, 149.1 -35.2))',
    required: false
  })
  geometry?: any;

  @ApiProperty({ 
    description: 'Associated estate ID', 
    example: '1234567890123456789',
    required: false
  })
  estateId?: string;

  @ApiProperty({ 
    description: 'Array of overlay classifications', 
    example: ['Bushfire', 'Flood'],
    type: [String]
  })
  overlays: string[];

  @ApiProperty({ 
    description: 'Frontage coordinate data', 
    example: 'POINT(149.15 -35.25)',
    required: false
  })
  frontageCoordinate?: any;

  @ApiProperty({ 
    description: 'Timestamp when the lot was created', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Timestamp when the lot was last updated', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  updatedAt: Date;
}

export class LotListResponseDto {
  @ApiProperty({ 
    description: 'Array of lots', 
    type: [LotResponseDto] 
  })
  lots: LotResponseDto[];

  @ApiProperty({ 
    description: 'Total number of lots', 
    example: 150 
  })
  total: number;

  @ApiProperty({ 
    description: 'Current page number', 
    example: 1 
  })
  page: number;

  @ApiProperty({ 
    description: 'Number of lots per page', 
    example: 10 
  })
  limit: number;
}

export class LotSearchQueryDto {
  @ApiProperty({ 
    description: 'Search by lot address or block key', 
    example: 'Hamilton',
    required: false
  })
  search?: string;

  @ApiProperty({ 
    description: 'Filter by zoning classification', 
    example: 'RZ2',
    required: false
  })
  zoning?: string;

  @ApiProperty({ 
    description: 'Filter by minimum lot area in square meters', 
    example: 400,
    required: false
  })
  minArea?: number;

  @ApiProperty({ 
    description: 'Filter by maximum lot area in square meters', 
    example: 600,
    required: false
  })
  maxArea?: number;

  @ApiProperty({ 
    description: 'Filter by estate ID', 
    example: '1234567890123456789',
    required: false
  })
  estateId?: string;

  @ApiProperty({ 
    description: 'Filter by lifecycle stage', 
    example: 'Available',
    required: false
  })
  lifecycleStage?: string;

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
