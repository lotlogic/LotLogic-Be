import { Controller, Get, Query } from '@nestjs/common';
import { DesignOnLotService, DesignOnLotResult } from './design-on-lot.service';

@Controller('design-on-lot')
export class DesignOnLotController {
    constructor(private readonly designOnLotService: DesignOnLotService) { }

    @Get('calculate')
    async calculate(@Query('lotId') lotId: string): Promise<DesignOnLotResult> {
        return await this.designOnLotService.calculateCompatibility(lotId);
    }
}
