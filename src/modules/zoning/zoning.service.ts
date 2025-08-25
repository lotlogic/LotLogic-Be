import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ZoningService {
    constructor(private prisma: PrismaService) {}

    async getFilteredHouseDesigns(zoning: string) {
        // Extract zone code from full zoning string (e.g., "RZ2: Low Density Residential" -> "RZ2")
        const zoneCode = zoning.split(':')[0]?.trim();
        
        return this.prisma.zoningRule.findUnique({
            where: {
                code: zoneCode
            }
        });
    }
}
