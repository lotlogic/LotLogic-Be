import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import { AdminAuditLogService } from '@/modules/admin/admin-audit-log.service';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/audit-log')
export class AdminAuditLogController {
  constructor(private readonly auditLogService: AdminAuditLogService) {}

  @Get()
  @Roles('ADMIN')
  async list(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('actionType') actionType?: string,
    @Query('resourceType') resourceType?: string,
    @Query('search') search?: string,
  ) {
    return this.auditLogService.list({
      from,
      to,
      page: page ? Number.parseInt(page, 10) : undefined,
      pageSize: pageSize ? Number.parseInt(pageSize, 10) : undefined,
      actionType,
      resourceType,
      search,
    });
  }

  @Post('login')
  @Roles('ADMIN', 'USER')
  async trackLogin(@Req() req: AuthenticatedRequest) {
    await this.auditLogService.trackLogin(req);
    return { message: 'Login audit event recorded' };
  }
}
