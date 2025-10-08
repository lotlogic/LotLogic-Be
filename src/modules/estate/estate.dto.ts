import { ApiProperty } from '@nestjs/swagger';

export class EstateResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the estate', 
    example: '1234567890123456789',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Name of the estate', 
    example: 'Hamilton Rise Estate' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Physical address of the estate', 
    example: '123 Hamilton Road, Mitchell ACT 2911',
    required: false,
    nullable: true
  })
  address: string | null;

  @ApiProperty({ 
    description: 'Contact email for the estate', 
    example: 'info@hamiltonrise.com.au',
    required: false,
    nullable: true
  })
  email: string | null;

  @ApiProperty({ 
    description: 'URL to the estate logo image', 
    example: 'https://example.com/logo.png',
    required: false,
    nullable: true
  })
  logoUrl: string | null;

  @ApiProperty({ 
    description: 'Contact phone number for the estate', 
    example: '+61 2 1234 5678',
    required: false,
    nullable: true
  })
  phone: string | null;

  @ApiProperty({ 
    description: 'Primary theme color for the estate branding', 
    example: '#1E40AF',
    required: false,
    nullable: true
  })
  themeColor: string | null;

  @ApiProperty({ 
    description: 'Timestamp when the estate was created', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Timestamp when the estate was last updated', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  updatedAt: Date;
}
