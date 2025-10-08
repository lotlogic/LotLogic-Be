import { ApiProperty } from '@nestjs/swagger';

export class GeoDataResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the geo data', 
    example: 1,
    type: 'number'
  })
  id: number;

  @ApiProperty({ 
    description: 'Name of the geographic feature', 
    example: 'Mitchell Development Area',
    required: false
  })
  name?: string;

  @ApiProperty({ 
    description: 'Color code for the geographic feature', 
    example: '#1E40AF',
    required: false
  })
  color?: string;

  @ApiProperty({ 
    description: 'Geographic coordinates in GeoJSON format', 
    example: '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[149.1,-35.2],[149.2,-35.2],[149.2,-35.3],[149.1,-35.3],[149.1,-35.2]]]}}' 
  })
  coordinates: string;

  @ApiProperty({ 
    description: 'Type of geographic feature', 
    example: 'development_area' 
  })
  geoType: string;

  @ApiProperty({ 
    description: 'Timestamp when the geo data was created', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Timestamp when the geo data was last updated', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  updatedAt: Date;
}

export class CreateGeoDataDto {
  @ApiProperty({ 
    description: 'Name of the geographic feature', 
    example: 'Mitchell Development Area',
    required: false
  })
  name?: string;

  @ApiProperty({ 
    description: 'Color code for the geographic feature', 
    example: '#1E40AF',
    required: false
  })
  color?: string;

  @ApiProperty({ 
    description: 'Geographic coordinates in GeoJSON format', 
    example: '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[149.1,-35.2],[149.2,-35.2],[149.2,-35.3],[149.1,-35.3],[149.1,-35.2]]]}}' 
  })
  coordinates: string;

  @ApiProperty({ 
    description: 'Type of geographic feature', 
    example: 'development_area' 
  })
  geoType: string;
}

export class UpdateGeoDataDto {
  @ApiProperty({ 
    description: 'Name of the geographic feature', 
    example: 'Mitchell Development Area',
    required: false
  })
  name?: string;

  @ApiProperty({ 
    description: 'Color code for the geographic feature', 
    example: '#1E40AF',
    required: false
  })
  color?: string;

  @ApiProperty({ 
    description: 'Geographic coordinates in GeoJSON format', 
    example: '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[149.1,-35.2],[149.2,-35.2],[149.2,-35.3],[149.1,-35.3],[149.1,-35.2]]]}}',
    required: false
  })
  coordinates?: string;

  @ApiProperty({ 
    description: 'Type of geographic feature', 
    example: 'development_area',
    required: false
  })
  geoType?: string;
}

export class GeoDataListResponseDto {
  @ApiProperty({ 
    description: 'Array of geographic data records', 
    type: [GeoDataResponseDto] 
  })
  geoData: GeoDataResponseDto[];

  @ApiProperty({ 
    description: 'Total number of geo data records', 
    example: 25 
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

export class GeoDataSearchQueryDto {
  @ApiProperty({ 
    description: 'Search by geographic feature name', 
    example: 'Mitchell',
    required: false
  })
  search?: string;

  @ApiProperty({ 
    description: 'Filter by geographic feature type', 
    example: 'development_area',
    required: false
  })
  geoType?: string;

  @ApiProperty({ 
    description: 'Filter by color code', 
    example: '#1E40AF',
    required: false
  })
  color?: string;

  @ApiProperty({ 
    description: 'Filter by bounding box coordinates (minLng,minLat,maxLng,maxLat)', 
    example: '149.0,-35.3,149.3,-35.1',
    required: false
  })
  bbox?: string;

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

export class GeoDataUploadDto {
  @ApiProperty({ 
    description: 'File containing geographic data (GeoJSON, Shapefile, etc.)', 
    type: 'string',
    format: 'binary'
  })
  file: any;

  @ApiProperty({ 
    description: 'Type of geographic feature', 
    example: 'development_area' 
  })
  geoType: string;

  @ApiProperty({ 
    description: 'Color code for the geographic feature', 
    example: '#1E40AF',
    required: false
  })
  color?: string;

  @ApiProperty({ 
    description: 'Name for the geographic feature', 
    example: 'Mitchell Development Area',
    required: false
  })
  name?: string;
}

export class GeoDataUploadResponseDto {
  @ApiProperty({ 
    description: 'Whether the upload was successful', 
    example: true 
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Message about the upload operation', 
    example: 'Geo data uploaded successfully' 
  })
  message: string;

  @ApiProperty({ 
    description: 'Number of features processed', 
    example: 15 
  })
  featuresProcessed: number;

  @ApiProperty({ 
    description: 'ID of the created geo data record', 
    example: 1 
  })
  geoDataId: number;

  @ApiProperty({ 
    description: 'Timestamp when the upload was completed', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  uploadedAt: Date;
}
