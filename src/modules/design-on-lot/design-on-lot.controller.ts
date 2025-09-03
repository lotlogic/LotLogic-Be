import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DesignOnLotService, DesignOnLotResult } from '@modules/design-on-lot/design-on-lot.service';
import { DesignOnLotQueryDto } from './design-on-lot.dto';

@ApiTags('design-on-lot')
@Controller('design-on-lot')
export class DesignOnLotController {
    constructor(private readonly designOnLotService: DesignOnLotService) { }

    @Get('calculate')
    @ApiOperation({ 
        summary: 'Calculate design compatibility for a lot', 
        description: 'Calculate the compatibility between a specific lot and available house designs, considering zoning rules, lot dimensions, and design requirements' 
    })
    @ApiQuery({ 
        name: 'lotId', 
        description: 'The unique identifier of the lot to calculate compatibility for', 
        example: '1234567890123456789',
        type: 'string'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Successfully calculated design compatibility',
        schema: {
            type: 'object',
            properties: {
                lotId: { type: 'string', example: '1234567890123456789' },
                zoning: { type: 'string', example: 'RZ2' },
                matches: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            floorPlanId: { type: 'string', example: '1234567890123456789' },
                            floorplanUrl: { type: 'string', example: 'https://example.com/floorplan.png', nullable: true },
                            spacing: {
                                type: 'object',
                                properties: {
                                    front: { type: 'number', example: 6.0, nullable: true },
                                    rear: { type: 'number', example: 3.0, nullable: true },
                                    side: { type: 'number', example: 1.5, nullable: true }
                                }
                            },
                            maxCoverageArea: { type: 'number', example: 225.0 },
                            houseArea: { type: 'number', example: 245.5 },
                            lotDimensions: {
                                type: 'object',
                                properties: {
                                    width: { type: 'number', example: 18.5, nullable: true },
                                    depth: { type: 'number', example: 32.0, nullable: true }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad request - invalid lot ID' })
    @ApiResponse({ status: 404, description: 'Lot not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async calculate(@Query() query: DesignOnLotQueryDto): Promise<DesignOnLotResult> {
        return await this.designOnLotService.calculateCompatibility(query.lotId);
    }
}
