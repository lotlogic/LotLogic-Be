import { PrismaService } from 'src/prisma/prisma.service';
export declare class LotService {
    private prisma;
    constructor(prisma: PrismaService);
    createLot(data: {
        blockKey: string;
        geojson: object;
        estateId?: string;
    }): Promise<number>;
}
