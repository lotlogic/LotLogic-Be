import { PrismaService } from 'src/prisma/prisma.service';
export declare class LotService {
    private prisma;
    constructor(prisma: PrismaService);
    createLot(data: {
        blockKey: string;
        geojson: object;
        estateId?: string;
    }): Promise<number>;
    findLot(lotId: string): Promise<{
        id: string;
        blockKey: string;
        blockNumber: number | null;
        sectionNumber: number | null;
        areaSqm: number;
        zoning: string;
        address: string | null;
        district: string | null;
        division: string | null;
        lifecycleStage: string | null;
        geojson: import("@prisma/client/runtime/library").JsonValue | null;
        estateId: string | null;
        createdAt: Date;
        updatedAt: Date;
        overlays: string[];
    } | null>;
}
