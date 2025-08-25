import { Module } from '@nestjs/common';
import { FacadeController } from '@modules/facade/facade.controller';
import { FacadeService } from '@modules/facade/facade.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FacadeController],
  providers: [FacadeService],
})
export class FacadeModule {}
