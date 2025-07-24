import { PrismaService } from '../../prisma/prisma.service';
interface DesignOnLotMatch {
    houseDesignId: string;
    floorplanUrl: string | null;
    spacing: {
        front: number | null;
        rear: number | null;
        side: number | null;
    };
    maxCoverageArea: number;
    houseArea: number;
    lotDimensions: {
        width?: number;
        depth?: number;
    };
}
export interface DesignOnLotResult {
    lotId: string;
    zoning: string;
    matches: DesignOnLotMatch[];
}
export declare class DesignOnLotService {
    private prisma;
    constructor(prisma: PrismaService);
    calculateCompatibility(lotId: string): Promise<DesignOnLotResult>;
    checkFit(lot: {
        geojson?: unknown;
        areaSqm: number;
    }, zoningRule: {
        minSideSetback_m?: number | null;
        minFrontSetback_m?: number | null;
        minRearSetback_m?: number | null;
        minFSR?: number | null;
    }, design: {
        minLotWidth: number;
        minLotDepth: number;
        areaSqm: number;
    }): boolean;
}
export {};
