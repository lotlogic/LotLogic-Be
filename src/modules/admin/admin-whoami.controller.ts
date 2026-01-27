import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/whoami')
export class AdminWhoamiController {
  @Get()
  @Roles('ADMIN', 'EDITOR')
  get(@Req() req: AuthenticatedRequest) {
    return {
      id: req.auth?.id?.toString(),
      externalAuthId: req.auth?.externalAuthId,
      email: req.auth?.email,
      displayName: req.auth?.displayName,
      role: req.auth?.role,
    };
  }
}
