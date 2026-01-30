import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EasyAuthGuard } from '@/modules/auth/guards/easy-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import {
  AdminUploadRequest,
  AdminUploadService,
} from '@/modules/admin/admin-upload.service';

@UseGuards(EasyAuthGuard, RolesGuard)
@Controller('admin/uploads')
export class AdminUploadController {
  constructor(private readonly uploadService: AdminUploadService) {}

  @Post()
  @Roles('ADMIN')
  async createUpload(@Body() body: AdminUploadRequest) {
    return this.uploadService.createUploadUrl(body);
  }
}
