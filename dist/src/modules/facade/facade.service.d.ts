import { PrismaService } from '../../prisma/prisma.service';
export declare class FacadeService {
    private prisma;
    constructor(prisma: PrismaService);
    findFacade(facadeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        houseDesignId: string;
        label: string;
        imageUrl: string;
    } | null>;
}
