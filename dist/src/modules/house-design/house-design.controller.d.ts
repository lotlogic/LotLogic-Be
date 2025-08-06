import { HouseDesignService, HouseDesignFilterResult } from './house-design.service';
import { LotService } from '../lot/lot.service';
import { ZoningService } from '../zoning/zoning.service';
export declare class HouseDesignController {
    private readonly houseDesignService;
    private readonly lotService;
    private readonly zoningService;
    constructor(houseDesignService: HouseDesignService, lotService: LotService, zoningService: ZoningService);
    filterHouseDesign(lot_id: string, bedroom: number[], bathroom: number[], car: number[], min_size: number, max_size: number, rumpus: boolean, alfresco: boolean, pergola: boolean): Promise<HouseDesignFilterResult[] | []>;
}
