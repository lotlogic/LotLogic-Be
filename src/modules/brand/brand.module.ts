import { Module } from '@nestjs/common';
import { BrandService } from '@modules/brand/brand.service';
import { BrandController } from '@modules/brand/brand.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BrandService],
  controllers: [BrandController]
})
export class BrandModule {}
