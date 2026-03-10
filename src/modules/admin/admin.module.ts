import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AdminEstateController } from '@/modules/admin/admin-estate.controller';
import { AdminLotController } from '@/modules/admin/admin-lot.controller';
import { AdminZoningRuleController } from '@/modules/admin/admin-zoning-rule.controller';
import { AdminLotZoningRuleController } from '@/modules/admin/admin-lot-zoning-rule.controller';
import { AdminFloorPlanController } from '@/modules/admin/admin-floor-plan.controller';
import { AdminFloorPlanFacadeController } from '@/modules/admin/admin-floor-plan-facade.controller';
import { AdminFacadeController } from '@/modules/admin/admin-facade.controller';
import { AdminDesignOnLotController } from '@/modules/admin/admin-design-on-lot.controller';
import { AdminBuilderController } from '@/modules/admin/admin-builder.controller';
import { AdminBrandSettingController } from '@/modules/admin/admin-brand-setting.controller';
import { AdminUserController } from '@/modules/admin/admin-user.controller';
import { AdminWhoamiController } from '@/modules/admin/admin-whoami.controller';
import { AdminInvitationsController } from '@/modules/admin/admin-invitations.controller';
import { AdminEntraGraphService } from '@/modules/admin/admin-entra-graph.service';
import { AdminLotImportService } from '@/modules/admin/admin-lot-import.service';
import { AdminUploadController } from '@/modules/admin/admin-upload.controller';
import { AdminUploadService } from '@/modules/admin/admin-upload.service';
import { DesignOnLotModule } from '@/modules/design-on-lot/design-on-lot.module';
import { AdminStateRuleSetController } from '@/modules/admin/admin-state-rule-set.controller';
import { AdminEstateRuleSetController } from '@/modules/admin/admin-estate-rule-set.controller';
import { AdminEstateLotConstraintController } from '@/modules/admin/admin-estate-lot-constraint.controller';
import { AdminBuilderEstateApprovalController } from '@/modules/admin/admin-builder-estate-approval.controller';
import { MailModule } from '@/modules/mail/mail.module';
import { AdminAuditLogController } from '@/modules/admin/admin-audit-log.controller';
import { AdminAuditLogService } from '@/modules/admin/admin-audit-log.service';
import { AdminAuditLogInterceptor } from '@/modules/admin/admin-audit-log.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [PrismaModule, AuthModule, DesignOnLotModule, MailModule],
  controllers: [
    AdminEstateController,
    AdminLotController,
    AdminZoningRuleController,
    AdminLotZoningRuleController,
    AdminFloorPlanController,
    AdminFloorPlanFacadeController,
    AdminFacadeController,
    AdminDesignOnLotController,
    AdminBuilderController,
    AdminBrandSettingController,
    AdminUserController,
    AdminWhoamiController,
    AdminInvitationsController,
    AdminUploadController,
    AdminStateRuleSetController,
    AdminEstateRuleSetController,
    AdminEstateLotConstraintController,
    AdminBuilderEstateApprovalController,
    AdminAuditLogController,
  ],
  providers: [
    AdminEntraGraphService,
    AdminLotImportService,
    AdminUploadService,
    AdminAuditLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AdminAuditLogInterceptor,
    },
  ],
})
export class AdminModule {}
