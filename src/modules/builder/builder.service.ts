import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BuilderService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.builderCreateInput) {
    return await this.prisma.builder.create({ data });
  }

  async findAll() {
    return await this.prisma.builder.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.builder.findUnique({ where: { id: BigInt(id) } });
  }

  async update(id: string, data: Prisma.builderUpdateInput) {
    return await this.prisma.builder.update({ where: { id: BigInt(id) }, data });
  }

  async remove(id: string) {
    return await this.prisma.builder.delete({ where: { id: BigInt(id) } });
  }

    async findByIds(filter: string[]) {
    return await this.prisma.builder.findMany({
      where: {
        id: {
          in: filter.map(id => BigInt(id))
        }
      }
    });
  }
} 