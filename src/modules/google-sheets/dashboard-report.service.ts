import { GoogleSheetsService } from '@modules/google-sheets/google-sheets.service';
import { MailService } from '@modules/mail/mail.service';
import { Injectable, Logger } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as pug from 'pug';
import * as puppeteer from 'puppeteer-core';

type ReportKeyValue = { label: string; value: string };

type ReportBullet = { icon: string; title: string; text: string };

type ReportStep = { title: string; text: string };

type PaidReport = {
  cover: {
    title: string;
    address: string;
    blockSection?: string;
    zoning: string;
    preparedFor: string;
    date: string;
  };
  atAGlance: {
    blockSize: string;
    frontage: string;
    zone: string;
    intention: string;
  };
  reforms: {
    blockSize: string;
    rows: { threshold: string; allowed: string; qualifies: boolean }[];
    qualifiesFor: string;
  };
  zoning: { paragraphs: string[] };
  existingHouse: { metaItems: ReportKeyValue[]; paragraphs: string[] };
  rearYard: { metaItems: ReportKeyValue[]; paragraphs: string[] };
  siteCoverage: { paragraphs: string[] };
  trees: { metaItems: ReportKeyValue[]; paragraphs: string[]; bullets: string[] };
  heritage: { metaItems: ReportKeyValue[]; paragraphs: string[] };
  easements: { metaItems: ReportKeyValue[]; paragraphs: string[] };
  sewer: { metaItems: ReportKeyValue[]; paragraphs: string[] };
  driveway: { metaItems: ReportKeyValue[]; paragraphs: string[] };
  whatMeans: { intro: string; bullets: ReportBullet[]; summary?: string };
  nextStep: { paragraphs: string[]; bullets: string[] };
  disclaimer: { paragraphs: string[] };
  whatHappensNext: { steps: ReportStep[]; cta: string };
};

@Injectable()
export class DashboardReportService {
  private readonly logger = new Logger(DashboardReportService.name);
  private blobServiceClient: BlobServiceClient | null = null;

  constructor(
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly mailService: MailService,
  ) {}

