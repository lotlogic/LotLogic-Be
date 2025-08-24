import { Module } from '@nestjs/common';
import { EstateController } from '@modules/estate/estate.controller';
import { EstateService } from '@modules/estate/estate.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EstateController],
  providers: [EstateService],
})
export class EstateModule {}
