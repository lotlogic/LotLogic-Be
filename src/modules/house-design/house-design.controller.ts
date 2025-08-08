import { Controller, Get, Param, Body } from '@nestjs/common';
import { HouseDesignService, HouseDesignFilterResult } from './house-design.service';
import { LotService } from '../lot/lot.service';
import { ZoningService } from '../zoning/zoning.service';

@Controller('house-design')
export class HouseDesignController {
    constructor(
        private readonly houseDesignService: HouseDesignService,
        private readonly lotService: LotService,
        private readonly zoningService: ZoningService
    ) { }

    @Get(":lot_id")
    async filterHouseDesign(
        @Param('lot_id') lot_id: number,
        @Body('bedroom') bedroom: number[],
        @Body('bathroom') bathroom: number[],
        @Body('car') car: number[],
        @Body('min_size') min_size: number,
        @Body('max_size') max_size: number,
        @Body('rumpus') rumpus: boolean,
        @Body('alfresco') alfresco: boolean,
        @Body('pergola') pergola: boolean
    ) : Promise<HouseDesignFilterResult[] | []> {
        const houseDesigns = await this.houseDesignService.getFilteredHouseDesigns(
            bedroom,
            bathroom,
            car,
            min_size,
            max_size,
            rumpus,
            alfresco,
            pergola
        );
        const lotDetail  = await this.lotService.findLot(lot_id);
        const zoningDetail = await this.zoningService.getFilteredHouseDesigns(lotDetail ? lotDetail.zoning : "");
        if(lotDetail && zoningDetail) {
            
            const buildArea = (lotDetail.geojson) ? (lotDetail.geojson['properties'].width - (zoningDetail.minFrontSetback_m || 0) - (zoningDetail.minRearSetback_m || 0)) * (lotDetail.geojson['properties'].depth - (2 * (zoningDetail.minSideSetback_m || 0))) : 0;
            return houseDesigns.filter(design => design.area <= buildArea)
        }
        return [];
    }
}
