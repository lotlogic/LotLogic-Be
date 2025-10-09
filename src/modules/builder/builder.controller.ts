import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BuilderService } from '@modules/builder/builder.service';
import { Prisma } from '@prisma/client';

@ApiTags('builder')
@Controller('builders')
export class BuilderController {
  constructor(private readonly builderService: BuilderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new builder', description: 'Add a new builder to the system' })
  @ApiResponse({ status: 200, description: 'Builder successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() createBuilderDto: Prisma.builderCreateInput) {
    return await this.builderService.create(createBuilderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all builders', description: 'Retrieve a list of all registered builders' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved all builders' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll() {
    return await this.builderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get builder by ID', description: 'Retrieve details of a specific builder by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the builder', type: 'string' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved builder' })
  @ApiResponse({ status: 404, description: 'Builder not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string) {
    return await this.builderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a builder', description: 'Modify the details of an existing builder' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the builder', type: 'string' })
  @ApiResponse({ status: 200, description: 'Builder successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Builder not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(@Param('id') id: string, @Body() updateBuilderDto: Prisma.builderUpdateInput) {
    return await this.builderService.update(id, updateBuilderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a builder', description: 'Remove a builder from the system by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier of the builder', type: 'string' })
  @ApiResponse({ status: 200, description: 'Builder successfully deleted' })
  @ApiResponse({ status: 404, description: 'Builder not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async remove(@Param('id') id: string) {
    return await this.builderService.remove(id);
  }
}
