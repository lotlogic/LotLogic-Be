import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AdminEstateController } from '@/modules/admin/admin-estate.controller';
import { AdminLotController } from '@/modules/admin/admin-lot.controller';
import { AdminZoningRuleController } from '@/modules/admin/admin-zoning-rule.controller';
import { AdminLotZoningRuleController } from '@/modules/admin/admin-lot-zoning-rule.controller';
import { AdminFloorPlanController } from '@/modules/admin/admin-floor-plan.controller';
import { AdminFacadeController } from '@/modules/admin/admin-facade.controller';
import { AdminDesignOnLotController } from '@/modules/admin/admin-design-on-lot.controller';
import { AdminBuilderController } from '@/modules/admin/admin-builder.controller';
import { AdminBrandSettingController } from '@/modules/admin/admin-brand-setting.controller';
import { AdminUserController } from '@/modules/admin/admin-user.controller';
import { AdminWhoamiController } from '@/modules/admin/admin-whoami.controller';
import { AdminInvitationsController } from '@/modules/admin/admin-invitations.controller';
import { AdminEntraGraphService } from '@/modules/admin/admin-entra-graph.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    AdminEstateController,
    AdminLotController,
    AdminZoningRuleController,
    AdminLotZoningRuleController,
    AdminFloorPlanController,
    AdminFacadeController,
    AdminDesignOnLotController,
    AdminBuilderController,
    AdminBrandSettingController,
    AdminUserController,
    AdminWhoamiController,
    AdminInvitationsController,
  ],
  providers: [AdminEntraGraphService],
})
export class AdminModule {}
