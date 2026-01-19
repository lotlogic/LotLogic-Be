import { GoogleSheetsService } from '@modules/google-sheets/google-sheets.service';
import { Injectable, Logger } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as pug from 'pug';
import * as puppeteer from 'puppeteer-core';

const DASHBOARD_COLUMNS = [
  'Timestamp',
  'Report ID',
  'Client name',
  'Client email',
  'Client phone',
  'Address',
  'Suburb',
  'Block size (m²)',
  'Zone',
  'Frontage (m)',
  'House position',
  'House footprint (m²)',
  'Rear yard depth (m)',
  'Large trees visible',
  'Tree location',
  'Heritage overlay',
  'Sewer location',
  'Easement impact',
  'Shed in rear',
  'Second driveway feasible',
  'Max building allowed (m²)',
  'Remaining site coverage (m²)',
  'Rear yard category',
  'Granny flat (keep house)',
  'Dual occ (remove house)',
  'Subdivision potential',
  'Analyst assigned',
  'send for QA?',
  'QA completed',
  'Final PDF link',
  'Delivery status',
  'Delivery date',
  'Escalation',
  'Internal notes',
  'Intention',
] as const;

@Injectable()
export class DashboardReportService {
  private readonly logger = new Logger(DashboardReportService.name);
  private blobServiceClient: BlobServiceClient | null = null;

  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  async processDashboardTrigger(payload: Record<string, unknown>): Promise<void> {
    try {
      const rowNumber = this.readRequiredRowNumber(payload);
      const reportId = this.readValue(payload, 'Report ID');
      const fields = DASHBOARD_COLUMNS.map((label) => ({
        label,
        value: this.readValue(payload, label),
      }));

      const html = this.renderHtml({ rowNumber, reportId, fields });
      const pdf = await this.renderPdf(html);
      const pdfUrl = await this.uploadPdf(pdf, { rowNumber, reportId });

      await this.googleSheetsService.updateGoogleSheetsRow({
        rowNumber,
        finalPdfLink: pdfUrl,
      });
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Dashboard report generation failed: ${this.normalizeToString(
          error instanceof Error ? error.message : error,
        )}`,
        stack,
      );
    }
  }

  private renderHtml(params: {
    rowNumber: number;
    reportId: string;
    fields: { label: string; value: string }[];
  }): string {
    const templatePath = join(
      __dirname,
      '..',
      '..',
      'templates',
      'dashboard-report.pug',
    );

    return pug.renderFile(templatePath, {
      title: 'LotLogic Report',
      generatedAt: new Date().toISOString(),
      rowNumber: params.rowNumber,
      reportId: params.reportId,
      fields: params.fields,
    });
  }

  private async renderPdf(html: string): Promise<Buffer> {
    const executablePath = this.getChromeExecutablePath();
    if (!executablePath) {
      throw new Error(
        'Chrome/Chromium not found. Set CHROME_EXECUTABLE_PATH or install chromium in the runtime image.',
      );
    }

    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close().catch(() => undefined);
    }
  }

  private async uploadPdf(
    pdf: Buffer,
    params: { rowNumber: number; reportId: string },
  ): Promise<string> {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER;
    const folder = process.env.AZURE_STORAGE_FOLDER || 'dashboard-reports';

    if (!connectionString) {
      throw new Error('Missing env var AZURE_STORAGE_CONNECTION_STRING');
    }
    if (!containerName) {
      throw new Error('Missing env var AZURE_STORAGE_CONTAINER');
    }

    if (!this.blobServiceClient) {
      this.blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
    }

    const containerClient =
      this.blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const baseId =
      (params.reportId && String(params.reportId).trim()) ||
      `row-${params.rowNumber}`;

    const safeId = baseId.replace(/[^a-zA-Z0-9._-]+/g, '-');
    const blobName = `${folder}/${safeId}.pdf`;

    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.uploadData(pdf, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' },
    });

    return blobClient.url;
  }

  private getChromeExecutablePath(): string | null {
    const explicit =
      process.env.CHROME_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
    if (explicit) return explicit;

    const candidates =
      process.platform === 'win32'
        ? [
            'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
            'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
            'C:\\\\Program Files\\\\Chromium\\\\Application\\\\chrome.exe',
          ]
        : process.platform === 'darwin'
          ? [
              '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
              '/Applications/Chromium.app/Contents/MacOS/Chromium',
            ]
          : [
              '/usr/bin/chromium-browser',
              '/usr/bin/chromium',
              '/usr/bin/google-chrome',
              '/usr/bin/google-chrome-stable',
            ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate;
    }
    return null;
  }

  private readRequiredRowNumber(payload: Record<string, unknown>): number {
    const rowNumberRaw =
      this.readRaw(payload, 'Row Number') ?? this.readRaw(payload, 'rowNumber');

    const rowNumber = this.normalizeToInt(rowNumberRaw);
    if (!rowNumber || rowNumber < 1) {
      throw new Error('Missing/invalid Row Number');
    }
    return rowNumber;
  }

  private readValue(payload: Record<string, unknown>, label: string): string {
    const candidates = this.getKeyVariants(label);
    for (const key of candidates) {
      if (key in payload) return this.normalizeToString(payload[key]);
    }
    return '';
  }

  private readRaw(payload: Record<string, unknown>, label: string): unknown {
    const candidates = this.getKeyVariants(label);
    for (const key of candidates) {
      if (key in payload) return payload[key];
    }
    return undefined;
  }

  private getKeyVariants(label: string): string[] {
    const base = String(label || '').trim();
    const camel = this.toCamelCase(base);
    const snake = this.toSnakeCase(base);
    const noSpaces = base.replace(/\s+/g, '');

    const variants = new Set<string>([
      base,
      camel,
      snake,
      noSpaces,
      base.toLowerCase(),
    ]);

    if (camel.endsWith('Id')) {
      variants.add(`${camel.slice(0, -2)}ID`);
    }
    if (camel.includes('Qa')) {
      variants.add(camel.replace(/Qa/g, 'QA'));
    }
    if (snake.includes('qa')) {
      variants.add(snake.replace(/qa/g, 'QA'));
    }

    return [...variants].filter(Boolean);
  }

  private toCamelCase(label: string): string {
    const words = this.toWords(label);
    if (!words.length) return '';
    return (
      words[0].toLowerCase() +
      words
        .slice(1)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('')
    );
  }

  private toSnakeCase(label: string): string {
    const words = this.toWords(label);
    return words.map((w) => w.toLowerCase()).join('_');
  }

  private toWords(label: string): string[] {
    const normalized = label
      .replace(/²/g, '2')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
    if (!normalized) return [];
    return normalized.split(/\s+/g);
  }

  private normalizeToInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
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
}
