import { Controller, Get, Param } from '@nestjs/common';
import { LotService } from './lot.service';

@Controller('lot')
export class LotController {
  constructor(private readonly lotService: LotService) {}

  @Get()
  async findAll() {
    return await this.lotService.findAllLots();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.lotService.findLot(id);
  }
}
