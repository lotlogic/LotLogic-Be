import { ApiProperty } from '@nestjs/swagger';

export class BuilderResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the builder', 
    example: '1234567890123456789',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Name of the builder company', 
    example: 'Hamilton Homes Pty Ltd' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Contact email for the builder', 
    example: 'info@hamiltonhomes.com.au' 
  })
  email: string;

  @ApiProperty({ 
    description: 'Contact phone number for the builder', 
    example: '+61 2 9876 5432' 
  })
  phone: string;

  @ApiProperty({ 
    description: 'Timestamp when the builder was created', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Timestamp when the builder was last updated', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  updatedAt: Date;
}

export class CreateBuilderDto {
  @ApiProperty({ 
    description: 'Name of the builder company', 
    example: 'Hamilton Homes Pty Ltd' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Contact email for the builder', 
    example: 'info@hamiltonhomes.com.au' 
  })
  email: string;

  @ApiProperty({ 
    description: 'Contact phone number for the builder', 
    example: '+61 2 9876 5432' 
  })
  phone: string;
}

export class UpdateBuilderDto {
  @ApiProperty({ 
    description: 'Name of the builder company', 
    example: 'Hamilton Homes Pty Ltd',
    required: false
  })
  name?: string;

  @ApiProperty({ 
    description: 'Contact email for the builder', 
    example: 'info@hamiltonhomes.com.au',
    required: false
  })
  email?: string;

  @ApiProperty({ 
    description: 'Contact phone number for the builder', 
    example: '+61 2 9876 5432',
    required: false
  })
  phone?: string;
}

export class BuilderListResponseDto {
  @ApiProperty({ 
    description: 'Array of builders', 
    type: [BuilderResponseDto] 
  })
  builders: BuilderResponseDto[];

  @ApiProperty({ 
    description: 'Total number of builders', 
    example: 25 
  })
  total: number;

  @ApiProperty({ 
    description: 'Current page number', 
    example: 1 
  })
  page: number;

  @ApiProperty({ 
    description: 'Number of builders per page', 
    example: 10 
  })
  limit: number;
}

export class BuilderSearchQueryDto {
  @ApiProperty({ 
    description: 'Search by builder name or email', 
    example: 'Hamilton',
    required: false
  })
  search?: string;

  @ApiProperty({ 
    description: 'Filter by email domain', 
    example: 'hamiltonhomes.com.au',
    required: false
  })
  emailDomain?: string;

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
