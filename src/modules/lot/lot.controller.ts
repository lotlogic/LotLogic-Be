import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LotService } from '@modules/lot/lot.service';

@ApiTags('lot')
@Controller('lot')
export class LotController {
  constructor(private readonly lotService: LotService) {}

  @Get()
  @ApiOperation({ summary: 'Get all lots', description: 'Retrieve a list of all available lots' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved all lots' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll() {
    return await this.lotService.findAllLots();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lot by ID', description: 'Retrieve a specific lot by its unique identifier' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the lot', type: 'string' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved the lot' })
  @ApiResponse({ status: 404, description: 'Lot not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string) {
    return await this.lotService.findLot(parseInt(id));
  }
}
