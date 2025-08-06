import { PrismaService } from 'src/prisma/prisma.service';
export declare class ZoningService {
    private prisma;
    constructor(prisma: PrismaService);
    getFilteredHouseDesigns(zoning: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isOverlay: boolean;
        code: string;
        type: string;
        maxBuildingHeight_m: number | null;
        maxStoreys: number | null;
        minLotArea_sqm: number | null;
        minLotWidth_m: number | null;
        minLotDepth_m: number | null;
        minFrontageStandard_m: number | null;
        minFrontageCorner_m: number | null;
        minFSR: number | null;
        maxFSR: number | null;
        minFrontSetback_m: number | null;
        minRearSetback_m: number | null;
        minSideSetback_m: number | null;
        appliesToZones: string[];
    } | null>;
}
