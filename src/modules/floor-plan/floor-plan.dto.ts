import { ApiProperty } from '@nestjs/swagger';

export class FloorPlanResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the floor plan', 
    example: '1234567890123456789',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Name of the floor plan design', 
    example: 'Hamilton 4-Bedroom Family Home' 
  })
  name: string;

  @ApiProperty({ 
    description: 'URL to the floor plan image', 
    example: 'https://example.com/floorplans/hamilton-4bed.png',
    required: false
  })
  floorplanUrl?: string;

  @ApiProperty({ 
    description: 'Number of bedrooms in the design', 
    example: 4 
  })
  bedrooms: number;

  @ApiProperty({ 
    description: 'Number of bathrooms in the design', 
    example: 2 
  })
  bathrooms: number;

  @ApiProperty({ 
    description: 'Number of garage spaces', 
    example: 2 
  })
  garages: number;

  @ApiProperty({ 
    description: 'Total floor area in square meters', 
    example: 245.5 
  })
  areaSqm: number;

  @ApiProperty({ 
    description: 'Minimum lot width required in meters', 
    example: 18.5 
  })
  minLotWidth: number;

  @ApiProperty({ 
    description: 'Minimum lot depth required in meters', 
    example: 32.0 
  })
  minLotDepth: number;

  @ApiProperty({ 
    description: 'Whether the design includes a rumpus room', 
    example: true 
  })
  rumpus: boolean;

  @ApiProperty({ 
    description: 'Whether the design includes an alfresco area', 
    example: true 
  })
  alfresco: boolean;

  @ApiProperty({ 
    description: 'Whether the design includes a pergola', 
    example: false 
  })
  pergola: boolean;

  @ApiProperty({ 
    description: 'Timestamp when the floor plan was created', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Timestamp when the floor plan was last updated', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  updatedAt: Date;
}

export class HouseDesignFilterQueryDto {
  @ApiProperty({ 
    description: 'Lot ID to filter house designs for', 
    example: '1234567890123456789' 
  })
  lot_id: string;

  @ApiProperty({ 
    description: 'Filter by number of bedrooms (comma-separated or JSON array)', 
    example: '3,4,5',
    required: false
  })
  bedroom?: string;

  @ApiProperty({ 
    description: 'Filter by number of bathrooms (comma-separated or JSON array)', 
    example: '2,3',
    required: false
  })
  bathroom?: string;

  @ApiProperty({ 
    description: 'Filter by number of garage spaces (comma-separated or JSON array)', 
    example: '1,2',
    required: false
  })
  car?: string;

  @ApiProperty({ 
    description: 'Minimum floor area in square meters', 
    example: '200',
    required: false
  })
  min_size?: string;

  @ApiProperty({ 
    description: 'Maximum floor area in square meters', 
    example: '300',
    required: false
  })
  max_size?: string;

  @ApiProperty({ 
    description: 'Filter by rumpus room availability', 
    example: 'true',
    required: false
  })
  rumpus?: string;

  @ApiProperty({ 
    description: 'Filter by alfresco area availability', 
    example: 'true',
    required: false
  })
  alfresco?: string;

  @ApiProperty({ 
    description: 'Filter by pergola availability', 
    example: 'false',
    required: false
  })
  pergola?: string;
}

export class HouseDesignFilterResponseDto {
  @ApiProperty({ 
    description: 'Array of filtered house designs', 
    type: [FloorPlanResponseDto] 
  })
  houseDesigns: FloorPlanResponseDto[];

  @ApiProperty({ 
    description: 'Zoning information for the lot', 
    example: {
      fsr: 300,
      frontSetback: 6.0,
      rearSetback: 3.0,
      sideSetback: 1.5
    }
  })
  zoning: {
    fsr: number;
    frontSetback: number;
    rearSetback: number;
    sideSetback: number;
  };
}

export class CreateFloorPlanDto {
  @ApiProperty({ 
    description: 'Name of the floor plan design', 
    example: 'Hamilton 4-Bedroom Family Home' 
  })
  name: string;

  @ApiProperty({ 
    description: 'URL to the floor plan image', 
    example: 'https://example.com/floorplans/hamilton-4bed.png',
    required: false
  })
  floorplanUrl?: string;

  @ApiProperty({ 
    description: 'Number of bedrooms in the design', 
    example: 4 
  })
  bedrooms: number;

  @ApiProperty({ 
    description: 'Number of bathrooms in the design', 
    example: 2 
  })
  bathrooms: number;

  @ApiProperty({ 
    description: 'Number of garage spaces', 
    example: 2 
  })
  garages: number;

  @ApiProperty({ 
    description: 'Total floor area in square meters', 
    example: 245.5 
  })
  areaSqm: number;

  @ApiProperty({ 
    description: 'Minimum lot width required in meters', 
    example: 18.5 
  })
  minLotWidth: number;

  @ApiProperty({ 
    description: 'Minimum lot depth required in meters', 
    example: 32.0 
  })
  minLotDepth: number;

  @ApiProperty({ 
    description: 'Whether the design includes a rumpus room', 
    example: true 
  })
  rumpus: boolean;

  @ApiProperty({ 
    description: 'Whether the design includes an alfresco area', 
    example: true 
  })
  alfresco: boolean;

  @ApiProperty({ 
    description: 'Whether the design includes a pergola', 
    example: false 
  })
  pergola: boolean;
}

export class UpdateFloorPlanDto {
  @ApiProperty({ 
    description: 'Name of the floor plan design', 
    example: 'Hamilton 4-Bedroom Family Home',
    required: false
  })
  name?: string;

  @ApiProperty({ 
    description: 'URL to the floor plan image', 
    example: 'https://example.com/floorplans/hamilton-4bed.png',
    required: false
  })
  floorplanUrl?: string;

  @ApiProperty({ 
    description: 'Number of bedrooms in the design', 
    example: 4,
    required: false
  })
  bedrooms?: number;

  @ApiProperty({ 
    description: 'Number of bathrooms in the design', 
    example: 2,
    required: false
  })
  bathrooms?: number;

  @ApiProperty({ 
    description: 'Number of garage spaces', 
    example: 2,
    required: false
  })
  garages?: number;

  @ApiProperty({ 
    description: 'Total floor area in square meters', 
    example: 245.5,
    required: false
  })
  areaSqm?: number;

  @ApiProperty({ 
    description: 'Minimum lot width required in meters', 
    example: 18.5,
    required: false
  })
  minLotWidth?: number;

  @ApiProperty({ 
    description: 'Minimum lot depth required in meters', 
    example: 32.0,
    required: false
  })
  minLotDepth?: number;

  @ApiProperty({ 
    description: 'Whether the design includes a rumpus room', 
    example: true,
    required: false
  })
  rumpus?: boolean;

  @ApiProperty({ 
    description: 'Whether the design includes an alfresco area', 
    example: true,
    required: false
  })
  alfresco?: boolean;

  @ApiProperty({ 
    description: 'Whether the design includes a pergola', 
    example: false,
    required: false
  })
  pergola?: boolean;
}
