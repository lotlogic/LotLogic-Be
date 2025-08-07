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
        min_size: number,
        max_size: number,
        rumpus: boolean,
        alfresco: boolean,
        pergola: boolean
    ): Promise<HouseDesignFilterResult[]> {
        const houseDesigns = await this.prisma.houseDesign.findMany({
            where: {
                rumpus,
                alfresco,
                pergola,
                bedrooms: {
                    in: bedroom
                },
                bathrooms: {
                    in: bathroom
                },
                garages: {
                    in: car
                },
                areaSqm: {
                    gte: min_size,
                    lte: max_size
                }
            },
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
                id: house.id,
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
                id: house_design_id
            },
            include: {
                facades: true
            }
        }) as any;
    }
}
