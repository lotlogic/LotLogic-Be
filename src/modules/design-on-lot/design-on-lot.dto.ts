import { ApiProperty } from '@nestjs/swagger';

export class DesignOnLotResultDto {
  @ApiProperty({ 
    description: 'Unique identifier for the design-on-lot record', 
    example: '1234567890123456789',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Associated lot ID', 
    example: '1234567890123456789' 
  })
  lotId: string;

  @ApiProperty({ 
    description: 'Associated floor plan ID', 
    example: '1234567890123456789' 
  })
  floorPlanId: string;

  @ApiProperty({ 
    description: 'Whether the design is compatible with the lot', 
    example: true 
  })
  isCompatible: boolean;

  @ApiProperty({ 
    description: 'JSON object containing matched filter criteria', 
    example: {
      bedrooms: [4, 5],
      bathrooms: [2, 3],
      garages: [2],
      areaRange: [200, 300],
      features: ['rumpus', 'alfresco']
    },
    required: false
  })
  matchedFilters?: any;

  @ApiProperty({ 
    description: 'Timestamp when the compatibility was calculated', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;
}

export class DesignOnLotQueryDto {
  @ApiProperty({ 
    description: 'Lot ID to calculate design compatibility for', 
    example: '1234567890123456789' 
  })
  lotId: string;
}

export class DesignOnLotCalculationResponseDto {
  @ApiProperty({ 
    description: 'Whether the calculation was successful', 
    example: true 
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Compatibility result details', 
    type: DesignOnLotResultDto 
  })
  result: DesignOnLotResultDto;

  @ApiProperty({ 
    description: 'Additional calculation metadata', 
    example: {
      calculationTime: '2.5ms',
      filtersApplied: ['bedrooms', 'bathrooms', 'garages', 'area', 'features'],
      zoningCompliance: true
    }
  })
  metadata: {
    calculationTime: string;
    filtersApplied: string[];
    zoningCompliance: boolean;
  };
}

export class DesignOnLotListResponseDto {
  @ApiProperty({ 
    description: 'Array of design-on-lot compatibility records', 
    type: [DesignOnLotResultDto] 
  })
  designOnLots: DesignOnLotResultDto[];

  @ApiProperty({ 
    description: 'Total number of compatibility records', 
    example: 150 
  })
  total: number;

  @ApiProperty({ 
    description: 'Current page number', 
    example: 1 
  })
  page: number;

  @ApiProperty({ 
    description: 'Number of records per page', 
    example: 10 
  })
  limit: number;
}

export class DesignOnLotSearchQueryDto {
  @ApiProperty({ 
    description: 'Filter by lot ID', 
    example: '1234567890123456789',
    required: false
  })
  lotId?: string;

  @ApiProperty({ 
    description: 'Filter by floor plan ID', 
    example: '1234567890123456789',
    required: false
  })
  floorPlanId?: string;

  @ApiProperty({ 
    description: 'Filter by compatibility status', 
    example: true,
    required: false
  })
  isCompatible?: boolean;

  @ApiProperty({ 
    description: 'Filter by date range - start date', 
    example: '2024-01-01',
    required: false
  })
  startDate?: string;

  @ApiProperty({ 
    description: 'Filter by date range - end date', 
    example: '2024-01-31',
    required: false
  })
  endDate?: string;

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
