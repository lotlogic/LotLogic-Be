import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ZoningService {
    constructor(private prisma: PrismaService) {}

    async getFilteredHouseDesigns(zoning: string) {
        return this.prisma.zoningRule.findUnique({
            where: {
                code: zoning
            }
        });
    }
}
