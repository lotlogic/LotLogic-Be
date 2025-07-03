import { Module } from '@nestjs/common';
import { FacadeController } from './facade.controller';
import { FacadeService } from './facade.service';

@Module({
  controllers: [FacadeController],
  providers: [FacadeService],
})
export class FacadeModule {}
