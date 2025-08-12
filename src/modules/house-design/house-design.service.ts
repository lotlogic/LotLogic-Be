/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/await-thenable */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
export class HouseDesignService {
    constructor(private prisma: PrismaService) {}

    async getFilteredHouseDesigns(
        bedroom: number[],
        bathroom: number[],
        car: number[],
        min_size?: number,
        max_size?: number,
        rumpus?: boolean,
        alfresco?: boolean,
        pergola?: boolean
    ): Promise<HouseDesignFilterResult[]> {
        const whereClause: any = {
            bedrooms: {
                in: bedroom
            },
            bathrooms: {
                in: bathroom
            },
            garages: {
                in: car
            }
        };

        // Add optional filters only if they are provided
        if (rumpus !== undefined) whereClause.rumpus = rumpus;
        if (alfresco !== undefined) whereClause.alfresco = alfresco;
        if (pergola !== undefined) whereClause.pergola = pergola;
        if (min_size !== undefined || max_size !== undefined) {
            whereClause.areaSqm = {};
            if (min_size !== undefined) whereClause.areaSqm.gte = min_size;
            if (max_size !== undefined) whereClause.areaSqm.lte = max_size;
        }

        const houseDesigns = await this.prisma.houseDesign.findMany({
            where: whereClause,
            include: {
                facades: true
            }
        }) as any;
        const filteredDesign = houseDesigns.map((house: any) => {
            const images = house.facades?.map((facade: any) => {
                return {
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
        return await this.prisma.houseDesign.findUnique({
            where: {
                id: BigInt(house_design_id)
            },
            include: {
                facades: true
            }
        });
    }
}
