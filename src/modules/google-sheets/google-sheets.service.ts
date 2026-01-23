import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

const GOOGLE_SHEETS_WEBHOOK_KEYS = [
  'reportId',
  'clientName',
  'clientEmail',
  'clientPhone',
  'address',
  'suburb',
  'blockSizeM2',
  'zone',
  'intention',
  'stripePaymentId',
] as const;

type GoogleSheetsWebhookKey = (typeof GOOGLE_SHEETS_WEBHOOK_KEYS)[number];

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);

  async pingGoogleSheetsWebhook(): Promise<'OK'> {
    const webhookUrl = this.getRequiredEnv('GOOGLE_SHEETS_WEB_APP_URL');
    const webhookSecret = this.getRequiredEnv('GOOGLE_SHEETS_WEB_APP_SECRET');
    const timeoutMs = this.getTimeoutMs();
    const requestUrl = this.buildWebhookRequestUrl(webhookUrl, webhookSecret);

    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        signal: abortController.signal,
      });

      const contentType = response.headers.get('content-type');
      const responseUrl = this.redactSecretFromUrl(response.url);
      const redirected = response.redirected;

      const text = await response.text();
      const trimmed = text.trim();

      if (!response.ok) {
        throw new BadGatewayException({
          message: 'Google Sheets webhook returned an error',
          status: response.status,
          statusText: response.statusText,
          requestedUrl: webhookUrl,
          finalUrl: responseUrl,
          redirected,
          contentType,
          body: this.tryParseJson(text),
        });
      }

      if (trimmed !== 'OK') {
        throw new BadGatewayException({
          message: 'Google Sheets webhook returned unexpected response',
          status: response.status,
          statusText: response.statusText,
          requestedUrl: webhookUrl,
          finalUrl: responseUrl,
          redirected,
          contentType,
          body: this.tryParseJson(text),
          expectedBody: 'OK',
        });
      }

      return 'OK';
    } catch (error) {
      if (this.isAbortError(error)) {
        throw new GatewayTimeoutException(
          `Google Sheets webhook timed out after ${timeoutMs}ms`,
        );
      }
      if (error instanceof BadGatewayException) {
        throw error;
      }
      throw new BadGatewayException({
        message: 'Failed to call Google Sheets webhook',
        requestedUrl: webhookUrl,
        error: this.serializeError(error),
      });
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  async forwardToGoogleSheetsWebhook(formData: Record<string, unknown>) {
    const payload = this.buildWebhookPayload(formData);
    return this.postToGoogleSheetsWebhook(payload);
  }

  async updateGoogleSheetsRow(params: {
    rowNumber: number;
    finalPdfLink: string;
  }) {
    return this.postToGoogleSheetsWebhook({
      action: 'update',
      rowNumber: params.rowNumber,
      finalPdfLink: params.finalPdfLink,
    });
  }

  async updateGoogleSheetsDelivery(params: {
    rowNumber: number;
    deliveryStatus: string;
    deliveryDate: string;
  }) {
    return this.postToGoogleSheetsWebhook({
      action: 'update',
      rowNumber: params.rowNumber,
      deliveryStatus: params.deliveryStatus,
      deliveryDate: params.deliveryDate,
    });
  }

  private async postToGoogleSheetsWebhook(payload: Record<string, unknown>) {
    const webhookUrl = this.getRequiredEnv('GOOGLE_SHEETS_WEB_APP_URL');
    const webhookSecret = this.getRequiredEnv('GOOGLE_SHEETS_WEB_APP_SECRET');
    const timeoutMs = this.getTimeoutMs();
    const requestUrl = this.buildWebhookRequestUrl(webhookUrl, webhookSecret);

    const requestBody = {
      ...payload,
      secret: webhookSecret,
    };

    const action =
      typeof payload.action === 'string' ? payload.action : 'append';
    const rowNumber =
      typeof payload.rowNumber === 'number' ? payload.rowNumber : undefined;

    this.logger.log(
      `Posting to Google Sheets webhook (action=${action}${
        rowNumber ? ` row=${rowNumber}` : ''
      })`,
    );

    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      const contentType = response.headers.get('content-type');
      const responseUrl = this.redactSecretFromUrl(response.url);
      const redirected = response.redirected;

      const text = await response.text();
      const responseBody = this.tryParseJson(text);

      if (!response.ok) {
        throw new BadGatewayException({
          message: 'Google Sheets webhook returned an error',
          status: response.status,
          statusText: response.statusText,
          requestedUrl: webhookUrl,
          finalUrl: responseUrl,
          redirected,
          contentType,
          body: responseBody,
        });
      }

      this.logger.log(
        `Google Sheets webhook response OK (action=${action}${
          rowNumber ? ` row=${rowNumber}` : ''
        })`,
      );
      return responseBody;
    } catch (error) {
      if (this.isAbortError(error)) {
        throw new GatewayTimeoutException(
          `Google Sheets webhook timed out after ${timeoutMs}ms`,
        );
      }
      if (error instanceof BadGatewayException) {
        throw error;
      }
      throw new BadGatewayException({
        message: 'Failed to call Google Sheets webhook',
        requestedUrl: webhookUrl,
        error: this.serializeError(error),
      });
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private buildWebhookPayload(
    formData: Record<string, unknown>,
  ): Record<GoogleSheetsWebhookKey, string> {
    return GOOGLE_SHEETS_WEBHOOK_KEYS.reduce(
      (acc, key) => {
        acc[key] = this.normalizeToString(formData[key]);
        return acc;
      },
      {} as Record<GoogleSheetsWebhookKey, string>,
    );
  }

  private normalizeToString(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((v) => String(v)).join(', ');
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private tryParseJson(text: string): unknown {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private isAbortError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'AbortError'
    );
  }

  private serializeError(error: unknown): { name?: string; message?: string } {
    if (error instanceof Error) {
      return { name: error.name, message: error.message };
    }
    return { message: String(error) };
  }

  private getTimeoutMs(): number {
    const raw = process.env.GOOGLE_SHEETS_WEB_APP_TIMEOUT_MS;
    if (!raw) return 10_000;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new InternalServerErrorException(`Missing env var ${name}`);
    }
    return value;
  }

  private buildWebhookRequestUrl(baseUrl: string, secret: string): string {
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('secret', secret);
      return url.toString();
    } catch {
      throw new InternalServerErrorException(
        'Invalid GOOGLE_SHEETS_WEB_APP_URL',
      );
    }
  }

  private redactSecretFromUrl(url: string | null): string | null {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      parsed.searchParams.delete('secret');
      return parsed.toString();
    } catch {
      return url;
    }
  }
}
