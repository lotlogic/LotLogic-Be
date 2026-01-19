import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
  Query,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { GoogleSheetsService } from '@modules/google-sheets/google-sheets.service';
import { DashboardReportService } from '@modules/google-sheets/dashboard-report.service';

@Controller('google-sheets')
export class GoogleSheetsController {
  private readonly logger = new Logger(GoogleSheetsController.name);

  constructor(
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly dashboardReportService: DashboardReportService,
  ) {}

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

  @Post('dashboard-trigger')
  @UseInterceptors(AnyFilesInterceptor({ limits: { files: 0 } }))
  async dashboardTrigger(
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-secret') webhookSecret?: string,
    @Query('secret') querySecret?: string,
  ) {
    const expectedSecret = process.env.GOOGLE_SHEETS_WEB_APP_SECRET;
    if (!expectedSecret) {
      throw new InternalServerErrorException(
        'Missing env var GOOGLE_SHEETS_WEB_APP_SECRET',
      );
    }

    const providedSecret =
      querySecret ||
      webhookSecret ||
      (typeof body?.secret === 'string' ? body.secret : '');

    if (providedSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Expected JSON body');
    }

    const rowNumberRaw =
      (body['Row Number'] ??
        body.rowNumber ??
        (body as { row_number?: unknown }).row_number) as unknown;
    const rowNumber =
      typeof rowNumberRaw === 'number'
        ? rowNumberRaw
        : Number.parseInt(String(rowNumberRaw || '').trim(), 10);

    if (!Number.isFinite(rowNumber) || rowNumber < 1) {
      throw new BadRequestException('Missing/invalid Row Number');
    }

    this.logger.log(`Dashboard trigger accepted (row=${rowNumber})`);

    setImmediate(() => {
      void this.dashboardReportService
        .processDashboardTrigger(body)
        .catch(() => undefined);
    });

    return true;
  }
}
