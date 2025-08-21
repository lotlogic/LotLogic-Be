import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BrandService {
    constructor(private prisma: PrismaService) {}

    async findBrand(domain: string) {
        return await this.prisma.brand.findUnique({
            where: {
                domain: domain
            }
        });
    }

    async addBrand(body: {
        name: string,
        title: string,
        domain: string,
        logoUrl: string,
        primaryColor: string | null,
        secondaryColor: string | null,
        bgPrimaryColor: string | null,
        bgSecondaryColor: string | null,
        textPrimaryColor: string | null,
        textSecondaryColor: string | null,
        fontFamilyPrimary: string | null,
        fontFamilySecondary: string | null
    }) {
        return await this.prisma.brand.create({
            data: body
        });
    }
}
