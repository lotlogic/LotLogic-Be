import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  Query,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { DashboardReportService } from '@modules/monday/dashboard-report.service';
import { MondayService } from '@modules/monday/monday.service';
import { randomUUID } from 'crypto';

@Controller('monday')
export class MondayController {
  private readonly logger = new Logger(MondayController.name);

  constructor(
    private readonly mondayService: MondayService,
    private readonly dashboardReportService: DashboardReportService,
  ) {}

  @Post('dashboard-trigger')
  @UseInterceptors(AnyFilesInterceptor({ limits: { files: 0 } }))
  async dashboardTrigger(
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-secret') webhookSecret?: string,
    @Query('secret') querySecret?: string,
  ) {
    if (typeof body?.challenge === 'string') {
      return { challenge: body.challenge };
    }

    const requestId = randomUUID();
    this.verifyWebhookSecret(requestId, body, webhookSecret, querySecret);

    const itemId = this.mondayService.extractItemIdFromWebhookPayload(body);
    if (!itemId) {
      throw new BadRequestException('Missing monday item id');
    }

    const payload = await this.mondayService.getNormalizedPaidReportPayload(
      itemId,
    );

    setImmediate(() => {
      void this.dashboardReportService.processDashboardTrigger(payload);
    });

    return { ok: true, itemId };
  }

  @Post('dashboard-delivery')
  @UseInterceptors(AnyFilesInterceptor({ limits: { files: 0 } }))
  async dashboardDelivery(
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-secret') webhookSecret?: string,
    @Query('secret') querySecret?: string,
  ) {
    if (typeof body?.challenge === 'string') {
      return { challenge: body.challenge };
    }

    const requestId = randomUUID();
    this.verifyWebhookSecret(requestId, body, webhookSecret, querySecret);

    const itemId = this.mondayService.extractItemIdFromWebhookPayload(body);
    if (!itemId) {
      throw new BadRequestException('Missing monday item id');
    }

    const payload = await this.mondayService.getNormalizedPaidReportPayload(
      itemId,
    );

    const pdfUrl = String(payload['Final PDF link'] || '').trim();
    const clientEmail = String(payload['Client email'] || '').trim();
    const emailOverride = String(
      process.env.MONDAY_DELIVERY_EMAIL_OVERRIDE || '',
    ).trim();

    if (!pdfUrl) {
      throw new BadRequestException('Missing Final PDF link');
    }

    if (!clientEmail && !emailOverride) {
      throw new BadRequestException(
        'Missing Client email (and MONDAY_DELIVERY_EMAIL_OVERRIDE is not set)',
      );
    }

    setImmediate(() => {
      void this.dashboardReportService.processDashboardDelivery(payload);
    });

    return { ok: true, itemId };
  }

  private verifyWebhookSecret(
    requestId: string,
    body: Record<string, unknown>,
    webhookSecret?: string,
    querySecret?: string,
  ) {
    const expectedSecret = String(process.env.MONDAY_WEBHOOK_SECRET || '').trim();
    if (!expectedSecret) {
      return;
    }

    const providedSecret =
      querySecret ||
      webhookSecret ||
      (typeof body?.secret === 'string' ? body.secret : '');

    if (!providedSecret) {
      this.logger.warn(
        `Monday webhook rejected (requestId=${requestId}): Missing webhook secret`,
      );
      throw new UnauthorizedException('Missing webhook secret');
    }

    if (providedSecret !== expectedSecret) {
      this.logger.warn(
        `Monday webhook rejected (requestId=${requestId}): Invalid webhook secret`,
      );
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }
}
