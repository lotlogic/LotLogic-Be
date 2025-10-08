import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ 
    description: 'Email subject line', 
    example: 'Lot Overview for Builder Selection' 
  })
  subject: string;

  @ApiProperty({ 
    description: 'Email template name to use', 
    example: 'builder-selection-email' 
  })
  template: string;

  @ApiProperty({ 
    description: 'Context data for the email template', 
    example: {
      builderName: 'Hamilton Homes',
      lotNumber: 'Lot 42',
      lotAddress: '123 Hamilton Road, Mitchell ACT 2911',
      lotSize: '450',
      lotZoning: 'Residential',
      lotStatus: 'Available',
      imageUrl: 'https://example.com/floorplans/hamilton-4bed.png'
    }
  })
  context: {
    builderName: string;
    lotNumber: string;
    lotAddress: string;
    lotSize: string;
    lotZoning: string;
    lotStatus: string;
    imageUrl: string;
  };

  @ApiProperty({ 
    description: 'Comma-separated list of recipient email addresses', 
    example: 'builder1@example.com,builder2@example.com' 
  })
  emailsList: string;
}

export class SendEmailResponseDto {
  @ApiProperty({ 
    description: 'Whether the email was sent successfully', 
    example: true 
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Message about the email operation', 
    example: 'Mail sent successfully' 
  })
  message: string;

  @ApiProperty({ 
    description: 'Number of recipients the email was sent to', 
    example: 2 
  })
  recipientsCount: number;

  @ApiProperty({ 
    description: 'Timestamp when the email was sent', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  sentAt: Date;
}

export class EmailTemplateDto {
  @ApiProperty({ 
    description: 'Template name/identifier', 
    example: 'builder-selection-email' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Template description', 
    example: 'Email template for builder selection process' 
  })
  description: string;

  @ApiProperty({ 
    description: 'Available template variables', 
    example: ['builderName', 'lotNumber', 'lotAddress', 'lotSize', 'lotZoning', 'lotStatus', 'imageUrl'],
    type: [String]
  })
  variables: string[];

  @ApiProperty({ 
    description: 'Template file path', 
    example: 'templates/builder-selection-email.pug' 
  })
  filePath: string;
}

export class EmailTemplateListResponseDto {
  @ApiProperty({ 
    description: 'Array of available email templates', 
    type: [EmailTemplateDto] 
  })
  templates: EmailTemplateDto[];

  @ApiProperty({ 
    description: 'Total number of templates', 
    example: 5 
  })
  total: number;
}

export class EmailHistoryDto {
  @ApiProperty({ 
    description: 'Unique identifier for the email record', 
    example: '1234567890123456789',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Email subject line', 
    example: 'Lot Overview for Builder Selection' 
  })
  subject: string;

  @ApiProperty({ 
    description: 'Email template used', 
    example: 'builder-selection-email' 
  })
  template: string;

  @ApiProperty({ 
    description: 'Recipient email addresses', 
    example: 'builder1@example.com,builder2@example.com' 
  })
  recipients: string;

  @ApiProperty({ 
    description: 'Whether the email was sent successfully', 
    example: true 
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Error message if email failed', 
    example: 'SMTP connection timeout',
    required: false
  })
  errorMessage?: string;

  @ApiProperty({ 
    description: 'Timestamp when the email was sent', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  sentAt: Date;
}

export class EmailHistoryListResponseDto {
  @ApiProperty({ 
    description: 'Array of email history records', 
    type: [EmailHistoryDto] 
  })
  emails: EmailHistoryDto[];

  @ApiProperty({ 
    description: 'Total number of email records', 
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

export class EmailHistorySearchQueryDto {
  @ApiProperty({ 
    description: 'Search by email subject or template', 
    example: 'builder selection',
    required: false
  })
  search?: string;

  @ApiProperty({ 
    description: 'Filter by email template', 
    example: 'builder-selection-email',
    required: false
  })
  template?: string;

  @ApiProperty({ 
    description: 'Filter by success status', 
    example: true,
    required: false
  })
  success?: boolean;

  @ApiProperty({ 
    description: 'Filter by recipient email', 
    example: 'builder@example.com',
    required: false
  })
  recipient?: string;

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
