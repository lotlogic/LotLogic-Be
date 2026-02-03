import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { AllowUnregistered } from '@/modules/auth/decorators/allow-unregistered.decorator';
import { PrismaService } from '@/prisma/prisma.service';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/whoami')
export class AdminWhoamiController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'USER')
  @AllowUnregistered()
  async get(@Req() req: AuthenticatedRequest) {
    const registered = req.auth?.registered !== false;
    let status: string | null = null;
    let builderIds: string[] = [];
    let estateIds: string[] = [];

    if (registered && req.auth?.id) {
      const user = await this.prisma.user.findUnique({
        where: { id: req.auth.id },
        select: {
          status: true,
          builderUsers: {
            select: { builderId: true },
            orderBy: { builderId: 'asc' },
          },
          estates: {
            select: { estateId: true },
            orderBy: { estateId: 'asc' },
          },
        },
      });

      status = user?.status ?? null;
      builderIds = user?.builderUsers.map((item) => item.builderId.toString()) ?? [];
      estateIds = user?.estates.map((item) => item.estateId.toString()) ?? [];
    }

    return {
      registered,
      id: registered ? req.auth?.id?.toString() : null,
      externalAuthId: req.auth?.externalAuthId,
      email: req.auth?.email,
      displayName: req.auth?.displayName,
      role: req.auth?.role,
      status,
      builderIds,
      estateIds,
    };
  }
}
