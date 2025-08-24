import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class FacadeService {
    constructor(private prisma: PrismaService) {}

    async findFacade(facadeId: string) {
        return this.prisma.facade.findUnique({
        where: {
            id: BigInt(facadeId)
        }
        });
    }
}
