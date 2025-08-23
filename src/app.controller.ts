import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return this.appService.getHealth();
  }

  @Get("health")
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('floorplans/:filename')
    serveFloorplan(@Param('filename') filename: string, @Res() res: Response) {
    const imagePath = join(__dirname, '..', '..', 'public', 'floorplans', filename);
    res.set('Access-Control-Allow-Origin', '*');
    res.sendFile(imagePath);
  }
}
