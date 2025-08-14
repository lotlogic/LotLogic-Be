import { Controller, Get, Param, Query } from '@nestjs/common';
import { HouseDesignService } from './house-design.service';
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
        @Query('bedroom') bedroom?: string,
        @Query('bathroom') bathroom?: string,
        @Query('car') car?: string,
        @Query('min_size') min_size?: string,
        @Query('max_size') max_size?: string,
        @Query('rumpus') rumpus?: string,
        @Query('alfresco') alfresco?: string,
        @Query('pergola') pergola?: string
    ) {
        // Parse bedroom, bathroom, car arrays - handle both JSON strings and comma-separated values
        const parseArrayParam = (param: string): number[] => {
            if (!param) return [];
            try {
                // Try to parse as JSON first
                const parsed = JSON.parse(param);
                return Array.isArray(parsed) ? parsed.filter(val => typeof val === 'number') : [];
            } catch {
                // If JSON parsing fails, try comma-separated values
                return param.split(',').map(val => parseInt(val.trim())).filter(val => !isNaN(val));
            }
        };

        const bedroomArray = bedroom ? parseArrayParam(bedroom): undefined;
        const bathroomArray = bathroom ? parseArrayParam(bathroom): undefined;
        const carArray = car ? parseArrayParam(car): undefined;
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
        const lotDetail = await this.lotService.findLot(parseInt(lot_id));
        const zoningDetail = await this.zoningService.getFilteredHouseDesigns(lotDetail ? lotDetail.zoning.split(":")[0] : "");
        
        // Always return the actual zoning data if available, even if some fields are null
        if (lotDetail && zoningDetail) {
            const maxBuildArea = zoningDetail.maxFSR ? zoningDetail.maxFSR * lotDetail.areaSqm : 300;
            const designs = houseDesigns.filter(design => design.area <= maxBuildArea);
            
            return {
                houseDesigns: designs,
                zoning: {
                    fsr: maxBuildArea,
                    frontSetback: zoningDetail?.minFrontSetback_m ,
                    rearSetback: zoningDetail?.minRearSetback_m ,
                    sideSetback: zoningDetail?.minSideSetback_m 
                }
            };
        }
        
        // Return empty result with default zoning only when lot or zoning data is completely missing
        return {
            houseDesigns: [],
            zoning: {
                // fsr: 300,
                // frontSetback: 4,
                // rearSetback: 3,
                // sideSetback: 3
            }
        };
    }
}
