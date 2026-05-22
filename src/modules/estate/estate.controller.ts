import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EstateService } from '@modules/estate/estate.service';

@Controller('estate')
export class EstateController {
  constructor(private readonly estateService: EstateService) {}

  @Get()
  async findAll() {
    return await this.estateService.findAll();
  }

  @Get(':id/access')
  async getAccess(@Param('id') id: string) {
    return await this.estateService.getAccess(BigInt(id));
  }

  @Post(':id/access/validate')
  async validateAccess(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return await this.estateService.validateAccess(BigInt(id), password);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.estateService.findOne(BigInt(id));
  }
}
