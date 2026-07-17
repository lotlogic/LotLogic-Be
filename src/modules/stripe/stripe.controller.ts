import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpException,
  InternalServerErrorException,
  Logger,
  Post,
  RawBody,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { MondayService } from '@modules/monday/monday.service';
import {
  isBlockplannerPaidProductCode,
  isBlockplannerSourceApp,
  type BlockplannerPaidProductCode,
  type BlockplannerSourceApp,
} from '@modules/blockplanner/blockplanner-product';
import { StripeService, type StripeCheckoutMode } from './stripe.service';

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly mondayService: MondayService,
  ) {}

  private isStripeWebhookDebugEnabled(): boolean {
    const raw = String(process.env.STRIPE_WEBHOOK_DEBUG || '').trim();
    if (!raw) return false;
    return ['1', 'true', 'yes', 'y', 'on'].includes(raw.toLowerCase());
  }

  private isStripeWebhookPayloadLoggingEnabled(): boolean {
    const raw = String(process.env.STRIPE_WEBHOOK_LOG_PAYLOAD || '').trim();
    if (!raw) return false;
    return ['1', 'true', 'yes', 'y', 'on'].includes(raw.toLowerCase());
  }

  private summarizeStripeSignatureHeader(signatureHeader: string): {
    headerLength: number;
    timestamp?: number;
    v1Count: number;
    v1Last6?: string;
  } {
    const parts = signatureHeader.split(',').map((p) => p.trim());
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const timestampRaw = timestampPart?.slice(2);
    const timestamp = timestampRaw ? Number.parseInt(timestampRaw, 10) : NaN;

    const v1Parts = parts.filter((p) => p.startsWith('v1='));
    const v1 = v1Parts[0]?.slice(3) || '';

    return {
      headerLength: signatureHeader.length,
      timestamp: Number.isFinite(timestamp) ? timestamp : undefined,
      v1Count: v1Parts.length,
      v1Last6: v1.length >= 6 ? v1.slice(-6) : undefined,
    };
  }

  private maskEmail(email: string): string {
    const trimmed = String(email || '').trim();
    if (!trimmed) return '';
    const atIndex = trimmed.indexOf('@');
    if (atIndex < 1) return '***';
    const local = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);
    const localMasked = local.length <= 1 ? '*' : `${local[0]}***`;
    return `${localMasked}@${domain}`;
  }

  private last4(value: string): string {
    const digits = String(value || '')
      .replace(/\D+/g, '')
      .trim();
    if (!digits) return '';
    return digits.length <= 4 ? digits : digits.slice(-4);
  }

  private summarizeReportRequestPayload(payload: Record<string, unknown>): {
    keysCount: number;
    presentKeys: string[];
    emptyKeys: string[];
    reportId?: string;
    stripePaymentId?: string;
    intention?: string;
    clientEmailMasked?: string;
    clientPhoneLast4?: string;
    hasAddress: boolean;
  } {
    const keys = Object.keys(payload);
    const presentKeys: string[] = [];
    const emptyKeys: string[] = [];

    for (const key of keys) {
      const value = payload[key];
      const normalized =
        typeof value === 'string' ? value.trim() : String(value ?? '').trim();
      if (normalized) presentKeys.push(key);
      else emptyKeys.push(key);
    }

    const reportIdRaw = payload.reportId;
    const stripePaymentIdRaw = payload.stripePaymentId;
    const intentionRaw = payload.intention;
    const clientEmailRaw = payload.clientEmail;
    const clientPhoneRaw = payload.clientPhone;
    const addressRaw = payload.address;

    const reportId = typeof reportIdRaw === 'string' ? reportIdRaw.trim() : '';
    const stripePaymentId =
      typeof stripePaymentIdRaw === 'string' ? stripePaymentIdRaw.trim() : '';
    const intention =
      typeof intentionRaw === 'string' ? intentionRaw.trim() : '';
    const clientEmail =
      typeof clientEmailRaw === 'string' ? clientEmailRaw.trim() : '';
    const clientPhone =
      typeof clientPhoneRaw === 'string' ? clientPhoneRaw.trim() : '';

    return {
      keysCount: keys.length,
      presentKeys,
      emptyKeys,
      reportId: reportId || undefined,
      stripePaymentId: stripePaymentId || undefined,
      intention: intention || undefined,
      clientEmailMasked: clientEmail ? this.maskEmail(clientEmail) : undefined,
      clientPhoneLast4: clientPhone ? this.last4(clientPhone) : undefined,
      hasAddress: Boolean(
        typeof addressRaw === 'string' ? addressRaw.trim() : addressRaw,
      ),
    };
  }

  private serializeError(error: unknown): {
    name?: string;
    message?: string;
    stack?: string;
    status?: number;
    response?: unknown;
  } {
    if (error instanceof HttpException) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        status: error.getStatus(),
        response: error.getResponse(),
      };
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return { message: String(error) };
  }

  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body()
    body: {
      site: string;
      cancelUrl?: string;
      checkoutMode?: string;
      productCode?: string;
      sourceApp?: string;
      intention?: string;

      // Backwards-compatible alias
      email?: string;

      clientName?: string;
      clientEmail?: string;
      clientPhone?: string;
      address?: string;
      suburb?: string;
      blockSizeM2?: string | number;
      zone?: string;
    },
  ): Promise<{ url: string | null }> {
    const site = String(body.site || '').trim();
    if (!site) {
      throw new BadRequestException('Missing site');
    }

    const sourceApp = this.parseSourceApp(body.sourceApp, site);
    const productCode = this.parseProductCode(body.productCode);
    const checkoutSite = this.resolveCheckoutSite(sourceApp, site);
    if (!this.mondayService.isPaidProductConfigured(productCode)) {
      throw new InternalServerErrorException(
        `Fulfillment is not configured for product ${productCode}`,
      );
    }

    const clientEmail = String(body.clientEmail || body.email || '').trim();
    if (!clientEmail) {
      throw new BadRequestException('Missing clientEmail');
    }

    const address = String(body.address || '').trim();
    if (!address) {
      throw new BadRequestException('Missing address');
    }

    const cancelUrl = this.resolveCheckoutCancelUrl(
      checkoutSite,
      body.cancelUrl,
    );
    const checkoutMode = this.resolveCheckoutMode(sourceApp, body.checkoutMode);

    const reportId = this.stripeService.generateReportId();

    const sessionUrl = await this.stripeService.createCheckoutSession({
      customerEmail: clientEmail,
      site: checkoutSite,
      cancelUrl,
      checkoutMode,
      productCode,
      sourceApp,
      intention: String(body.intention || '').trim(),
      metadata: {
        reportId,
        clientName: String(body.clientName || '').trim(),
        clientEmail,
        clientPhone: String(body.clientPhone || '').trim(),
        address,
        suburb: String(body.suburb || '').trim(),
        blockSizeM2: body.blockSizeM2,
        zone: String(body.zone || '').trim(),
      },
    });

    return { url: sessionUrl };
  }

  private parseCheckoutMode(value: unknown): StripeCheckoutMode {
    const mode = String(value || 'live')
      .trim()
      .toLowerCase();

    if (mode === 'live' || mode === 'sandbox') return mode;
    throw new BadRequestException(
      'checkoutMode must be either live or sandbox',
    );
  }

  private parseProductCode(value: unknown): BlockplannerPaidProductCode {
    const productCode = String(value || 'site_report')
      .trim()
      .toLowerCase();

    if (isBlockplannerPaidProductCode(productCode)) return productCode;
    throw new BadRequestException('Unsupported productCode');
  }

  private parseSourceApp(value: unknown, site: string): BlockplannerSourceApp {
    const sourceApp = String(value || '')
      .trim()
      .toLowerCase();

    if (sourceApp) {
      if (isBlockplannerSourceApp(sourceApp)) return sourceApp;
      throw new BadRequestException('Unsupported sourceApp');
    }

    let hostname = '';
    try {
      hostname = new URL(site).hostname.toLowerCase();
    } catch {
      throw new BadRequestException('Invalid site');
    }
    if (hostname.includes('upgrade')) return 'upgrade_estimator';
    if (hostname.includes('lvc')) return 'lvc_estimator';
    if (hostname.includes('discover')) return 'discover';
    return 'legacy';
  }

  private resolveCheckoutMode(
    sourceApp: BlockplannerSourceApp,
    requestedMode: unknown,
  ): StripeCheckoutMode {
    const sourceModeEnv: Record<BlockplannerSourceApp, string | undefined> = {
      discover: process.env.STRIPE_DISCOVER_CHECKOUT_MODE,
      lvc_estimator: process.env.STRIPE_LVC_CHECKOUT_MODE,
      upgrade_estimator: process.env.STRIPE_UPGRADE_CHECKOUT_MODE,
      legacy: undefined,
    };

    return this.parseCheckoutMode(sourceModeEnv[sourceApp] || requestedMode);
  }

  private resolveCheckoutSite(
    sourceApp: BlockplannerSourceApp,
    requestedSite: string,
  ): string {
    const sourceSiteEnv: Record<BlockplannerSourceApp, string | undefined> = {
      discover:
        process.env.BLOCKPLANNER_DISCOVER_SITE_URL ||
        'https://discover.blockplanner.com.au',
      lvc_estimator:
        process.env.BLOCKPLANNER_LVC_SITE_URL ||
        'https://lvc-estimator.blockplanner.com.au',
      upgrade_estimator:
        process.env.BLOCKPLANNER_UPGRADE_SITE_URL ||
        'https://upgrade.blockplanner.com.au',
      legacy: undefined,
    };

    try {
      const requestedUrl = new URL(requestedSite);
      if (!['http:', 'https:'].includes(requestedUrl.protocol)) {
        throw new Error('Unsupported protocol');
      }

      const configuredSite = String(sourceSiteEnv[sourceApp] || '').trim();
      const isLocalRequest = ['localhost', '127.0.0.1'].includes(
        requestedUrl.hostname,
      );

      if (!configuredSite) {
        if (isLocalRequest || sourceApp === 'legacy') {
          return requestedUrl.origin;
        }
        throw new InternalServerErrorException(
          `Missing trusted site URL for sourceApp ${sourceApp}`,
        );
      }

      let configuredUrl: URL;
      try {
        configuredUrl = new URL(configuredSite);
      } catch {
        throw new InternalServerErrorException(
          `Invalid trusted site URL for sourceApp ${sourceApp}`,
        );
      }
      if (!['http:', 'https:'].includes(configuredUrl.protocol)) {
        throw new InternalServerErrorException(
          `Trusted site URL for sourceApp ${sourceApp} must use HTTP or HTTPS`,
        );
      }

      if (!isLocalRequest && requestedUrl.origin !== configuredUrl.origin) {
        throw new BadRequestException(
          `site is not allowed for sourceApp ${sourceApp}`,
        );
      }

      return isLocalRequest ? requestedUrl.origin : configuredUrl.origin;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Invalid site');
    }
  }

  private resolveCheckoutCancelUrl(
    site: string,
    cancelUrlValue: unknown,
  ): string | undefined {
    const rawCancelUrl = String(cancelUrlValue || '').trim();
    if (!rawCancelUrl) return undefined;

    try {
      const siteUrl = new URL(site);
      const cancelUrl = new URL(rawCancelUrl, siteUrl);
      const allowedProtocols = new Set(['http:', 'https:']);

      if (
        !allowedProtocols.has(siteUrl.protocol) ||
        !allowedProtocols.has(cancelUrl.protocol) ||
        cancelUrl.origin !== siteUrl.origin
      ) {
        throw new BadRequestException(
          'cancelUrl must use the same HTTP origin as site',
        );
      }

      return cancelUrl.toString();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid site or cancelUrl');
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async stripeWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signatureHeader?: string,
  ) {
    const requestId = randomUUID();
    const startedAt = Date.now();
    const debugEnabled = this.isStripeWebhookDebugEnabled();
    const logPayloadEnabled = this.isStripeWebhookPayloadLoggingEnabled();

    const rawBodyBytes = rawBody?.length ?? 0;
    const rawBodyIsBuffer = rawBody instanceof Buffer;
    const rawBodySha256 = rawBodyIsBuffer
      ? createHash('sha256').update(rawBody).digest('hex').slice(0, 16)
      : undefined;

    const signatureSummary = signatureHeader
      ? this.summarizeStripeSignatureHeader(signatureHeader)
      : null;

    const webhookSecrets: Array<{
      mode: StripeCheckoutMode;
      secret: string;
    }> = [
      {
        mode: 'live' as StripeCheckoutMode,
        secret: String(process.env.STRIPE_WEBHOOK_SECRET || '').trim(),
      },
      {
        mode: 'sandbox' as StripeCheckoutMode,
        secret: String(process.env.STRIPE_SANDBOX_WEBHOOK_SECRET || '').trim(),
      },
    ].filter((entry) => Boolean(entry.secret));

    if (!webhookSecrets.length) {
      this.logger.error(
        `Stripe webhook rejected (requestId=${requestId}): No Stripe webhook secret configured`,
      );
      throw new InternalServerErrorException(
        'No Stripe webhook secret configured',
      );
    }

    if (!signatureHeader) {
      this.logger.warn(
        `Stripe webhook rejected (requestId=${requestId} rawBytes=${rawBodyBytes}${
          rawBodySha256 ? ` sha256=${rawBodySha256}` : ''
        }): Missing stripe-signature header`,
      );
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!rawBody || !(rawBody instanceof Buffer)) {
      this.logger.error(
        `Stripe webhook rejected (requestId=${requestId} rawBytes=${rawBodyBytes} rawIsBuffer=${rawBodyIsBuffer}${
          signatureSummary ? ` sig=${JSON.stringify(signatureSummary)}` : ''
        }): Missing raw body (enable rawBody in NestFactory options)`,
      );
      throw new InternalServerErrorException(
        'Missing raw body (enable rawBody in NestFactory options)',
      );
    }

    this.logger.log(
      `Stripe webhook received (requestId=${requestId} rawBytes=${rawBodyBytes} sha256=${rawBodySha256}${
        signatureSummary ? ` sig=${JSON.stringify(signatureSummary)}` : ''
      })`,
    );

    let event;
    let webhookMode: StripeCheckoutMode | undefined;
    let verificationError: unknown;
    const verifyStartedAt = Date.now();
    for (const webhookConfig of webhookSecrets) {
      try {
        const candidate = this.stripeService.constructWebhookEvent(
          rawBody,
          signatureHeader,
          webhookConfig.secret,
        );
        const candidateMode: StripeCheckoutMode = candidate.livemode
          ? 'live'
          : 'sandbox';

        if (candidateMode !== webhookConfig.mode) {
          verificationError = new Error(
            `Webhook secret mode mismatch: expected ${webhookConfig.mode}, received ${candidateMode}`,
          );
          continue;
        }

        event = candidate;
        webhookMode = candidateMode;
        break;
      } catch (error) {
        verificationError = error;
      }
    }

    if (!event) {
      this.logger.warn(
        `Stripe webhook signature verification failed (requestId=${requestId} verifyMs=${
          Date.now() - verifyStartedAt
        } rawBytes=${rawBodyBytes} sha256=${rawBodySha256}${
          signatureSummary ? ` sig=${JSON.stringify(signatureSummary)}` : ''
        }): ${verificationError instanceof Error ? verificationError.message : String(verificationError)}`,
      );
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    this.logger.log(
      `Stripe webhook verified (requestId=${requestId} verifyMs=${
        Date.now() - verifyStartedAt
      } type=${event.type} id=${event.id} livemode=${event.livemode} mode=${webhookMode})`,
    );

    if (debugEnabled) {
      const eventMetaSnapshot = {
        id: event.id,
        type: event.type,
        apiVersion: event.api_version ?? undefined,
        created: event.created,
        livemode: event.livemode,
        request: event.request ?? undefined,
        pendingWebhooks: event.pending_webhooks ?? undefined,
      };
      this.logger.debug(
        `Stripe webhook event snapshot (requestId=${requestId}): ${JSON.stringify(eventMetaSnapshot)}`,
      );
    }

    let payload: Record<string, string> | null = null;
    const extractStartedAt = Date.now();
    try {
      payload =
        await this.stripeService.extractPaidReportPayloadFromEvent(event);
    } catch (error) {
      this.logger.error(
        `Stripe webhook payload extraction failed (requestId=${requestId} type=${event.type} id=${event.id} extractMs=${
          Date.now() - extractStartedAt
        }): ${JSON.stringify(this.serializeError(error))}`,
      );
      throw error;
    }

    if (!payload) {
      this.logger.log(
        `Stripe webhook ignored (requestId=${requestId} type=${event.type} id=${event.id} totalMs=${
          Date.now() - startedAt
        })`,
      );
      return { received: true };
    }

    const payloadSummary = this.summarizeReportRequestPayload(payload);
    this.logger.log(
      `Stripe webhook extracted report request payload (requestId=${requestId} type=${event.type} id=${event.id} extractMs=${
        Date.now() - extractStartedAt
      }): ${JSON.stringify(payloadSummary)}`,
    );

    if (debugEnabled && logPayloadEnabled) {
      this.logger.debug(
        `Stripe webhook payload (requestId=${requestId} type=${event.type} id=${event.id}): ${JSON.stringify(payload)}`,
      );
    }

    this.logger.log(
      `Stripe webhook forwarding to monday (requestId=${requestId} type=${event.type} id=${event.id})`,
    );

    const forwardStartedAt = Date.now();
    try {
      const productCode = this.parseProductCode(payload.productCode);
      const forwardResult = await this.mondayService.upsertPaidProductRequest(
        productCode,
        payload,
      );

      this.logger.log(
        `Stripe webhook forwarded to monday OK (requestId=${requestId} type=${event.type} id=${event.id} forwardMs=${
          Date.now() - forwardStartedAt
        } totalMs=${Date.now() - startedAt})`,
      );

      if (debugEnabled) {
        this.logger.debug(
          `Stripe webhook forward result (requestId=${requestId}): ${JSON.stringify(forwardResult)}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Stripe webhook failed forwarding to monday (requestId=${requestId} type=${event.type} id=${event.id} forwardMs=${
          Date.now() - forwardStartedAt
        } totalMs=${Date.now() - startedAt}): ${JSON.stringify(
          this.serializeError(error),
        )}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
    return { received: true };
  }

  // @Get('products')
  // async getProducts() {
  //   return this.stripeService.getProducts();
  // }

  // @Get('customers')
  // async getCustomers() {
  //   return this.stripeService.getCustomers();
  // }

  // @Post('create-payment-intent')
  // async createPaymentIntent(
  //   @Body() body: { amount: number; currency: string },
  // ) {
  //   const { amount, currency } = body;
  //   return this.stripeService.createPaymentIntent(amount, currency);
  // }

  // @Post('subscriptions')
  // async createSubscription(
  //   @Body() body: { customerId: string; priceId: string },
  // ) {
  //   const { customerId, priceId } = body;
  //   return this.stripeService.createSubscription(customerId, priceId);
  // }

  // @Post('customers')
  // async createCustomer(@Body() body: { email: string; name: string }) {
  //   return this.stripeService.createCustomer(body.email, body.name);
  // }

  // @Post('products')
  // async createProduct(
  //   @Body() body: { name: string; description: string; price: number },
  // ) {
  //   return this.stripeService.createProduct(
  //     body.name,
  //     body.description,
  //     body.price,
  //   );
  // }

  // @Post('refunds')
  // async refundPayment(@Body() body: { paymentIntentId: string }) {
  //   return this.stripeService.refundPayment(body.paymentIntentId);
  // }

  // @Post('payment-links')
  // async createPaymentLink(@Body() body: { priceId: string }) {
  //   return this.stripeService.createPaymentLink(body.priceId);
  // }

  // @Get('balance')
  // async getBalance() {
  //   return this.stripeService.getBalance();
  // }
}
