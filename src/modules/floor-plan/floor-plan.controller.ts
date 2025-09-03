import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FloorPlanService } from '@modules/floor-plan/floor-plan.service';
import { LotService } from '@modules/lot/lot.service';
import { ZoningService } from '@modules/zoning/zoning.service';
import { reorderPolygonByFrontage } from '@/helper/polygonReorder';
import { getWidthHeight, insetQuadPerSideLL } from '@/helper/turf';
import { 
  HouseDesignFilterQueryDto, 
  HouseDesignFilterResponseDto 
} from './floor-plan.dto';

@ApiTags('floor-plan')
@Controller('house-design')
export class FloorPlanController {
    constructor(
        private readonly FloorPlanService: FloorPlanService,
        private readonly lotService: LotService,
        private readonly zoningService: ZoningService
    ) { }

    @Get(":lot_id")
    @ApiOperation({ 
        summary: 'Filter house designs for a specific lot', 
        description: 'Get filtered house designs based on lot specifications, zoning rules, and customer preferences including bedrooms, bathrooms, garages, area, and special features' 
    })
    @ApiParam({ 
        name: 'lot_id', 
        description: 'The unique identifier of the lot to filter designs for', 
        example: '1234567890123456789',
        type: 'string'
    })
    @ApiQuery({ 
        name: 'bedroom', 
        description: 'Filter by number of bedrooms (comma-separated or JSON array)', 
        example: '3,4,5',
        required: false,
        type: 'string'
    })
    @ApiQuery({ 
        name: 'bathroom', 
        description: 'Filter by number of bathrooms (comma-separated or JSON array)', 
        example: '2,3',
        required: false,
        type: 'string'
    })
    @ApiQuery({ 
        name: 'car', 
        description: 'Filter by number of garage spaces (comma-separated or JSON array)', 
        example: '1,2',
        required: false,
        type: 'string'
    })
    @ApiQuery({ 
        name: 'min_size', 
        description: 'Minimum floor area in square meters', 
        example: '200',
        required: false,
        type: 'string'
    })
    @ApiQuery({ 
        name: 'max_size', 
        description: 'Maximum floor area in square meters', 
        example: '300',
        required: false,
        type: 'string'
    })
    @ApiQuery({ 
        name: 'rumpus', 
        description: 'Filter by rumpus room availability', 
        example: 'true',
        required: false,
        type: 'string'
    })
    @ApiQuery({ 
        name: 'alfresco', 
        description: 'Filter by alfresco area availability', 
        example: 'true',
        required: false,
        type: 'string'
    })
    @ApiQuery({ 
        name: 'pergola', 
        description: 'Filter by pergola availability', 
        example: 'false',
        required: false,
        type: 'string'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Successfully retrieved filtered house designs with zoning information',
        type: HouseDesignFilterResponseDto
    })
    @ApiResponse({ status: 400, description: 'Bad request - invalid lot ID or parameters' })
    @ApiResponse({ status: 404, description: 'Lot not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
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
        const lotDetail = await this.lotService.findLot(parseInt(lot_id));

        const bedroomArray = bedroom ? parseArrayParam(bedroom): undefined;
        const bathroomArray = bathroom ? parseArrayParam(bathroom): undefined;
        const carArray = car ? parseArrayParam(car): undefined;
        const minSize = min_size ? parseInt(min_size) : undefined;
        const maxSize = max_size ? parseInt(max_size) : undefined;
        const rumpusBool = rumpus === 'true' ? true : rumpus === 'false' ? false : undefined;
        const alfrescoBool = alfresco === 'true' ? true : alfresco === 'false' ? false : undefined;
        const pergolaBool = pergola === 'true' ? true : pergola === 'false' ? false : undefined;
        
        const houseDesigns = await this.FloorPlanService.getFilteredHouseDesigns(
            bedroomArray,
            bathroomArray,
            carArray,
            minSize,
            maxSize,
            rumpusBool,
            alfrescoBool,
            pergolaBool,
            (lotDetail?.geojson as any)?.width ?? null,
            (lotDetail?.geojson as any)?.depth ?? null,
        );
        const zoningDetail = await this.zoningService.getFilteredHouseDesigns(lotDetail ? lotDetail.zoning.split(":")[0] : "");
        const geometry = JSON.parse(lotDetail.geometry).coordinates;
        const frontageCoordinate = JSON.parse(lotDetail?.frontageCoordinate).coordinates;
        const reOrdered = reorderPolygonByFrontage(geometry[0], frontageCoordinate[0]);
        
        if (lotDetail && zoningDetail) {
            const innerLL = insetQuadPerSideLL(reOrdered, {
                front: zoningDetail?.minFrontSetback_m || 0,
                side: zoningDetail?.minSideSetback_m || 0,
                rear: zoningDetail?.minRearSetback_m || 0
            }) || [];
            const { width, height } = getWidthHeight(innerLL);
            const maxBuildArea = zoningDetail.maxFSR ? zoningDetail.maxFSR * lotDetail.areaSqm : 300;
            const designs = houseDesigns.filter(design => (design.area <= maxBuildArea && design.minLotWidth <= width && design.minLotDepth <= height));
            
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
        
        return {
            houseDesigns: [],
            zoning: {}
        };
    }
}
