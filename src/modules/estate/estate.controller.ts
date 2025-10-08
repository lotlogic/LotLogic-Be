import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EstateService } from '@modules/estate/estate.service';
import { EstateResponseDto } from './estate.dto';

@ApiTags('estate')
@Controller('estate')
export class EstateController {
  constructor(private readonly estateService: EstateService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all estates', 
    description: 'Retrieve a list of all available estates with their configuration and styling' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved all estates',
    type: [EstateResponseDto]
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll() {
    return await this.estateService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get estate by ID', 
    description: 'Retrieve a specific estate by its unique identifier with full configuration details' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'The unique identifier of the estate', 
    example: '1234567890123456789',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved the estate',
    type: EstateResponseDto
  })
  @ApiResponse({ status: 404, description: 'Estate not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string) {
    return await this.estateService.findOne(BigInt(id));
  }
}
