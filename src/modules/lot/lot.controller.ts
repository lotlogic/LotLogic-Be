import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { LotService } from '@modules/lot/lot.service';

@Controller('lot')
export class LotController {
  constructor(private readonly lotService: LotService) {}

  @Get()
  async findAll(@Query('estateId') estateId?: string) {
    const trimmedEstateId = String(estateId || '').trim();
    if (!trimmedEstateId) {
      return await this.lotService.findAllLots();
    }

    try {
      return await this.lotService.findAllLots(BigInt(trimmedEstateId));
    } catch {
      throw new BadRequestException('estateId must be a numeric id');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.lotService.findLot(parseInt(id));
  }
}
