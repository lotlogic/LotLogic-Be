import { Controller, Get, Param } from '@nestjs/common';
import { EstateService } from '@modules/estate/estate.service';

@Controller('estate')
export class EstateController {
  constructor(private readonly estateService: EstateService) {}

  @Get()
  async findAll() {
    return await this.estateService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.estateService.findOne(BigInt(id));
  }
}
