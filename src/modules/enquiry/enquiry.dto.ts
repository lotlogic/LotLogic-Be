import { ApiProperty } from '@nestjs/swagger';

export class EnquiryResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the enquiry', 
    example: '1234567890123456789',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Customer name', 
    example: 'John Smith' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Customer email address', 
    example: 'john.smith@email.com' 
  })
  email: string;

  @ApiProperty({ 
    description: 'Customer phone number', 
    example: '+61 4 1234 5678' 
  })
  phone: string;

  @ApiProperty({ 
    description: 'Additional comments from customer', 
    example: 'I would like to discuss pricing options and available timeframes',
    required: false
  })
  comments?: string;

  @ApiProperty({ 
    description: 'Associated lot ID', 
    example: '1234567890123456789',
    required: false
  })
  lotId?: string;

  @ApiProperty({ 
    description: 'Selected house design ID', 
    example: '1234567890123456789',
    required: false
  })
  floorPlanId?: string;

  @ApiProperty({ 
    description: 'Selected facade ID', 
    example: '1234567890123456789',
    required: false
  })
  facadeId?: string;

  @ApiProperty({ 
    description: 'Timestamp when the enquiry was created', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;
}

export class CreateEnquiryDto {
  @ApiProperty({ 
    description: 'Customer name', 
    example: 'John Smith' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Customer email address', 
    example: 'john.smith@email.com' 
  })
  email: string;

  @ApiProperty({ 
    description: 'Customer phone number', 
    example: '+61 4 1234 5678' 
  })
  phone: string;

  @ApiProperty({ 
    description: 'Array of selected builder IDs', 
    example: ['1234567890123456789', '9876543210987654321'],
    type: [String]
  })
  builders: string[];

  @ApiProperty({ 
    description: 'Additional comments from customer', 
    example: 'I would like to discuss pricing options and available timeframes',
    required: false
  })
  comments?: string;

  @ApiProperty({ 
    description: 'Selected lot ID', 
    example: '1234567890123456789' 
  })
  lot_id: number;

  @ApiProperty({ 
    description: 'Selected house design ID', 
    example: '1234567890123456789' 
  })
  house_design_id: string;

  @ApiProperty({ 
    description: 'Selected facade ID', 
    example: '1234567890123456789' 
  })
  facade_id: string;
}

export class UpdateEnquiryDto {
  @ApiProperty({ 
    description: 'Customer name', 
    example: 'John Smith',
    required: false
  })
  name?: string;

  @ApiProperty({ 
    description: 'Customer email address', 
    example: 'john.smith@email.com',
    required: false
  })
  email?: string;

  @ApiProperty({ 
    description: 'Customer phone number', 
    example: '+61 4 1234 5678',
    required: false
  })
  phone?: string;

  @ApiProperty({ 
    description: 'Additional comments from customer', 
    example: 'I would like to discuss pricing options and available timeframes',
    required: false
  })
  comments?: string;

  @ApiProperty({ 
    description: 'Associated lot ID', 
    example: '1234567890123456789',
    required: false
  })
  lotId?: string;

  @ApiProperty({ 
    description: 'Selected house design ID', 
    example: '1234567890123456789',
    required: false
  })
  floorPlanId?: string;

  @ApiProperty({ 
    description: 'Selected facade ID', 
    example: '1234567890123456789',
    required: false
  })
  facadeId?: string;
}

export class EnquiryListResponseDto {
  @ApiProperty({ 
    description: 'Array of enquiries', 
    type: [EnquiryResponseDto] 
  })
  enquiries: EnquiryResponseDto[];

  @ApiProperty({ 
    description: 'Total number of enquiries', 
    example: 45 
  })
  total: number;

  @ApiProperty({ 
    description: 'Current page number', 
    example: 1 
  })
  page: number;

  @ApiProperty({ 
    description: 'Number of enquiries per page', 
    example: 10 
  })
  limit: number;
}

export class EnquirySearchQueryDto {
  @ApiProperty({ 
    description: 'Search by customer name or email', 
    example: 'John Smith',
    required: false
  })
  search?: string;

  @ApiProperty({ 
    description: 'Filter by lot ID', 
    example: '1234567890123456789',
    required: false
  })
  lotId?: string;

  @ApiProperty({ 
    description: 'Filter by house design ID', 
    example: '1234567890123456789',
    required: false
  })
  floorPlanId?: string;

  @ApiProperty({ 
    description: 'Filter by facade ID', 
    example: '1234567890123456789',
    required: false
  })
  facadeId?: string;

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
