import { Module } from '@nestjs/common';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { EstateScopeGuard } from '@/modules/auth/guards/estate-scope.guard';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EasyAuthGuard, RolesGuard, EstateScopeGuard],
  exports: [EasyAuthGuard, RolesGuard, EstateScopeGuard],
})
export class AuthModule {}
