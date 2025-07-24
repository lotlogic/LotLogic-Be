import { DesignOnLotService, DesignOnLotResult } from './design-on-lot.service';
export declare class DesignOnLotController {
    private readonly designOnLotService;
    constructor(designOnLotService: DesignOnLotService);
    calculate(lotId: string): Promise<DesignOnLotResult>;
}
