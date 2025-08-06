import { PrismaService } from '../../prisma/prisma.service';
export interface HouseDesignFilterResult {
    id: string;
    title: string;
    area: number;
    image: string;
    images: Images[] | [];
    bedrooms: number;
    bathrooms: number;
    cars: number;
    isFavorite: boolean;
    floorPlanImage: string | null;
}
export interface Images {
    src: string;
    faced: string;
}
export declare class HouseDesignService {
    private prisma;
    constructor(prisma: PrismaService);
    getFilteredHouseDesigns(bedroom: number[], bathroom: number[], car: number[], min_size: number, max_size: number, rumpus: boolean, alfresco: boolean, pergola: boolean): Promise<HouseDesignFilterResult[]>;
    getHouseDesignById(house_design_id: string): Promise<{
        id: string;
        name: string;
        floorplanUrl: string | null;
        bedrooms: number;
        bathrooms: number;
        garages: number;
        areaSqm: number;
        minLotWidth: number;
        minLotDepth: number;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
