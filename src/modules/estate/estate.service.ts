import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EstateAccessStatus } from '@prisma/client';
import { verifyEstateAccessPassword } from '@modules/estate/estate-access.util';

@Injectable()
export class EstateService {
  constructor(private prisma: PrismaService) {}

  private readonly publicEstateSelect = {
    id: true,
    name: true,
    isPrototype: true,
    status: true,
    jurisdiction: true,
    createdAt: true,
    updatedAt: true,
    address: true,
    email: true,
    logoUrl: true,
    backgroundImageUrl: true,
    backgroundImageNorth: true,
    backgroundImageSouth: true,
    backgroundImageEast: true,
    backgroundImageWest: true,
    phone: true,
    brandGuid: true,
  } as const;

  async findAll() {
    return this.prisma.estate.findMany({
      select: this.publicEstateSelect,
    });
  }

  async findOne(id: bigint) {
    return this.prisma.estate.findUnique({
      where: { id },
      select: this.publicEstateSelect,
    });
  }

  async getAccess(id: bigint) {
    const estate = await this.prisma.estate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        accessPasswordHash: true,
      },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    return {
      id: estate.id,
      name: estate.name,
      status: estate.status,
      requiresPassword: estate.status === EstateAccessStatus.GATED,
    };
  }

  async validateAccess(id: bigint, password: string) {
    const estate = await this.prisma.estate.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        accessPasswordHash: true,
      },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    if (estate.status !== EstateAccessStatus.GATED) {
      return { valid: true };
    }

    if (!verifyEstateAccessPassword(password, estate.accessPasswordHash)) {
      throw new UnauthorizedException('Invalid estate password');
    }

    return { valid: true };
  }
}
