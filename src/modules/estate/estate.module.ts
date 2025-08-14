import { Module } from '@nestjs/common';
import { EstateController } from './estate.controller';
import { EstateService } from './estate.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EstateController],
  providers: [EstateService],
})
export class EstateModule {}
