import { ApiProperty } from '@nestjs/swagger';

export class ZoningRuleResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the zoning rule', 
    example: '1234567890123456789',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Zoning code (e.g., RZ2, RZ3)', 
    example: 'RZ2' 
  })
  code: string;

  @ApiProperty({ 
    description: 'Full name of the zoning classification', 
    example: 'Low Density Residential' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Type of zoning classification', 
    example: 'Residential' 
  })
  type: string;

  @ApiProperty({ 
    description: 'Whether this is an overlay rule', 
    example: false 
  })
  isOverlay: boolean;

  @ApiProperty({ 
    description: 'Maximum building height in meters', 
    example: 8.5,
    required: false
  })
  maxBuildingHeight_m?: number;

  @ApiProperty({ 
    description: 'Maximum number of storeys allowed', 
    example: 2,
    required: false
  })
  maxStoreys?: number;

  @ApiProperty({ 
    description: 'Minimum lot area in square meters', 
    example: 450.0,
    required: false
  })
  minLotArea_sqm?: number;

  @ApiProperty({ 
    description: 'Minimum lot width in meters', 
    example: 18.0,
    required: false
  })
  minLotWidth_m?: number;

  @ApiProperty({ 
    description: 'Minimum lot depth in meters', 
    example: 32.0,
    required: false
  })
  minLotDepth_m?: number;

  @ApiProperty({ 
    description: 'Minimum frontage for standard lots in meters', 
    example: 18.0,
    required: false
  })
  minFrontageStandard_m?: number;

  @ApiProperty({ 
    description: 'Minimum frontage for corner lots in meters', 
    example: 15.0,
    required: false
  })
  minFrontageCorner_m?: number;

  @ApiProperty({ 
    description: 'Minimum Floor Space Ratio (FSR)', 
    example: 0.3,
    required: false
  })
  minFSR?: number;

  @ApiProperty({ 
    description: 'Maximum Floor Space Ratio (FSR)', 
    example: 0.5,
    required: false
  })
  maxFSR?: number;

  @ApiProperty({ 
    description: 'Minimum front setback in meters', 
    example: 6.0,
    required: false
  })
  minFrontSetback_m?: number;

  @ApiProperty({ 
    description: 'Minimum rear setback in meters', 
    example: 3.0,
    required: false
  })
  minRearSetback_m?: number;

  @ApiProperty({ 
    description: 'Minimum side setback in meters', 
    example: 1.5,
    required: false
  })
  minSideSetback_m?: number;

  @ApiProperty({ 
    description: 'Array of zones this rule applies to', 
    example: ['RZ2', 'RZ3'],
    type: [String]
  })
  appliesToZones: string[];

  @ApiProperty({ 
    description: 'Timestamp when the zoning rule was created', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Timestamp when the zoning rule was last updated', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  updatedAt: Date;
}

export class CreateZoningRuleDto {
  @ApiProperty({ 
    description: 'Zoning code (e.g., RZ2, RZ3)', 
    example: 'RZ2' 
  })
  code: string;

  @ApiProperty({ 
    description: 'Full name of the zoning classification', 
    example: 'Low Density Residential' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Type of zoning classification', 
    example: 'Residential' 
  })
  type: string;

  @ApiProperty({ 
    description: 'Whether this is an overlay rule', 
    example: false 
  })
  isOverlay: boolean;

  @ApiProperty({ 
    description: 'Maximum building height in meters', 
    example: 8.5,
    required: false
  })
  maxBuildingHeight_m?: number;

  @ApiProperty({ 
    description: 'Maximum number of storeys allowed', 
    example: 2,
    required: false
  })
  maxStoreys?: number;

  @ApiProperty({ 
    description: 'Minimum lot area in square meters', 
    example: 450.0,
    required: false
  })
  minLotArea_sqm?: number;

  @ApiProperty({ 
    description: 'Minimum lot width in meters', 
    example: 18.0,
    required: false
  })
  minLotWidth_m?: number;

  @ApiProperty({ 
    description: 'Minimum lot depth in meters', 
    example: 32.0,
    required: false
  })
  minLotDepth_m?: number;

  @ApiProperty({ 
    description: 'Minimum frontage for standard lots in meters', 
    example: 18.0,
    required: false
  })
  minFrontageStandard_m?: number;

  @ApiProperty({ 
    description: 'Minimum frontage for corner lots in meters', 
    example: 15.0,
    required: false
  })
  minFrontageCorner_m?: number;

  @ApiProperty({ 
    description: 'Minimum Floor Space Ratio (FSR)', 
    example: 0.3,
    required: false
  })
  minFSR?: number;

  @ApiProperty({ 
    description: 'Maximum Floor Space Ratio (FSR)', 
    example: 0.5,
    required: false
  })
  maxFSR?: number;

  @ApiProperty({ 
    description: 'Minimum front setback in meters', 
    example: 6.0,
    required: false
  })
  minFrontSetback_m?: number;

  @ApiProperty({ 
    description: 'Minimum rear setback in meters', 
    example: 3.0,
    required: false
  })
  minRearSetback_m?: number;

  @ApiProperty({ 
    description: 'Minimum side setback in meters', 
    example: 1.5,
    required: false
  })
  minSideSetback_m?: number;

  @ApiProperty({ 
    description: 'Array of zones this rule applies to', 
    example: ['RZ2', 'RZ3'],
    type: [String]
  })
  appliesToZones: string[];
}

export class UpdateZoningRuleDto {
  @ApiProperty({ 
    description: 'Zoning code (e.g., RZ2, RZ3)', 
    example: 'RZ2',
    required: false
  })
  code?: string;

  @ApiProperty({ 
    description: 'Full name of the zoning classification', 
    example: 'Low Density Residential',
    required: false
  })
  name?: string;

  @ApiProperty({ 
    description: 'Type of zoning classification', 
    example: 'Residential',
    required: false
  })
  type?: string;

  @ApiProperty({ 
    description: 'Whether this is an overlay rule', 
    example: false,
    required: false
  })
  isOverlay?: boolean;

  @ApiProperty({ 
    description: 'Maximum building height in meters', 
    example: 8.5,
    required: false
  })
  maxBuildingHeight_m?: number;

  @ApiProperty({ 
    description: 'Maximum number of storeys allowed', 
    example: 2,
    required: false
  })
  maxStoreys?: number;

  @ApiProperty({ 
    description: 'Minimum lot area in square meters', 
    example: 450.0,
    required: false
  })
  minLotArea_sqm?: number;

  @ApiProperty({ 
    description: 'Minimum lot width in meters', 
    example: 18.0,
    required: false
  })
  minLotWidth_m?: number;

  @ApiProperty({ 
    description: 'Minimum lot depth in meters', 
    example: 32.0,
    required: false
  })
  minLotDepth_m?: number;

  @ApiProperty({ 
    description: 'Minimum frontage for standard lots in meters', 
    example: 18.0,
    required: false
  })
  minFrontageStandard_m?: number;

  @ApiProperty({ 
    description: 'Minimum frontage for corner lots in meters', 
    example: 15.0,
    required: false
  })
  minFrontageCorner_m?: number;

  @ApiProperty({ 
    description: 'Minimum Floor Space Ratio (FSR)', 
    example: 0.3,
    required: false
  })
  minFSR?: number;

  @ApiProperty({ 
    description: 'Maximum Floor Space Ratio (FSR)', 
    example: 0.5,
    required: false
  })
  maxFSR?: number;

  @ApiProperty({ 
    description: 'Minimum front setback in meters', 
    example: 6.0,
    required: false
  })
  minFrontSetback_m?: number;

  @ApiProperty({ 
    description: 'Minimum rear setback in meters', 
    example: 3.0,
    required: false
  })
  minRearSetback_m?: number;

  @ApiProperty({ 
    description: 'Minimum side setback in meters', 
    example: 1.5,
    required: false
  })
  minSideSetback_m?: number;

  @ApiProperty({ 
    description: 'Array of zones this rule applies to', 
    example: ['RZ2', 'RZ3'],
    type: [String],
    required: false
  })
  appliesToZones?: string[];
}

export class ZoningRuleListResponseDto {
  @ApiProperty({ 
    description: 'Array of zoning rules', 
    type: [ZoningRuleResponseDto] 
  })
  zoningRules: ZoningRuleResponseDto[];

  @ApiProperty({ 
    description: 'Total number of zoning rules', 
    example: 25 
  })
  total: number;

  @ApiProperty({ 
    description: 'Current page number', 
    example: 1 
  })
  page: number;

  @ApiProperty({ 
    description: 'Number of zoning rules per page', 
    example: 10 
  })
  limit: number;
}

export class ZoningRuleSearchQueryDto {
  @ApiProperty({ 
    description: 'Search by zoning code or name', 
    example: 'RZ2',
    required: false
  })
  search?: string;

  @ApiProperty({ 
    description: 'Filter by zoning type', 
    example: 'Residential',
    required: false
  })
  type?: string;

  @ApiProperty({ 
    description: 'Filter by overlay status', 
    example: false,
    required: false
  })
  isOverlay?: boolean;

  @ApiProperty({ 
    description: 'Filter by minimum lot area', 
    example: 400,
    required: false
  })
  minLotArea?: number;

  @ApiProperty({ 
    description: 'Filter by maximum lot area', 
    example: 600,
    required: false
  })
  maxLotArea?: number;

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