  async processDashboardTrigger(payload: Record<string, unknown>): Promise<void> {
    let rowNumber: number | undefined;
    let reportId: string | undefined;
    try {
      rowNumber = this.readRequiredRowNumber(payload);
      reportId = this.readValue(payload, 'Report ID');

      this.logger.log(
        `Dashboard report job started (row=${rowNumber}${
          reportId ? ` reportId=${reportId}` : ''
        })`,
      );

      this.logPayloadSnapshot_(payload, { rowNumber, reportId });

      const report = this.buildPaidReport(payload);
      this.logComputedSnapshot_(report, { rowNumber, reportId });
      const html = this.renderHtml(report);
      this.logger.log(
        `Dashboard report HTML rendered (row=${rowNumber} bytes=${Buffer.byteLength(
          html,
          'utf8',
        )})`,
      );

      const pdf = await this.renderPdf(html, { rowNumber, reportId });
      this.logger.log(
        `Dashboard report PDF rendered (row=${rowNumber} bytes=${pdf.length})`,
      );

      const pdfUrl = await this.uploadPdf(pdf, { rowNumber, reportId });
      this.logger.log(`Dashboard report uploaded (row=${rowNumber} url=${pdfUrl})`);

      const updateResponse = await this.googleSheetsService.updateGoogleSheetsRow({
        rowNumber,
        finalPdfLink: pdfUrl,
      });

      const updateOk =
        typeof updateResponse === 'object' &&
        updateResponse !== null &&
        'ok' in updateResponse
          ? Boolean((updateResponse as { ok?: unknown }).ok)
          : undefined;

      if (updateOk === false) {
        this.logger.warn(
          `Dashboard report row update returned ok=false (row=${rowNumber})`,
        );
      } else {
        this.logger.log(`Dashboard report row updated (row=${rowNumber})`);
      }
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Dashboard report generation failed (row=${
          rowNumber ?? 'unknown'
        }${reportId ? ` reportId=${reportId}` : ''}): ${this.normalizeToString(
          error instanceof Error ? error.message : error,
        )}`,
        stack,
      );
    }
  }

  async processDashboardDelivery(payload: Record<string, unknown>): Promise<void> {
    let rowNumber: number | undefined;
    let reportId: string | undefined;

    try {
      rowNumber = this.readRequiredRowNumber(payload);
      reportId = this.readValue(payload, 'Report ID');

      const address = this.readValue(payload, 'Address');
      const suburb = this.readValue(payload, 'Suburb');
      const fullAddress = [address, suburb].filter(Boolean).join(', ');

      const clientName = this.readValue(payload, 'Client name') || 'there';
      const clientEmail = this.readValue(payload, 'Client email');
      const pdfUrl = this.readValue(payload, 'Final PDF link');
      const deliveryStatus = this.readValue(payload, 'Delivery status');

      const emailOverride = String(
        process.env.GOOGLE_SHEETS_DELIVERY_EMAIL_OVERRIDE || '',
      ).trim();
      const recipientEmail = emailOverride || clientEmail;

      this.logger.log(
        `Dashboard delivery job started (row=${rowNumber}${
          reportId ? ` reportId=${reportId}` : ''
        } status=${deliveryStatus || '—'} to=${this.redactEmail_(
          recipientEmail,
        )}${emailOverride ? ' override=true' : ''})`,
      );

      if (!pdfUrl) {
        throw new Error('Missing Final PDF link');
      }
      if (!recipientEmail) {
        throw new Error(
          'Missing Client email (and GOOGLE_SHEETS_DELIVERY_EMAIL_OVERRIDE is not set)',
        );
      }

      const pdf = await this.downloadPdf_(pdfUrl);
      this.logger.log(
        `Dashboard delivery PDF downloaded (row=${rowNumber} bytes=${pdf.length})`,
      );

      const subject = `Your BlockPlanner Site Assessment Report${
        fullAddress ? ` — ${fullAddress}` : ''
      }`;

      const filename = this.buildDeliveryAttachmentFilename_({
        reportId,
        rowNumber,
        fullAddress,
      });

      await this.mailService.sendEmailOrThrow({
        subject,
        template: 'dashboard-delivery-email',
        context: {
          clientName,
          address: fullAddress || address || suburb || '',
          reportId: reportId || '',
        },
        emailsList: recipientEmail,
        attachments: [
          {
            filename,
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(
        `Dashboard delivery email sent (row=${rowNumber} to=${this.redactEmail_(
          recipientEmail,
        )})`,
      );

      const deliveryDate = new Date().toISOString();
      const updateResponse = await this.googleSheetsService.updateGoogleSheetsDelivery(
        {
          rowNumber,
          deliveryStatus: 'Sent',
          deliveryDate,
        },
      );

      const updateOk =
        typeof updateResponse === 'object' &&
        updateResponse !== null &&
        'ok' in updateResponse
          ? Boolean((updateResponse as { ok?: unknown }).ok)
          : undefined;

      if (updateOk === false) {
        this.logger.warn(
          `Dashboard delivery row update returned ok=false (row=${rowNumber})`,
        );
      } else {
        this.logger.log(
          `Dashboard delivery row updated (row=${rowNumber} status=Sent)`,
        );
      }
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Dashboard delivery failed (row=${rowNumber ?? 'unknown'}${
          reportId ? ` reportId=${reportId}` : ''
        }): ${this.normalizeToString(error instanceof Error ? error.message : error)}`,
        stack,
      );
    }
  }

  private buildPaidReport(payload: Record<string, unknown>): PaidReport {
    const address = this.readValue(payload, 'Address');
    const suburb = this.readValue(payload, 'Suburb');
    const zone = this.readValue(payload, 'Zone');
    const intention = this.readValue(payload, 'Intention');
    const preparedFor =
      this.readValue(payload, 'Client name') ||
      this.readValue(payload, 'Client email') ||
      'Customer';

    const timestampRaw = this.readRaw(payload, 'Timestamp');
    const date = this.formatDate_(
      timestampRaw ? new Date(String(timestampRaw)) : new Date(),
    );

    const coverAddress = [address, suburb].filter(Boolean).join(', ') || '—';

    const blockSizeM2 =
      this.normalizeToFloat_(this.readRaw(payload, 'Block size (m²)')) ??
      this.normalizeToFloat_(this.readRaw(payload, 'Block size (m2)'));

    const frontageM =
      this.normalizeToFloat_(this.readRaw(payload, 'Frontage (m)')) ??
      this.normalizeToFloat_(this.readRaw(payload, 'Frontage'));

    const housePosition = this.readValue(payload, 'House position');
    const houseFootprintM2 = this.normalizeToFloat_(
      this.readRaw(payload, 'House footprint (m²)'),
    );

    const rearYardCategory = this.readValue(payload, 'Rear yard category');
    const rearYardDepthM = this.normalizeToFloat_(
      this.readRaw(payload, 'Rear yard depth (m)'),
    );

    const maxBuildingAllowedM2 =
      this.normalizeToFloat_(this.readRaw(payload, 'Max building allowed (m²)')) ??
      (blockSizeM2 !== null ? blockSizeM2 * 0.5 : null);

    const remainingSiteCoverageM2 =
      this.normalizeToFloat_(
        this.readRaw(payload, 'Remaining site coverage (m²)'),
      ) ??
      (maxBuildingAllowedM2 !== null && houseFootprintM2 !== null
        ? Math.max(0, maxBuildingAllowedM2 - houseFootprintM2)
        : null);

    const treesVisibleCount = this.parseTreeCount_(
      this.readValue(payload, 'Large trees visible'),
    );
    const treeLocation = this.readValue(payload, 'Tree location');

    const heritageOverlay = this.readValue(payload, 'Heritage overlay');
    const easementImpact = this.readValue(payload, 'Easement impact');
    const sewerLocation = this.readValue(payload, 'Sewer location');
    const secondDriveway = this.readValue(payload, 'Second driveway feasible');

    const grannyFlat = this.readValue(payload, 'Granny flat (keep house)');
    const dualOcc = this.readValue(payload, 'Dual occ (remove house)');
    const subdivision = this.readValue(payload, 'Subdivision potential');

    const zoneDisplay = this.formatZoneDisplay_(zone);

    const reformsRows = [
      {
        threshold: '400m²+',
        allowed: 'Dual occupancy (two dwellings, one title)',
        qualifies: blockSizeM2 !== null ? blockSizeM2 >= 400 : false,
      },
      {
        threshold: '500m²+',
        allowed: 'Secondary residence up to 120m²',
        qualifies: blockSizeM2 !== null ? blockSizeM2 >= 500 : false,
      },
      {
        threshold: '600m²+',
        allowed: 'Unit titling (two dwellings, separate titles)',
        qualifies: blockSizeM2 !== null ? blockSizeM2 >= 600 : false,
      },
      {
        threshold: '800m²+',
        allowed: 'Up to three dwellings',
        qualifies: blockSizeM2 !== null ? blockSizeM2 >= 800 : false,
      },
    ];

    return {
      cover: {
        title: 'BlockPlanner Site Assessment Report',
        address: coverAddress,
        zoning: zoneDisplay || zone || '—',
        preparedFor,
        date,
      },
      atAGlance: {
        blockSize: this.formatArea_(blockSizeM2),
        frontage: this.formatMeters_(frontageM),
        zone: zone || '—',
        intention: intention || '—',
      },
      reforms: {
        blockSize: this.formatArea_(blockSizeM2),
        rows: reformsRows,
        qualifiesFor: this.formatQualifiesFor_(reformsRows),
      },
      zoning: { paragraphs: this.buildZoningParagraphs_(zone) },
      existingHouse: {
        metaItems: [
          ...(housePosition
            ? [{ label: 'House position', value: housePosition }]
            : []),
          ...(houseFootprintM2 !== null
            ? [
                {
                  label: 'House footprint',
                  value: this.formatArea_(houseFootprintM2),
                },
              ]
            : []),
        ],
        paragraphs: this.buildExistingHouseParagraphs_(housePosition),
      },
      rearYard: {
        metaItems: [
          ...(rearYardCategory
            ? [{ label: 'Rear yard', value: rearYardCategory }]
            : []),
          ...(rearYardDepthM !== null
            ? [{ label: 'Depth', value: this.formatMeters_(rearYardDepthM) }]
            : []),
        ],
        paragraphs: this.buildRearYardParagraphs_(rearYardCategory, rearYardDepthM),
      },
      siteCoverage: {
        paragraphs: this.buildSiteCoverageParagraphs_({
          blockSizeM2,
          maxBuildingAllowedM2,
          houseFootprintM2,
          remainingSiteCoverageM2,
        }),
      },
      trees: this.buildTreesSection_({
        treesVisibleCount,
        treeLocation,
      }),
      heritage: this.buildHeritageSection_(heritageOverlay),
      easements: this.buildEasementsSection_(easementImpact),
      sewer: this.buildSewerSection_(sewerLocation),
      driveway: this.buildDrivewaySection_({
        frontageM,
        secondDriveway,
      }),
      whatMeans: this.buildWhatMeansSection_({
        blockSizeM2,
        grannyFlat,
        dualOcc,
        subdivision,
        housePosition,
        treesVisibleCount,
        sewerLocation,
      }),
      nextStep: this.buildNextStepSection_(intention),
      disclaimer: {
        paragraphs: [
          'This report is based on ACT Government mapping, aerial imagery, and publicly available planning information. It is not a formal planning assessment, survey, engineering report, or guarantee of approval.',
          'All development must comply with ACT laws, the Territory Plan, and technical requirements. Site-specific conditions — including exact tree status, easement locations, sewer alignment, and heritage requirements — should be confirmed through detailed due diligence before committing to any design or construction.',
          "BlockPlanner is not a licensed planning consultancy. Where formal planning advice or development applications are required, we work with registered planners and can coordinate this on your behalf.",
        ],
      },
      whatHappensNext: {
        steps: [
          {
            title: 'Review this report',
            text: "take your time to understand your block's potential and constraints.",
          },
          {
            title: 'Book a call',
            text: "we'll walk through the findings and answer any questions. No obligation, no pressure.",
          },
          {
            title: 'Detailed Feasibility Review',
            text: "if you want to proceed, we'll confirm all constraints and give you a clear go/no-go assessment with numbers.",
          },
          {
            title: 'Choose your pathway',
            text: 'develop yourself, partner with us, or sell with confidence.',
          },
        ],
        cta: 'Book a Call | Email Us | Learn About Joint Ventures',
      },
    };
  }

  private logPayloadSnapshot_(
    payload: Record<string, unknown>,
    context: { rowNumber: number; reportId?: string },
  ): void {
    const snapshot = {
      zone: this.readValue(payload, 'Zone'),
      blockSizeM2: this.readValue(payload, 'Block size (m²)'),
      frontageM: this.readValue(payload, 'Frontage (m)'),
      housePosition: this.readValue(payload, 'House position'),
      houseFootprintM2: this.readValue(payload, 'House footprint (m²)'),
      rearYardDepthM: this.readValue(payload, 'Rear yard depth (m)'),
      rearYardCategory: this.readValue(payload, 'Rear yard category'),
      remainingSiteCoverageM2: this.readValue(payload, 'Remaining site coverage (m²)'),
      grannyFlatKeepHouse: this.readValue(payload, 'Granny flat (keep house)'),
      dualOccRemoveHouse: this.readValue(payload, 'Dual occ (remove house)'),
      subdivisionPotential: this.readValue(payload, 'Subdivision potential'),
      intention: this.readValue(payload, 'Intention'),
      keysCount: Object.keys(payload).length,
    };

    const feasibility = {
      grannyFlat: this.normalizeFeasibility_(snapshot.grannyFlatKeepHouse, {
        possibleOk: true,
      }),
      dualOcc: this.normalizeFeasibility_(snapshot.dualOccRemoveHouse, {
        possibleOk: false,
      }),
      subdivision: this.normalizeFeasibility_(snapshot.subdivisionPotential, {
        possibleOk: false,
      }),
    };

    this.logger.log(
      `Dashboard report payload snapshot (row=${context.rowNumber}${
        context.reportId ? ` reportId=${context.reportId}` : ''
      }): ${JSON.stringify(snapshot)}`,
    );

    this.logger.log(
      `Dashboard report feasibility snapshot (row=${context.rowNumber}${
        context.reportId ? ` reportId=${context.reportId}` : ''
      }): ${JSON.stringify({
        grannyFlat: { raw: snapshot.grannyFlatKeepHouse, ok: feasibility.grannyFlat.ok },
        dualOcc: { raw: snapshot.dualOccRemoveHouse, ok: feasibility.dualOcc.ok },
        subdivision: { raw: snapshot.subdivisionPotential, ok: feasibility.subdivision.ok },
      })}`,
    );
  }

  private logComputedSnapshot_(
    report: PaidReport,
    context: { rowNumber: number; reportId?: string },
  ): void {
    const computed = {
      rearYardMeta: report.rearYard?.metaItems || [],
      whatMeans: (report.whatMeans?.bullets || []).map((b) => ({
        title: b.title,
        icon: b.icon,
      })),
    };

    this.logger.log(
      `Dashboard report computed snapshot (row=${context.rowNumber}${
        context.reportId ? ` reportId=${context.reportId}` : ''
      }): ${JSON.stringify(computed)}`,
    );
  }

  private renderHtml(report: PaidReport): string {
    const templatePath = join(
      __dirname,
      '..',
      '..',
      'templates',
      'dashboard-report.pug',
    );

    return pug.renderFile(templatePath, {
      report,
    });
  }

  private async renderPdf(
    html: string,
    context?: { rowNumber: number; reportId?: string },
  ): Promise<Buffer> {
    const ctx = context
      ? ` (row=${context.rowNumber}${context.reportId ? ` reportId=${context.reportId}` : ''})`
      : '';

    const t0 = Date.now();
    this.logger.log(`Dashboard report PDF render starting${ctx}`);

    const executablePath = this.getChromeExecutablePath();
    if (!executablePath) {
      throw new Error(
        'Chrome/Chromium not found. Set CHROME_EXECUTABLE_PATH or install chromium in the runtime image.',
      );
    }

    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(60_000);
      page.setDefaultNavigationTimeout(60_000);

      const tSetContent = Date.now();
      await page.setContent(html, { waitUntil: 'load', timeout: 60_000 });
      this.logger.log(
        `Dashboard report PDF setContent done (ms=${Date.now() - tSetContent})${ctx}`,
      );

      const tPdf = Date.now();
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });

      this.logger.log(
        `Dashboard report PDF page.pdf done (ms=${Date.now() - tPdf})${ctx}`,
      );
      this.logger.log(
        `Dashboard report PDF render finished (ms=${Date.now() - t0})${ctx}`,
      );

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

  private normalizeToFloat_(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;

    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned) return null;

    const match = cleaned.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;

    const parsed = Number.parseFloat(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private formatArea_(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    return `${Math.round(value)} m²`;
  }

  private formatMeters_(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    if (Math.abs(value - Math.round(value)) < 0.05) return `${Math.round(value)} m`;
    return `${value.toFixed(1)} m`;
  }

  private formatDate_(date: Date): string {
    const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  private formatZoneDisplay_(zoneRaw: string): string {
    const z = String(zoneRaw || '').trim();
    const upper = z.toUpperCase();
    if (upper.includes('RZ1')) return 'RZ1 – Suburban Zone';
    if (upper.includes('RZ2')) return 'RZ2 – Suburban Core Zone';
    return z;
  }

  private buildZoningParagraphs_(zoneRaw: string): string[] {
    const z = String(zoneRaw || '').trim();
    const upper = z.toUpperCase();
    const label = this.formatZoneDisplay_(z) || z || 'your zone';

    if (upper.includes('RZ1')) {
      return [
        `Your block is zoned ${label}.`,
        "RZ1 is the most common residential zone in Canberra, covering established suburban areas. Historically, RZ1 has been restricted to one main dwelling per block, with limited options for adding a second home. The ACT Government's Missing Middle reforms are changing this — removing minimum block size requirements and opening up new possibilities for dual occupancy, granny flats, and in some cases, subdivision.",
        "Understanding your zone is the foundation for knowing what's possible. The sections below assess your specific block against both current rules and the new reforms.",
      ];
    }

    if (upper.includes('RZ2')) {
      return [
        `Your block is zoned ${label}.`,
        'RZ2 allows for a broader range of housing types than RZ1, including dual occupancies and multi-unit developments. It has always been more flexible for redevelopment, and the Missing Middle reforms make it even more so — reducing minimum lot sizes and easing restrictions on townhouses and small apartment buildings.',
        "Understanding your zone is the foundation for knowing what's possible. The sections below assess your specific block against both current rules and the new reforms.",
      ];
    }

    return [
      `Your block is zoned ${label}.`,
      "Zoning sets the foundation for what's possible. The sections below assess your specific block against both current rules and the Missing Middle reforms.",
    ];
  }

  private buildExistingHouseParagraphs_(housePositionRaw: string): string[] {
    const pos = String(housePositionRaw || '').trim().toLowerCase();

    if (pos.includes('front')) {
      return [
        'The existing house is positioned toward the front of the block, which leaves more usable space at the rear. This is a favourable layout if you are considering adding a granny flat or second dwelling behind the existing home, subject to access, setbacks, and other site constraints covered below.',
      ];
    }

    if (pos.includes('middle')) {
      return [
        'The existing house is positioned in the middle of the block. This limits the usable space for adding a second dwelling behind the house while retaining the original home. For most redevelopment options — such as dual occupancy or subdivision — the existing house would likely need to be removed or substantially altered.',
      ];
    }

    if (pos.includes('back') || pos.includes('rear')) {
      return [
        'The existing house is positioned toward the rear of the block. This limits the usable space for adding a second dwelling behind the house while retaining the original home. For most redevelopment options — such as dual occupancy or subdivision — the existing house would likely need to be removed or substantially altered.',
      ];
    }

    return [
      'The existing house position affects how much usable space remains for an additional dwelling. The sections below assess rear yard space, site coverage, trees, services, and access constraints.',
    ];
  }

  private buildRearYardParagraphs_(
    categoryRaw: string,
    depthM: number | null,
  ): string[] {
    const depthText = depthM !== null ? this.formatMeters_(depthM) : '—';
    const c = String(categoryRaw || '').trim().toLowerCase();

    if (c.includes('large')) {
      return [
        `Your rear yard depth is approximately ${depthText}, which provides good flexibility for a granny flat or second dwelling behind the existing house — subject to setbacks, tree constraints, and access.`,
      ];
    }

    if (c.includes('moderate')) {
      return [
        `Your rear yard depth is approximately ${depthText}. This is workable for a granny flat, though positioning will be tight and will depend on setbacks (minimum 3m from the rear boundary) and any tree protection zones.`,
      ];
    }

    if (c.includes('small')) {
      return [
        `Your rear yard depth is approximately ${depthText}. Adding a granny flat behind the existing house would be tight. It may still be possible if any existing shed is removed, but a detailed site assessment would be needed to confirm.`,
      ];
    }

    if (c.includes('minimal') || c.includes('<')) {
      return [
        `Your rear yard depth is approximately ${depthText}, which is unlikely to accommodate a second dwelling behind the existing house. For redevelopment options like dual occupancy or subdivision, removing the existing house would likely be required.`,
      ];
    }

    return [
      `Rear yard depth is approximately ${depthText}. Whether this can accommodate an additional dwelling depends on setbacks, access, and other site constraints.`,
    ];
  }

  private buildSiteCoverageParagraphs_(params: {
    blockSizeM2: number | null;
    maxBuildingAllowedM2: number | null;
    houseFootprintM2: number | null;
    remainingSiteCoverageM2: number | null;
  }): string[] {
    const blockSizeText = this.formatArea_(params.blockSizeM2);
    const maxAllowedText = this.formatArea_(params.maxBuildingAllowedM2);

    const paragraphs: string[] = [
      `Under current rules, buildings can cover a maximum of 50% of your block. Based on your block size of ${blockSizeText}, the maximum building footprint allowed is ${maxAllowedText}.`,
    ];

    if (params.houseFootprintM2 !== null) {
      paragraphs.push(
        `The existing house occupies approximately ${this.formatArea_(
          params.houseFootprintM2,
        )}, leaving a remaining building allowance of approximately ${this.formatArea_(
          params.remainingSiteCoverageM2,
        )}.`,
      );
    }

    if (params.remainingSiteCoverageM2 !== null) {
      if (params.remainingSiteCoverageM2 >= 90) {
        paragraphs.push(
          'This is enough for a granny flat (up to 90m²) under current rules, subject to setbacks, access, and other constraints.',
        );
      } else {
        paragraphs.push(
          'This is below the typical size for a granny flat (up to 90m²). Adding a second dwelling while keeping the existing house may not be feasible under site coverage rules. Redevelopment options that involve removing the existing house would reset this calculation.',
        );
      }
    }

    return paragraphs;
  }

  private parseTreeCount_(raw: string): number {
    const s = String(raw || '').trim().toLowerCase();
    if (!s) return 0;
    if (s.includes('none') || s === '0') return 0;
    if (s.includes('3+') || s.includes('3 plus') || s.includes('three')) return 3;
    if (s.includes('several') || s.includes('multiple') || s.includes('many'))
      return 3;
    if (s.includes('two')) return 2;
    if (s.includes('one')) return 1;

    const n = this.normalizeToInt(raw);
    if (n !== null) return n;
    const parsed = this.normalizeToFloat_(raw);
    return parsed ? Math.round(parsed) : 0;
  }

  private buildTreesSection_(params: {
    treesVisibleCount: number;
    treeLocation: string;
  }): PaidReport['trees'] {
    const { treesVisibleCount, treeLocation } = params;

    const metaItems: ReportKeyValue[] = [
      {
        label: 'Large trees visible',
        value: treesVisibleCount >= 3 ? '3+' : String(Math.max(0, treesVisibleCount)),
      },
    ];
    if (treeLocation) metaItems.push({ label: 'Tree location', value: treeLocation });

    if (!treesVisibleCount) {
      return {
        metaItems,
        paragraphs: [
          'Based on the latest aerial imagery, there do not appear to be any significant trees on your block.',
          'This is favourable for redevelopment flexibility, as there are no tree protection zones to work around. However, be aware that the ACT Government is increasing tree canopy requirements for new developments. You may be required to plant new trees as part of any development.',
        ],
        bullets: [],
      };
    }

    const countText =
      treesVisibleCount === 1
        ? 'one'
        : treesVisibleCount === 2
          ? 'two'
          : 'three or more';

    const locationText = treeLocation ? `, located in the ${treeLocation}` : '';

    return {
      metaItems,
      paragraphs: [
        `Based on the latest aerial imagery, there appears to be ${countText} significant tree(s) on your block${locationText}.`,
        'Trees in the ACT are protected under the Urban Forest Act 2023 if they meet any of the following criteria:',
        'Protected trees have a tree protection zone that includes the area under the canopy plus 4 metres from the trunk in all directions. You cannot build, excavate, or disturb roots within this zone without approval from the ACT Tree Protection Unit.',
        "We have not confirmed whether any trees on your site are on the ACT Registered Tree list. A detailed feasibility review can confirm the tree's status and map protection zones.",
      ],
      bullets: [
        '8 metres or taller',
        'Canopy width of 8 metres or more',
        'Trunk circumference of 1 metre or more (measured at 1.4m above ground)',
      ],
    };
  }

  private isYesLike_(value: string): boolean {
    const s = String(value || '').trim().toLowerCase();
    return s === 'yes' || s === 'y' || s === 'true' || s === '1' || s === 'on';
  }

  private buildHeritageSection_(heritageOverlayRaw: string): PaidReport['heritage'] {
    const yes = this.isYesLike_(heritageOverlayRaw);
    const metaValue = heritageOverlayRaw ? heritageOverlayRaw : yes ? 'Yes' : 'No';

    return {
      metaItems: [{ label: 'Heritage overlay', value: metaValue }],
      paragraphs: yes
        ? [
            'Your property is located within a heritage overlay.',
            'This means there may be restrictions on demolishing, significantly altering, or extending the existing house. In some cases, heritage controls also affect new structures on the block — including granny flats or second dwellings — particularly if they would be visible from the street or impact the heritage character of the area.',
            "Before progressing any redevelopment, we recommend a detailed feasibility review to confirm what is and isn't permitted on your block. We work with heritage specialists and can help you navigate this process.",
          ]
        : [
            'Based on ACT Government mapping, your property is not within a heritage overlay.',
            'This means there are no heritage-related restrictions on demolishing, altering, or extending the existing house, and no heritage constraints on new structures. This is favourable for redevelopment flexibility.',
          ],
    };
  }

  private buildEasementsSection_(easementRaw: string): PaidReport['easements'] {
    const s = String(easementRaw || '').trim().toLowerCase();
    const isYes = this.isYesLike_(easementRaw);
    const isUnsure =
      s.includes('unsure') || s.includes('unknown') || s.includes('not sure');

    const metaValue = easementRaw
      ? easementRaw
      : isYes
        ? 'Yes'
        : isUnsure
          ? 'Unsure'
          : 'No';

    if (isUnsure) {
      return {
        metaItems: [{ label: 'Easements', value: metaValue }],
        paragraphs: [
          'We were unable to confirm whether there are easements on your block from the available mapping.',
          'Easements are legal rights for utilities or access that restrict what you can build in certain areas. If an easement runs through your block, it may limit where buildings and driveways can go.',
          'We recommend confirming this as part of a detailed feasibility review, which would include a title search.',
        ],
      };
    }

    if (isYes) {
      return {
        metaItems: [{ label: 'Easements', value: metaValue }],
        paragraphs: [
          'Based on the available mapping, there appears to be an easement running through your block.',
          'Easements are legal rights for utilities or access that restrict what you can build in certain areas. You typically cannot construct permanent buildings over an easement, and access must be maintained for maintenance.',
          'Depending on where the easement is located, this may affect where a new dwelling or driveway can be positioned. In some cases, easements through the middle of a block can significantly limit redevelopment options.',
          'A detailed feasibility review can confirm the exact easement location and how it affects your options.',
        ],
      };
    }

    return {
      metaItems: [{ label: 'Easements', value: metaValue }],
      paragraphs: [
        'Based on the available mapping, there do not appear to be any easements running through your block.',
        'Easements are legal rights for utilities or access that restrict what you can build in certain areas. Common easements include sewer, stormwater, and electrical easements. If an easement runs through the middle of a block, it can significantly limit where a new dwelling or driveway can be positioned.',
        'The absence of visible easements is a positive sign for redevelopment flexibility. A title search or survey would confirm this definitively.',
      ],
    };
  }

  private buildSewerSection_(sewerRaw: string): PaidReport['sewer'] {
    const s = String(sewerRaw || '').trim().toLowerCase();
    const value = sewerRaw || 'Unknown';

    if (s.includes('front') || s.includes('side')) {
      const loc = s.includes('front') ? 'front' : 'side';
      return {
        metaItems: [{ label: 'Sewer location', value }],
        paragraphs: [
          `Based on the available mapping, the sewer connection for your block appears to be located at the ${loc} of the property.`,
          'This is a favourable position for redevelopment, as it typically allows flexibility in where new dwellings can be positioned without major sewer relocation or extension costs.',
        ],
      };
    }

    if (s.includes('rear')) {
      return {
        metaItems: [{ label: 'Sewer location', value }],
        paragraphs: [
          'Based on the available mapping, the sewer connection for your block appears to be located at the rear of the property.',
          'This may affect how a second dwelling or subdivision is serviced. Extending sewer to a new dwelling at the front or middle of the block may involve additional costs. This would be assessed as part of any detailed feasibility review.',
        ],
      };
    }

    if (s.includes('through')) {
      return {
        metaItems: [{ label: 'Sewer location', value }],
        paragraphs: [
          'Based on the available mapping, there appears to be a sewer line running through your block.',
          'Sewer easements typically restrict building within a certain distance of the pipe, and any work near the sewer would require approval from Icon Water. Depending on the alignment, this may limit where new dwellings can be positioned.',
          'A detailed feasibility review can confirm the exact alignment and how it affects your options.',
        ],
      };
    }

    return {
      metaItems: [{ label: 'Sewer location', value }],
      paragraphs: [
        'We were unable to confirm the sewer location from the available mapping.',
        'Sewer position can affect where new dwellings are located and the cost of connecting services. We recommend confirming this as part of a detailed feasibility review.',
      ],
    };
  }

  private buildDrivewaySection_(params: {
    frontageM: number | null;
    secondDriveway: string;
  }): PaidReport['driveway'] {
    const frontageText = this.formatMeters_(params.frontageM);
    const s = String(params.secondDriveway || '').trim().toLowerCase();

    const metaItems: ReportKeyValue[] = [
      { label: 'Frontage', value: frontageText },
      {
        label: 'Second driveway',
        value: params.secondDriveway ? params.secondDriveway : '—',
      },
    ];

    const intro =
      'For dual occupancy or subdivision, a second driveway is typically required to provide independent access to each dwelling.';

    if (s.includes('yes')) {
      return {
        metaItems,
        paragraphs: [
          intro,
          `Your frontage of ${frontageText} is sufficient for a second driveway. Based on the aerial imagery, there appear to be no significant obstructions (trees, power poles, or existing structures) blocking potential driveway locations.`,
          'This is favourable for redevelopment options that require separate access.',
        ],
      };
    }

    if (s.includes('possible')) {
      return {
        metaItems,
        paragraphs: [
          intro,
          `Your frontage of ${frontageText} may allow for a second driveway, though it would be tight. The feasibility would depend on the exact position of the existing driveway, any trees or services near the boundary, and the minimum driveway width requirements.`,
          'A detailed feasibility review would confirm whether a second driveway is achievable.',
        ],
      };
    }

    if (s.includes('tight')) {
      return {
        metaItems,
        paragraphs: [
          intro,
          `Your frontage of ${frontageText} is narrow for a second driveway. While not impossible, it would require careful design and may limit other aspects of the development (such as landscaping or setbacks).`,
          'Shared driveway arrangements may be an alternative worth exploring.',
        ],
      };
    }

    return {
      metaItems,
      paragraphs: [
        intro,
        `Your frontage of ${frontageText} is unlikely to accommodate a second driveway under standard requirements. This may limit redevelopment options that require independent access to each dwelling.`,
        'Alternative arrangements — such as a shared driveway or battle-axe configuration — may be possible but would require detailed design assessment.',
      ],
    };
  }

  private normalizeFeasibility_(
    raw: string,
    options: { possibleOk: boolean },
  ): { ok: boolean; label: string } {
    const s = String(raw || '').trim().toLowerCase();
    if (!s) return { ok: false, label: 'Unknown' };

    // Note: "unlikely" contains "likely", so check negative states first.
    if (s.includes('unlikely') || s === 'false' || s.includes('no')) {
      return { ok: false, label: raw };
    }

    if (s.includes('tight')) return { ok: false, label: raw };

    if (s === 'true' || s === '1' || s === 'on' || s.includes('yes')) {
      return { ok: true, label: raw };
    }

    if (s.includes('possible')) {
      return { ok: options.possibleOk, label: raw };
    }

    if (s.includes('likely')) return { ok: true, label: raw };
    return { ok: false, label: raw };
  }

  private buildWhatMeansSection_(params: {
    blockSizeM2: number | null;
    grannyFlat: string;
    dualOcc: string;
    subdivision: string;
    housePosition: string;
    treesVisibleCount: number;
    sewerLocation: string;
  }): PaidReport['whatMeans'] {
    const bullets: ReportBullet[] = [];

    const gf = this.normalizeFeasibility_(params.grannyFlat, { possibleOk: true });
    const dual = this.normalizeFeasibility_(params.dualOcc, { possibleOk: false });
    const sub = this.normalizeFeasibility_(params.subdivision, { possibleOk: false });

    bullets.push({
      icon: gf.ok ? '✓' : '✘',
      title: 'Granny flat',
      text: gf.ok
        ? 'Add a granny flat behind the existing house (up to 90m²), subject to setbacks, tree constraints, and access.'
        : 'Adding a granny flat behind the existing house would be difficult due to rear yard space, site coverage, or tree protection zones.',
    });

    bullets.push({
      icon: dual.ok ? '✓' : '✘',
      title: 'Dual occupancy',
      text: dual.ok
        ? 'Dual occupancy (two dwellings on one title) may be possible, likely requiring removal of the existing house.'
        : 'Dual occupancy would face constraints due to access, trees, heritage, or other site limitations.',
    });

    bullets.push({
      icon: sub.ok ? '✓' : '✘',
      title: 'Subdivision',
      text: sub.ok
        ? 'Subdivision into two separate titles may be possible, subject to minimum lot sizes and access requirements.'
        : 'Subdivision would face constraints due to access or minimum lot size requirements.',
    });

    const qualifiesThree =
      params.blockSizeM2 !== null ? params.blockSizeM2 >= 800 : false;
    const blockSizeText = this.formatArea_(params.blockSizeM2);

    bullets.push({
      icon: qualifiesThree ? '✓' : '✘',
      title: 'Three dwellings',
      text: qualifiesThree
        ? `Possible in theory. At ${blockSizeText}, your block exceeds the 800m² threshold. However, fitting three dwellings while managing trees, sewer servicing, and parking can be challenging. A detailed feasibility review would confirm whether this is realistic.`
        : 'Not available on blocks under the 800m² threshold.',
    });

    return {
      intro:
        "Based on the assessment above, here is what you could typically do given the constraints identified on your block:",
      bullets,
      summary: this.buildSummary_({
        housePosition: params.housePosition,
        treesVisibleCount: params.treesVisibleCount,
        sewerLocation: params.sewerLocation,
        grannyFlatOk: gf.ok,
        dualOk: dual.ok,
      }),
    };
  }

  private buildSummary_(params: {
    housePosition: string;
    treesVisibleCount: number;
    sewerLocation: string;
    grannyFlatOk: boolean;
    dualOk: boolean;
  }): string {
    const pos = String(params.housePosition || '').trim().toLowerCase();
    const hasTrees = params.treesVisibleCount > 0;
    const sewerRear =
      String(params.sewerLocation || '').trim().toLowerCase().includes('rear') ||
      String(params.sewerLocation || '').trim().toLowerCase().includes('through');

    if (!params.grannyFlatOk && params.dualOk && (pos.includes('middle') || pos.includes('rear') || pos.includes('back'))) {
      return `Your block has strong underlying metrics for redevelopment under the Missing Middle reforms. The key constraint is the existing house — its size and position leave limited room for additions while it remains. The most viable pathway is a knockdown-rebuild scenario${hasTrees ? ', designing around tree protection zones' : ''}${sewerRear ? ' and sewer constraints' : ''}.`;
    }

    if (params.grannyFlatOk && !hasTrees) {
      return 'Your block appears well suited to a secondary residence while retaining the existing house, subject to confirming access and services in a detailed feasibility review.';
    }

    return 'Your block has redevelopment potential, but the achievable outcome depends on detailed due diligence of access, trees, services, and other site constraints.';
  }

  private buildNextStepSection_(intentionRaw: string): PaidReport['nextStep'] {
    const s = String(intentionRaw || '').trim().toLowerCase();

    const bullets = [
      'Lease purpose clause — whether your lease permits multiple dwellings or requires a variation',
      'Tree status — confirming which trees are protected and mapping their protection zones',
      'Services capacity — whether sewer, stormwater, and electrical networks can support additional dwellings without upgrades',
      'Solar access and overshadowing — how orientation and neighbours affect building envelopes',
      'Parking layout — whether compliant parking can be achieved on site',
      'Preliminary site layout options — showing what could realistically fit',
      'High-level cost estimates and indicative end values',
    ];

    if (s.includes('develop')) {
      return {
        paragraphs: [
          "You indicated you're interested in developing the site yourself.",
          "Your recommended next step is a Detailed Feasibility Review. This confirms the factors we can't verify from public mapping and gives you a clear go/no-go decision before engaging architects, planners, or builders.",
          'We offer this as a fixed-fee service and can discuss your site in a no-obligation call.',
        ],
        bullets,
      };
    }

    if (s.includes('joint') || s.includes('partner')) {
      return {
        paragraphs: [
          "You indicated you're interested in partnering or joint venturing on this site.",
          'BlockPlanner works with landowners who want to unlock the value of their site without taking on the full risk and complexity of development.',
          'Your recommended next step is a Detailed Feasibility Review. If the numbers stack up, we can then discuss partnership structures and delivery options.',
          'Book a call with our team to discuss your options.',
        ],
        bullets,
      };
    }

    if (s.includes('sell')) {
      return {
        paragraphs: [
          "You indicated you're interested in selling the property, potentially with development upside.",
          'A Detailed Feasibility Review helps de-risk the opportunity for buyers by confirming constraints and buildable outcomes, so you can market the site with confidence.',
          'Book a call with our team to discuss your options.',
        ],
        bullets,
      };
    }

    return {
      paragraphs: [
        "You indicated you're exploring your options at this stage.",
        "That's a smart approach. When you're ready to take the next step, a Detailed Feasibility Review will confirm the things we can't check from public mapping and give you a clear picture of what's possible, what it would cost, and whether it makes financial sense.",
        "There's no obligation to proceed — it simply gives you the information to make a confident decision.",
        'Book a call with our team when you are ready, or reply with any questions.',
      ],
      bullets,
    };
  }

  private redactEmail_(email: string): string {
    const value = String(email || '').trim();
    if (!value) return '—';

    const [local, domain] = value.split('@');
    if (!domain) return 'REDACTED';

    const safeLocal =
      local.length <= 2
        ? local.charAt(0) + '*'
        : local.slice(0, 2) + '***';

    return `${safeLocal}@${domain}`;
  }

  private buildDeliveryAttachmentFilename_(params: {
    reportId?: string;
    rowNumber: number;
    fullAddress: string;
  }): string {
    const id =
      (params.reportId && String(params.reportId).trim()) || `row-${params.rowNumber}`;

    const addressPart = String(params.fullAddress || '')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const base = addressPart
      ? `BlockPlanner_Report_${addressPart}_${id}`
      : `BlockPlanner_Report_${id}`;

    const maxBaseLen = 140;
    const trimmedBase = base.length > maxBaseLen ? base.slice(0, maxBaseLen) : base;
    return `${trimmedBase}.pdf`;
  }

  private async downloadPdf_(url: string): Promise<Buffer> {
    const timeoutMs = Number(process.env.DASHBOARD_DELIVERY_PDF_TIMEOUT_MS || 30_000);
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(url, { method: 'GET', signal: abortController.signal });
      if (!response.ok) {
        throw new Error(`PDF download failed (status=${response.status})`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        const name = String((error as { name?: unknown }).name || '');
        if (name === 'AbortError') {
          throw new Error(`PDF download timed out after ${timeoutMs}ms`);
        }
      }
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private formatQualifiesFor_(
    rows: { allowed: string; qualifies: boolean }[],
  ): string {
    const labels = rows.filter((r) => r.qualifies).map((r) => r.allowed);
    if (!labels.length) return 'No headline permissions based on block size.';
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
  }
}
