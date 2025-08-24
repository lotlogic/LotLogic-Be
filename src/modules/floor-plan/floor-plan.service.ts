/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/await-thenable */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface HouseDesignFilterResult   {
    id: string,
    title: string,
    area: number,
    image: string,
    images: Images[] | [],
    bedrooms: number,
    bathrooms: number,
    cars: number,
    isFavorite: boolean,
    floorPlanImage: string | null
}

export interface Images   {
    src: string,
    faced: string
}

@Injectable()
export class FloorPlanService {
    constructor(private prisma: PrismaService) {}

    async getFilteredHouseDesigns(
        bedroom?: number[],
        bathroom?: number[],
        car?: number[],
        min_size?: number,
        max_size?: number,
        rumpus?: boolean,
        alfresco?: boolean,
        pergola?: boolean,
        depth?: number | null,
        width?: number | null
    ): Promise<HouseDesignFilterResult[]> {
        const whereClause: any = { };

        // Add optional filters only if they are provided
        if (bedroom !== undefined) whereClause.bedrooms = { in: bedroom };
        if (bathroom !== undefined) whereClause.bathrooms = { in: bathroom };
        if (car !== undefined) whereClause.garages = { in: car };
        if (rumpus !== undefined) whereClause.rumpus = rumpus;
        if (alfresco !== undefined) whereClause.alfresco = alfresco;
        if (pergola !== undefined) whereClause.pergola = pergola;
        if (min_size !== undefined || max_size !== undefined) {
            whereClause.areaSqm = {};
            if (min_size !== undefined) whereClause.areaSqm = { gte: min_size };
            if (max_size !== undefined) whereClause.areaSqm = { lte: max_size };
        }
        if (width !== undefined) whereClause.minLotWidth = {lt: width };
        if (depth !== undefined) whereClause.minLotDepth = {lt: depth };

        const houseDesigns = await this.prisma.floorPlan.findMany({
            where: whereClause,
            include: {
                facades: true
            }
        }) as any;
        const filteredDesign = houseDesigns.map((house: any) => {
            const images = house.facades?.map((facade: any) => {
                return {
                    facadeId: facade.id,
                    src: facade.imageUrl,
                    faced: facade.label
                };
            }) || [];
            return {
                id: house.id.toString(),
                title: house.name,
                area: house.areaSqm,
                image: house.facades && house.facades.length > 0 ? house.facades[0].imageUrl : "",
                images,
                bedrooms: house.bedrooms,
                bathrooms: house.bathrooms,
                cars: house.garages,
                isFavorite: false,
                floorPlanImage: house.floorplanUrl
            };
        });
        return filteredDesign;
    }

    async getHouseDesignById(house_design_id: string) {
        return await this.prisma.floorPlan.findUnique({
            where: {
                id: BigInt(house_design_id)
            },
            include: {
                facades: true
            }
        });
    }
}
