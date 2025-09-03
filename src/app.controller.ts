import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from '@/app.service';
import { HealthResponseDto, RootResponseDto } from './app.dto';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get API root information', 
    description: 'Returns welcome message, API version, and available endpoints' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved API root information',
    type: RootResponseDto
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getRoot(): RootResponseDto {
    return this.appService.getHealth();
  }

  @Get("health")
  @ApiOperation({ 
    summary: 'Get application health status', 
    description: 'Returns comprehensive health information including system status, database connection, memory usage, and CPU information' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved health status',
    type: HealthResponseDto
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getHealth(): HealthResponseDto {
    return this.appService.getHealth();
  }
}
