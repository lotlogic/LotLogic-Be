/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/await-thenable */
import { Injectable } from '@nestjs/common';
import { DesignOnLotStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface HouseDesignFilterResult   {
    id: string,
    title: string,
    area: number,
    homeSize?: string | null,
    builderId?: string,
    builderName?: string | null,
    builder?: {
        id?: string,
        name?: string | null,
        logoUrl?: string | null,
        brandingBgColor?: string | null,
        brandingTextColor?: string | null,
    } | null,
    width: number,
    depth: number,
    image: string,
    images: Images[] | [],
    bedrooms: number,
    bathrooms: number,
    cars: number,
    isFavorite: boolean,
    floorPlanImage: string | null
}

export interface Images   {
    facadeId?: string,
    src: string,
    faced: string
}

@Injectable()
export class FloorPlanService {
    constructor(private prisma: PrismaService) {}

    private mapHouseDesignResult(house: any): HouseDesignFilterResult {
        const images = house.facades?.map((facade: any) => {
            return {
                facadeId: facade.id?.toString?.() ?? facade.id,
                src: facade.imageUrl,
                faced: facade.label
            };
        }) || [];

        return {
            id: house.id.toString(),
            title: house.name,
            area: house.areaSqm,
            homeSize: house.homeSize ?? null,
            builderId: house.builderId ? house.builderId.toString() : undefined,
            builderName: house.builder?.name ?? null,
            builder: house.builder
                ? {
                    id: house.builder.id?.toString?.() ?? house.builder.id,
                    name: house.builder.name ?? null,
                    logoUrl: house.builder.logoUrl ?? null,
                    brandingBgColor: house.builder.brandingBgColor ?? null,
                    brandingTextColor: house.builder.brandingTextColor ?? null,
                }
                : null,
            width: house.width,
            depth: house.depth,
            image: house.facades && house.facades.length > 0 ? house.facades[0].imageUrl : "",
            images,
            bedrooms: house.bedrooms,
            bathrooms: house.bathrooms,
            cars: house.garages,
            isFavorite: false,
            floorPlanImage: house.floorplanUrl
        };
    }

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
        if (width !== undefined) whereClause.width = { lt: width };
        if (depth !== undefined) whereClause.depth = { lt: depth };

        const houseDesigns = await this.prisma.floorPlan.findMany({
            where: whereClause,
            include: {
                facades: true,
                builder: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                        brandingBgColor: true,
                        brandingTextColor: true,
                    }
                }
            }
        }) as any;
        const filteredDesign = houseDesigns.map((house: any) =>
            this.mapHouseDesignResult(house)
        );
        return filteredDesign;
    }

    async getPrecomputedHouseDesignsForLot(
        lotId: bigint,
        bedroom?: number[],
        bathroom?: number[],
        car?: number[],
        min_size?: number,
        max_size?: number,
        rumpus?: boolean,
        alfresco?: boolean,
        pergola?: boolean
    ): Promise<HouseDesignFilterResult[]> {
        const floorPlanWhere: Prisma.floorPlanWhereInput = {};
        if (bedroom !== undefined) floorPlanWhere.bedrooms = { in: bedroom };
        if (bathroom !== undefined) floorPlanWhere.bathrooms = { in: bathroom };
        if (car !== undefined) floorPlanWhere.garages = { in: car };
        if (rumpus !== undefined) floorPlanWhere.rumpus = rumpus;
        if (alfresco !== undefined) floorPlanWhere.alfresco = alfresco;
        if (pergola !== undefined) floorPlanWhere.pergola = pergola;
        if (min_size !== undefined || max_size !== undefined) {
            const areaFilter: Prisma.FloatFilter = {};
            if (min_size !== undefined) {
                areaFilter.gte = min_size;
            }
            if (max_size !== undefined) {
                areaFilter.lte = max_size;
            }
            floorPlanWhere.areaSqm = areaFilter;
        }

        const rows = await this.prisma.designOnLot.findMany({
            where: {
                lotId,
                isCompatible: true,
                status: DesignOnLotStatus.PASS,
                floorPlan: floorPlanWhere,
            },
            include: {
                floorPlan: {
                    include: {
                        facades: true,
                        builder: {
                            select: {
                                id: true,
                                name: true,
                                logoUrl: true,
                                brandingBgColor: true,
                                brandingTextColor: true,
                            }
                        }
                    },
                },
            },
            orderBy: { floorPlanId: 'asc' },
        });

        return rows.map((row) => this.mapHouseDesignResult(row.floorPlan as any));
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

