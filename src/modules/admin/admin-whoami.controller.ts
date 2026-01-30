import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { AllowUnregistered } from '@/modules/auth/decorators/allow-unregistered.decorator';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/whoami')
export class AdminWhoamiController {
  @Get()
  @Roles('ADMIN', 'USER')
  @AllowUnregistered()
  get(@Req() req: AuthenticatedRequest) {
    const registered = req.auth?.registered !== false;
    return {
      registered,
      id: registered ? req.auth?.id?.toString() : null,
      externalAuthId: req.auth?.externalAuthId,
      email: req.auth?.email,
      displayName: req.auth?.displayName,
      role: req.auth?.role,
    };
  }
}
