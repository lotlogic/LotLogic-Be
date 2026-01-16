import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Get,
  Post,
  Query,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { GoogleSheetsService } from '@modules/google-sheets/google-sheets.service';

@Controller('google-sheets')
export class GoogleSheetsController {
  constructor(private readonly googleSheetsService: GoogleSheetsService) { }

  @Get('ping')
  async ping(@Headers('x-webhook-secret') webhookSecret?: string) {
    const inboundSecret = process.env.GOOGLE_SHEETS_INBOUND_WEBHOOK_SECRET;
    if (inboundSecret && webhookSecret !== inboundSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    return this.googleSheetsService.pingGoogleSheetsWebhook();
  }

  @Post('append')
  @UseInterceptors(AnyFilesInterceptor({ limits: { files: 0 } }))
  async appendFormPost(
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-secret') webhookSecret?: string,
  ) {
    const inboundSecret = process.env.GOOGLE_SHEETS_INBOUND_WEBHOOK_SECRET;
    if (inboundSecret && webhookSecret !== inboundSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Expected form fields in request body');
    }

    if (Object.keys(body).length === 0) {
      throw new BadRequestException('Empty form body');
    }

    const result = await this.googleSheetsService.forwardToGoogleSheetsWebhook(
      body,
    );
    return { ok: true, result };
  }
}
