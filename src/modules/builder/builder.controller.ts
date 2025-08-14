import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BuilderService } from './builder.service';
import { Prisma } from '@prisma/client';

@Controller('builders')
export class BuilderController {
  constructor(private readonly builderService: BuilderService) {}

  @Post()
  create(@Body() createBuilderDto: Prisma.builderCreateInput) {
    return this.builderService.create(createBuilderDto);
  }

  @Get()
  findAll() {
    return this.builderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.builderService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBuilderDto: Prisma.builderUpdateInput) {
    return this.builderService.update(id, updateBuilderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.builderService.remove(id);
  }
} 