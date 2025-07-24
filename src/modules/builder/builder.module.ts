import { Module } from '@nestjs/common';
import { BuilderService } from './builder.service';
import { BuilderController } from './builder.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BuilderService],
  controllers: [BuilderController],
  exports: [BuilderService],
})
export class BuilderModule {} 