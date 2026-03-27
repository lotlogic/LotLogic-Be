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
import { randomUUID } from 'crypto';

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

    const result =
      await this.googleSheetsService.forwardToGoogleSheetsWebhook(body);
    return { ok: true, result };
  }

  @Post('dashboard-trigger')
  @UseInterceptors(AnyFilesInterceptor({ limits: { files: 0 } }))
  async dashboardTrigger(
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-secret') webhookSecret?: string,
    @Query('secret') querySecret?: string,
  ) {
    const requestId = randomUUID();
    const startedAt = Date.now();
    const bodyKeys =
      body && typeof body === 'object' && !Array.isArray(body)
        ? Object.keys(body)
        : [];

    this.logger.log(
      `Dashboard trigger received (requestId=${requestId} contentType=${
        Array.isArray(body) ? 'array' : typeof body
      } keys=${bodyKeys.length} hasHeaderSecret=${Boolean(webhookSecret)} hasQuerySecret=${Boolean(
        querySecret,
      )})`,
    );

    const expectedSecret = process.env.GOOGLE_SHEETS_WEB_APP_SECRET;
    if (!expectedSecret) {
      this.logger.error(
        `Dashboard trigger rejected (requestId=${requestId}): Missing env var GOOGLE_SHEETS_WEB_APP_SECRET`,
      );
      throw new InternalServerErrorException(
        'Missing env var GOOGLE_SHEETS_WEB_APP_SECRET',
      );
    }

    const providedSecret =
      querySecret ||
      webhookSecret ||
      (typeof body?.secret === 'string' ? body.secret : '');

    if (providedSecret !== expectedSecret) {
      this.logger.warn(
        `Dashboard trigger rejected (requestId=${requestId}): Invalid webhook secret`,
      );
      throw new UnauthorizedException('Invalid webhook secret');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      this.logger.warn(
        `Dashboard trigger rejected (requestId=${requestId}): Expected JSON body`,
      );
      throw new BadRequestException('Expected JSON body');
    }

    const rowNumberRaw = (body['Row Number'] ??
      body.rowNumber ??
      (body as { row_number?: unknown }).row_number) as unknown;
    const rowNumber =
      typeof rowNumberRaw === 'number'
        ? rowNumberRaw
        : Number.parseInt(String(rowNumberRaw || '').trim(), 10);

    if (!Number.isFinite(rowNumber) || rowNumber < 1) {
      this.logger.warn(
        `Dashboard trigger rejected (requestId=${requestId}): Missing/invalid Row Number`,
      );
      throw new BadRequestException('Missing/invalid Row Number');
    }

    const reportIdRaw = (body['Report ID'] ?? body.reportId) as unknown;
    const reportId = String(reportIdRaw || '').trim();

    this.logger.log(
      `Dashboard trigger accepted (requestId=${requestId} row=${rowNumber}${
        reportId ? ` reportId=${reportId}` : ''
      })`,
    );

    const fieldsSnapshot = {
      zone: body['Zone'],
      blockSizeM2: body['Block size (m²)'],
      frontageM: body['Frontage (m)'],
      housePosition: body['House position'],
      rearYardDepthM: body['Rear yard depth (m)'],
      rearYardCategory: body['Rear yard category'],
      grannyFlatKeepHouse: body['Granny flat (keep house)'],
      dualOccRemoveHouse: body['Dual occ (remove house)'],
      subdivisionPotential: body['Subdivision potential'],
      intention: body['Intention'],
      keysCount: Object.keys(body).length,
    };

    this.logger.log(
      `Dashboard trigger fields snapshot (requestId=${requestId} row=${rowNumber}${
        reportId ? ` reportId=${reportId}` : ''
      }): ${JSON.stringify(fieldsSnapshot)}`,
    );

    setImmediate(() => {
      const jobStartedAt = Date.now();
      this.logger.log(
        `Dashboard trigger job started (requestId=${requestId} row=${rowNumber}${
          reportId ? ` reportId=${reportId}` : ''
        })`,
      );

      void this.dashboardReportService
        .processDashboardTrigger(body)
        .then(() => {
          this.logger.log(
            `Dashboard trigger job finished (requestId=${requestId} row=${rowNumber}${
              reportId ? ` reportId=${reportId}` : ''
            } jobMs=${Date.now() - jobStartedAt} totalMs=${
              Date.now() - startedAt
            })`,
          );
        })
        .catch((error) => {
          const stack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Dashboard trigger job threw (requestId=${requestId} row=${rowNumber}${
              reportId ? ` reportId=${reportId}` : ''
            } jobMs=${Date.now() - jobStartedAt} totalMs=${
              Date.now() - startedAt
            }): ${error instanceof Error ? error.message : String(error)}`,
            stack,
          );
        });
    });

    return true;
  }

  @Post('dashboard-delivery')
  @UseInterceptors(AnyFilesInterceptor({ limits: { files: 0 } }))
  async dashboardDelivery(
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-secret') webhookSecret?: string,
    @Query('secret') querySecret?: string,
  ) {
    const requestId = randomUUID();
    const startedAt = Date.now();

    const expectedSecret = process.env.GOOGLE_SHEETS_WEB_APP_SECRET;
    if (!expectedSecret) {
      this.logger.error(
        `Dashboard delivery rejected (requestId=${requestId}): Missing env var GOOGLE_SHEETS_WEB_APP_SECRET`,
      );
      throw new InternalServerErrorException(
        'Missing env var GOOGLE_SHEETS_WEB_APP_SECRET',
      );
    }

    const providedSecret =
      querySecret ||
      webhookSecret ||
      (typeof body?.secret === 'string' ? body.secret : '');

    if (providedSecret !== expectedSecret) {
      this.logger.warn(
        `Dashboard delivery rejected (requestId=${requestId}): Invalid webhook secret`,
      );
      throw new UnauthorizedException('Invalid webhook secret');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      this.logger.warn(
        `Dashboard delivery rejected (requestId=${requestId}): Expected JSON body`,
      );
      throw new BadRequestException('Expected JSON body');
    }

    const rowNumberRaw = (body['Row Number'] ??
      body.rowNumber ??
      (body as { row_number?: unknown }).row_number) as unknown;
    const rowNumber =
      typeof rowNumberRaw === 'number'
        ? rowNumberRaw
        : Number.parseInt(String(rowNumberRaw || '').trim(), 10);

    if (!Number.isFinite(rowNumber) || rowNumber < 1) {
      this.logger.warn(
        `Dashboard delivery rejected (requestId=${requestId}): Missing/invalid Row Number`,
      );
      throw new BadRequestException('Missing/invalid Row Number');
    }

    const reportIdRaw = (body['Report ID'] ?? body.reportId) as unknown;
    const reportId = String(reportIdRaw || '').trim();

    const pdfUrlRaw = (body['Final PDF link'] ?? body.finalPdfLink) as unknown;
    const pdfUrl = String(pdfUrlRaw || '').trim();

    const clientEmailRaw = (body['Client email'] ??
      body.clientEmail) as unknown;
    const clientEmail = String(clientEmailRaw || '').trim();

    const emailOverride = String(
      process.env.GOOGLE_SHEETS_DELIVERY_EMAIL_OVERRIDE || '',
    ).trim();

    if (!pdfUrl) {
      this.logger.warn(
        `Dashboard delivery rejected (requestId=${requestId} row=${rowNumber}${
          reportId ? ` reportId=${reportId}` : ''
        }): Missing Final PDF link`,
      );
      throw new BadRequestException('Missing Final PDF link');
    }
    if (!clientEmail && !emailOverride) {
      this.logger.warn(
        `Dashboard delivery rejected (requestId=${requestId} row=${rowNumber}${
          reportId ? ` reportId=${reportId}` : ''
        }): Missing Client email (and GOOGLE_SHEETS_DELIVERY_EMAIL_OVERRIDE is not set)`,
      );
      throw new BadRequestException(
        'Missing Client email (and GOOGLE_SHEETS_DELIVERY_EMAIL_OVERRIDE is not set)',
      );
    }

    this.logger.log(
      `Dashboard delivery accepted (requestId=${requestId} row=${rowNumber}${
        reportId ? ` reportId=${reportId}` : ''
      })`,
    );

    const deliverySnapshot = {
      deliveryStatus: body['Delivery status'],
      deliveryDate: body['Delivery date'],
      finalPdfLinkPresent: Boolean(pdfUrl),
      clientEmailPresent: Boolean(clientEmail),
      emailOverrideEnabled: Boolean(emailOverride),
      keysCount: Object.keys(body).length,
    };

    this.logger.log(
      `Dashboard delivery fields snapshot (requestId=${requestId} row=${rowNumber}${
        reportId ? ` reportId=${reportId}` : ''
      }): ${JSON.stringify(deliverySnapshot)}`,
    );

    setImmediate(() => {
      const jobStartedAt = Date.now();

      this.logger.log(
        `Dashboard delivery job started (requestId=${requestId} row=${rowNumber}${
          reportId ? ` reportId=${reportId}` : ''
        })`,
      );

      void this.dashboardReportService
        .processDashboardDelivery(body)
        .then((ok) => {
          this.logger.log(
            `Dashboard delivery job finished (requestId=${requestId} row=${rowNumber}${
              reportId ? ` reportId=${reportId}` : ''
            } ok=${ok} jobMs=${Date.now() - jobStartedAt} totalMs=${
              Date.now() - startedAt
            })`,
          );
        })
        .catch((error) => {
          const stack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Dashboard delivery job threw (requestId=${requestId} row=${rowNumber}${
              reportId ? ` reportId=${reportId}` : ''
            } jobMs=${Date.now() - jobStartedAt} totalMs=${
              Date.now() - startedAt
            }): ${error instanceof Error ? error.message : String(error)}`,
            stack,
          );
        });
    });

    return true;
  }
}
