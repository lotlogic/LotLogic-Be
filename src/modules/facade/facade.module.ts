import { Module } from '@nestjs/common';
import { FacadeController } from './facade.controller';
import { FacadeService } from './facade.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FacadeController],
  providers: [FacadeService],
})
export class FacadeModule {}
