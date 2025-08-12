import { Controller, Get, Param, Query } from '@nestjs/common';
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
        @Param('lot_id') lot_id: string,
        @Query('bedroom') bedroom: string,
        @Query('bathroom') bathroom: string,
        @Query('car') car: string,
        @Query('min_size') min_size?: string,
        @Query('max_size') max_size?: string,
        @Query('rumpus') rumpus?: string,
        @Query('alfresco') alfresco?: string,
        @Query('pergola') pergola?: string
    ) : Promise<HouseDesignFilterResult[] | []> {
        const bedroomArray = JSON.parse(bedroom || '[]');
        const bathroomArray = JSON.parse(bathroom || '[]');
        const carArray = JSON.parse(car || '[]');
        const minSize = min_size ? parseInt(min_size) : undefined;
        const maxSize = max_size ? parseInt(max_size) : undefined;
        const rumpusBool = rumpus === 'true' ? true : rumpus === 'false' ? false : undefined;
        const alfrescoBool = alfresco === 'true' ? true : alfresco === 'false' ? false : undefined;
        const pergolaBool = pergola === 'true' ? true : pergola === 'false' ? false : undefined;
        
        const houseDesigns = await this.houseDesignService.getFilteredHouseDesigns(
            bedroomArray,
            bathroomArray,
            carArray,
            minSize,
            maxSize,
            rumpusBool,
            alfrescoBool,
            pergolaBool
        );
        const lotDetail  = await this.lotService.findLot(parseInt(lot_id));
        const zoningDetail = await this.zoningService.getFilteredHouseDesigns(lotDetail ? lotDetail.zoning : "");
        if(lotDetail && zoningDetail) {
            // For now, use a default build area 
            const defaultBuildArea = 1000; // Default build area in sqm
            return houseDesigns.filter(design => design.area <= defaultBuildArea);
            // const buildArea = (lotDetail.geojson) ? (lotDetail.geojson['properties'].width - (zoningDetail.minFrontSetback_m || 0) - (zoningDetail.minRearSetback_m || 0)) * (lotDetail.geojson['properties'].depth - (2 * (zoningDetail.minSideSetback_m || 0))) : 0;
            // return houseDesigns.filter(design => design.area <= buildArea)
        }
        return [];
    }
}
