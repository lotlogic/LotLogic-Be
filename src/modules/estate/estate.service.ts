import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EstateService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const estates = await this.prisma.estate.findMany();
    return estates.map(estate => ({
      ...estate,
      id: estate.id.toString()
    }));
  }

  async findOne(id: bigint) {
    const estate = await this.prisma.estate.findUnique({ where: { id } });
    if (estate) {
      return {
        ...estate,
        id: estate.id.toString()
      };
    }
    return estate;
  }
}
