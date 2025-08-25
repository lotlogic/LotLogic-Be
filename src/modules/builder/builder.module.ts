import { Module } from '@nestjs/common';
import { BuilderService } from '@modules/builder/builder.service';
import { BuilderController } from '@modules/builder/builder.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BuilderService],
  controllers: [BuilderController],
  exports: [BuilderService],
})
export class BuilderModule {} 