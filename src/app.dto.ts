import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ 
    description: 'Application status', 
    example: 'ok' 
  })
  status: string;

  @ApiProperty({ 
    description: 'Current timestamp', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  timestamp: string;

  @ApiProperty({ 
    description: 'Service name', 
    example: 'LotLogic Backend' 
  })
  service: string;

  @ApiProperty({ 
    description: 'Application version', 
    example: '1.0.0' 
  })
  version: string;
}

export class RootResponseDto {
  @ApiProperty({ 
    description: 'Application status', 
    example: 'ok' 
  })
  status: string;

  @ApiProperty({ 
    description: 'Current timestamp', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  timestamp: string;

  @ApiProperty({ 
    description: 'Service name', 
    example: 'LotLogic Backend' 
  })
  service: string;

  @ApiProperty({ 
    description: 'Application version', 
    example: '1.0.0' 
  })
  version: string;
}
