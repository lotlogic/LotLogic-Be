import { GoogleSheetsService } from '@modules/google-sheets/google-sheets.service';
import { MailService } from '@modules/mail/mail.service';
import { Injectable, Logger } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as pug from 'pug';
import * as puppeteer from 'puppeteer-core';

type ReportKeyValue = { label: string; value: string };

type ReportStatus = 'possible' | 'review' | 'not_available';

type ReportBullet = { status: ReportStatus; title: string; text: string };

type SiteSection = {
  key: string;
  title: string;
  metaItems?: ReportKeyValue[];
  paragraphs: string[];
  bullets?: string[];
};

type SectionContent = {
  metaItems: ReportKeyValue[];
  paragraphs: string[];
  bullets?: string[];
};

type ReportContact = {
  name: string;
  role: string;
  email: string;
  phone?: string;
  websiteUrl: string;
  websiteLabel: string;
  linkedinUrl?: string;
};

type PaidReport = {
  cover: {
    title: string;
    address: string;
    blockSection?: string;
    zoning: string;
    preparedFor: string;
    date: string;
    reportId?: string;
  };
  property: {
    blockSize: string;
    frontage: string;
    zone: string;
    intention: string;
    note: string;
  };
  imagery: {
    url: string;
    label: string;
    note: string;
  } | null;
  executiveSummary: {
    title: string;
    intro: string;
    bullets: ReportBullet[];
    summary?: string;
  };
  siteSections: SiteSection[];
  nextStep: {
    intentionLabel: string;
    title: string;
    paragraphs: string[];
    checklist: string[];
    closing: string;
    cta: string;
  };
  disclaimer: { paragraphs: string[] };
  contact: ReportContact;
};

@Injectable()
export class DashboardReportService {
  private readonly logger = new Logger(DashboardReportService.name);
  private blobServiceClient: BlobServiceClient | null = null;

  constructor(
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly mailService: MailService,
  ) {}

  async processDashboardTrigger(
    payload: Record<string, unknown>,
  ): Promise<void> {
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

      const report = this.buildPaidReport(payload);
      await this.resolveImageryForRender_(report, { rowNumber, reportId });
      const html = this.renderHtml(report);
      const pdf = await this.renderPdf(html, { rowNumber, reportId });
      const pdfUrl = await this.uploadPdf(pdf, { rowNumber, reportId });
      const updateResponse =
        await this.googleSheetsService.updateGoogleSheetsRow({
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
      }

      this.logger.log(
        `Dashboard report job completed (row=${rowNumber}${
          reportId ? ` reportId=${reportId}` : ''
        })`,
      );
    } catch (error) {
      this.logger.error(
        `Dashboard report generation failed (row=${
          rowNumber ?? 'unknown'
        }${reportId ? ` reportId=${reportId}` : ''})`,
      );
    }
  }

  async processDashboardDelivery(
    payload: Record<string, unknown>,
  ): Promise<boolean> {
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
      const emailOverride = String(
        process.env.GOOGLE_SHEETS_DELIVERY_EMAIL_OVERRIDE || '',
      ).trim();
      const recipientEmail = emailOverride || clientEmail;

      this.logger.log(
        `Dashboard delivery job started (row=${rowNumber}${
          reportId ? ` reportId=${reportId}` : ''
        })`,
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

      const subject = `Your BlockPlanner Site Assessment Report${
        fullAddress ? ` — ${fullAddress}` : ''
      }`;

      const filename = this.buildDeliveryAttachmentFilename_({
        reportId,
        rowNumber,
        fullAddress,
      });
      const contact = this.buildContactDetails_();

      await this.mailService.sendEmailOrThrow({
        subject,
        template: 'dashboard-delivery-email',
        context: {
          clientName,
          address: fullAddress || address || suburb || '',
          reportId: reportId || '',
          contact,
        },
        emailsList: recipientEmail,
        attachments: [
          {
            filename,
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
        senderProfile: 'blockplanner',
      });

      const deliveryDate = new Date().toISOString();
      const updateResponse =
        await this.googleSheetsService.updateGoogleSheetsDelivery({
          rowNumber,
          deliveryStatus: 'Sent',
          deliveryDate,
        });

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
      }

      this.logger.log(
        `Dashboard delivery job completed (row=${rowNumber}${
          reportId ? ` reportId=${reportId}` : ''
        })`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Dashboard delivery failed (row=${rowNumber ?? 'unknown'}${
          reportId ? ` reportId=${reportId}` : ''
        })`,
      );
      return false;
    }
  }

  private buildPaidReport(payload: Record<string, unknown>): PaidReport {
    const address = this.readValue(payload, 'Address');
    const suburb = this.readValue(payload, 'Suburb');
    const zone = this.readValue(payload, 'Zone');
    const intentionRaw = this.readValue(payload, 'Intention');
    const intention = this.normalizeIntention_(intentionRaw);
    const preparedFor =
      this.readValue(payload, 'Client name') ||
      this.readValue(payload, 'Client email') ||
      'Customer';
    const reportId = this.readValue(payload, 'Report ID');

    const timestampRaw = this.readRaw(payload, 'Timestamp');
    const date = this.formatDate_(
      timestampRaw ? new Date(String(timestampRaw)) : new Date(),
    );

    const coverAddress = [address, suburb].filter(Boolean).join(', ') || '—';
    const blockSection = this.buildBlockSection_(payload);
    const imagery = this.buildImagery_(payload, {
      address,
      suburb,
      coverAddress,
    });

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
      this.normalizeToFloat_(
        this.readRaw(payload, 'Max building allowed (m²)'),
      ) ?? (blockSizeM2 !== null ? blockSizeM2 * 0.5 : null);

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
    const executiveSummary = this.buildExecutiveSummary_({
      blockSizeM2,
      grannyFlat,
      dualOcc,
      subdivision,
      housePosition,
      treesVisibleCount,
      sewerLocation,
    });

    const siteSections: SiteSection[] = [
      {
        key: 'planning-context',
        title: 'Planning context',
        paragraphs: this.buildZoningParagraphs_(zone),
      },
      {
        key: 'existing-house',
        title: 'Existing house',
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
      {
        key: 'rear-yard',
        title: 'Rear yard space',
        metaItems: [
          ...(rearYardCategory
            ? [{ label: 'Rear yard', value: rearYardCategory }]
            : []),
          ...(rearYardDepthM !== null
            ? [{ label: 'Depth', value: this.formatMeters_(rearYardDepthM) }]
            : []),
        ],
        paragraphs: this.buildRearYardParagraphs_(
          rearYardCategory,
          rearYardDepthM,
        ),
      },
      {
        key: 'site-coverage',
        title: 'Site coverage',
        paragraphs: this.buildSiteCoverageParagraphs_({
          blockSizeM2,
          maxBuildingAllowedM2,
          houseFootprintM2,
          remainingSiteCoverageM2,
        }),
      },
      {
        key: 'trees',
        title: 'Trees',
        ...this.buildTreesSection_({
          treesVisibleCount,
          treeLocation,
        }),
      },
      {
        key: 'heritage',
        title: 'Heritage',
        ...this.buildHeritageSection_(heritageOverlay),
      },
      {
        key: 'easements',
        title: 'Easements',
        ...this.buildEasementsSection_(easementImpact),
      },
      {
        key: 'sewer',
        title: 'Sewer',
        ...this.buildSewerSection_(sewerLocation),
      },
      {
        key: 'driveway',
        title: 'Driveway and access',
        ...this.buildDrivewaySection_({
          frontageM,
          secondDriveway,
        }),
      },
    ];

    return {
      cover: {
        title: 'BlockPlanner Property Assessment Report',
        address: coverAddress,
        ...(blockSection ? { blockSection } : {}),
        zoning: zoneDisplay || zone || '—',
        preparedFor,
        date,
        ...(reportId ? { reportId } : {}),
      },
      property: {
        blockSize: this.formatArea_(blockSizeM2),
        frontage: this.formatMeters_(frontageM),
        zone: zoneDisplay || zone || '—',
        intention: intention.label,
        note: 'Indicative only. Measurements are based on ACT Government mapping, aerial imagery and publicly available planning information.',
      },
      imagery,
      executiveSummary,
      siteSections,
      nextStep: this.buildNextStepSection_(intention),
      disclaimer: {
        paragraphs: [
          'This report is based on ACT Government mapping, aerial imagery and publicly available planning information. It is not a formal planning assessment, survey, engineering report or guarantee of approval.',
          'All development must comply with ACT laws, the Territory Plan and technical requirements. Site-specific conditions — including exact tree status, easement locations, sewer alignment, lease provisions and heritage requirements — should be confirmed through detailed due diligence before committing to any design or construction.',
          'BlockPlanner provides strategic guidance and can coordinate further feasibility, planning and specialist input where required.',
        ],
      },
      contact: this.buildContactDetails_(),
    };
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
      await page.setContent(html, { waitUntil: 'load', timeout: 60_000 });

      const imageSnapshot = await page.evaluate(() =>
        Array.from(document.images).map((image) => ({
          complete: image.complete,
          naturalWidth: image.naturalWidth || 0,
        })),
      );

      const hasBrokenImages = imageSnapshot.some(
        (image) => !image.complete || image.naturalWidth === 0,
      );
      if (hasBrokenImages) {
        this.logger.warn(
          `Dashboard report removing broken image panel${ctx}`,
        );
        await page.evaluate(() => {
          document
            .querySelectorAll('.image-panel')
            .forEach((element) => element.remove());
        });
      }

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
      process.env.CHROME_EXECUTABLE_PATH ||
      process.env.PUPPETEER_EXECUTABLE_PATH;
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

  private readFirstValue_(
    payload: Record<string, unknown>,
    labels: string[],
  ): string {
    for (const label of labels) {
      const value = this.readValue(payload, label).trim();
      if (value) return value;
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
    if (value === null || value === undefined || !Number.isFinite(value))
      return '—';
    return `${Math.round(value)} m²`;
  }

  private formatMeters_(value: number | null | undefined): string {
    if (value === null || value === undefined || !Number.isFinite(value))
      return '—';
    if (Math.abs(value - Math.round(value)) < 0.05)
      return `${Math.round(value)} m`;
    return `${value.toFixed(1)} m`;
  }

  private formatDate_(date: Date): string {
    const d =
      date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
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

  private buildBlockSection_(payload: Record<string, unknown>): string {
    const combined = this.readFirstValue_(payload, [
      'Block / Section',
      'Block/Section',
      'Block section',
    ]);
    if (combined) return combined;

    const block = this.readFirstValue_(payload, ['Block number', 'Block']);
    const section = this.readFirstValue_(payload, ['Section number', 'Section']);

    if (block && section) return `Block ${block} / Section ${section}`;
    if (block) return `Block ${block}`;
    if (section) return `Section ${section}`;
    return '';
  }

  private normalizeIntention_(raw: string): {
    key:
      | 'sell'
      | 'develop_myself'
      | 'have_someone_develop_for_me'
      | 'open_to_options';
    label: string;
  } {
    const value = String(raw || '')
      .trim()
      .toLowerCase();

    if (value.includes('sell')) {
      return { key: 'sell', label: 'Sell' };
    }

    if (
      value.includes('joint') ||
      value.includes('partner') ||
      value.includes('someone develop') ||
      value.includes('develop for me')
    ) {
      return {
        key: 'have_someone_develop_for_me',
        label: 'Have someone develop for me',
      };
    }

    if (value.includes('develop')) {
      return { key: 'develop_myself', label: 'Develop myself' };
    }

    if (
      value.includes('explor') ||
      value.includes('just looking') ||
      value.includes('open')
    ) {
      return { key: 'open_to_options', label: 'Open to options' };
    }

    return { key: 'open_to_options', label: 'Open to options' };
  }

  private buildContactDetails_(): PaidReport['contact'] {
    const name = String(process.env.BLOCKPLANNER_CONTACT_NAME || '').trim();
    const role = String(process.env.BLOCKPLANNER_CONTACT_ROLE || '').trim();
    const email = String(process.env.BLOCKPLANNER_CONTACT_EMAIL || '').trim();
    const phone = String(process.env.BLOCKPLANNER_CONTACT_PHONE || '').trim();
    const websiteUrl = String(process.env.BLOCKPLANNER_WEBSITE_URL || '').trim();
    const linkedinUrl = String(
      process.env.BLOCKPLANNER_LINKEDIN_URL || '',
    ).trim();

    const safeWebsiteUrl = websiteUrl || 'https://blockplanner.com.au';
    const safeLinkedinUrl =
      linkedinUrl || 'https://www.linkedin.com/in/beerandjobs/';
    const websiteLabel = safeWebsiteUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');

    return {
      name: name || 'The BlockPlanner Team',
      role: role || 'Property strategy and feasibility',
      email: email || 'mitch@blockplanner.com.au',
      phone: phone || '0401 637 961',
      websiteUrl: safeWebsiteUrl,
      websiteLabel,
      linkedinUrl: safeLinkedinUrl,
    };
  }

  private buildImagery_(
    payload: Record<string, unknown>,
    params: { address: string; suburb: string; coverAddress: string },
  ): PaidReport['imagery'] {
    const dashboardImageUrl = this.readFirstValue_(payload, [
      'Map image URL',
      'Aerial image URL',
      'ACTMapi image URL',
      'Property image URL',
      'Image URL',
    ]);

    if (dashboardImageUrl) {
      return {
        url: dashboardImageUrl,
        label: 'Property image',
        note: 'Optional staff-supplied imagery can highlight easements, servicing and site context that standard public basemaps miss.',
      };
    }

    const fallbackMapUrl = this.buildGoogleStaticMapUrl_(payload, params);
    if (!fallbackMapUrl) {
      return null;
    }

    return {
      url: fallbackMapUrl,
      label: 'Property snapshot',
      note: 'Satellite imagery from Google Maps used because no staff-supplied property image was provided.',
    };
  }

  private buildGoogleStaticMapUrl_(
    payload: Record<string, unknown>,
    params: { address: string; suburb: string; coverAddress: string },
  ): string | null {
    const apiKey = String(process.env.GOOGLE_MAPS_API_KEY || '').trim();
    if (!apiKey) return null;

    const lat = this.normalizeToFloat_(
      this.readRaw(payload, 'Latitude') ?? this.readRaw(payload, 'lat'),
    );
    const lng = this.normalizeToFloat_(
      this.readRaw(payload, 'Longitude') ?? this.readRaw(payload, 'lng'),
    );

    const mapQuery =
      lat !== null && lng !== null
        ? `${lat},${lng}`
        : [params.address, params.suburb].filter(Boolean).join(', ');

    if (!mapQuery || mapQuery === '—') {
      return null;
    }

    const query = encodeURIComponent(mapQuery);
    return `https://maps.googleapis.com/maps/api/staticmap?size=640x360&scale=2&zoom=18&maptype=satellite&center=${query}&markers=color:0xC4622D|${query}&key=${encodeURIComponent(
      apiKey,
    )}`;
  }

  private async resolveImageryForRender_(
    report: PaidReport,
    ctxArgs?: { rowNumber?: number; reportId?: string },
  ): Promise<void> {
    if (!report.imagery?.url) {
      return;
    }

    if (/^data:/i.test(report.imagery.url)) {
      return;
    }

    const imageDataUrl = await this.fetchImageAsDataUrl_(report.imagery.url, {
      label: report.imagery.label,
      ...ctxArgs,
    });

    if (!imageDataUrl) {
      report.imagery = null;
      return;
    }

    report.imagery.url = imageDataUrl;
  }

  private async fetchImageAsDataUrl_(
    url: string,
    ctxArgs?: { rowNumber?: number; reportId?: string; label?: string },
  ): Promise<string | null> {
    const timeoutMs = Number(
      process.env.DASHBOARD_IMAGE_FETCH_TIMEOUT_MS || 20_000,
    );
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);
    const ctx = this.formatCtx_(ctxArgs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          Accept: 'image/*,*/*;q=0.8',
          'User-Agent': 'BlockPlanner Dashboard Report Renderer',
        },
      });

      if (!response.ok) {
        this.logger.warn(
          `Dashboard report image fetch failed (status=${response.status})${ctx}`,
        );
        return null;
      }

      const contentType = String(response.headers.get('content-type') || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      if (!contentType.startsWith('image/')) {
        this.logger.warn(
          `Dashboard report image fetch returned non-image content-type=${
            contentType || 'unknown'
          }${ctx}`,
        );
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (!buffer.length) {
        this.logger.warn(
          `Dashboard report image fetch returned empty body${ctx}`,
        );
        return null;
      }

      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        const name = String((error as { name?: unknown }).name || '');
        if (name === 'AbortError') {
          this.logger.warn(
            `Dashboard report image fetch timed out after ${timeoutMs}ms${ctx}`,
          );
          return null;
        }
      }

      this.logger.warn(`Dashboard report image fetch threw${ctx}`);
      return null;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private buildZoningParagraphs_(zoneRaw: string): string[] {
    const z = String(zoneRaw || '').trim();
    const upper = z.toUpperCase();
    const label = this.formatZoneDisplay_(z) || z || 'your zone';

    if (upper.includes('RZ1')) {
      return [
        `Your block is zoned ${label}.`,
        'RZ1 is primarily intended for lower-intensity suburban housing. In practice, the real opportunity on any individual site depends on the existing house, access, trees, easements, servicing and the usable dimensions left to work with.',
        'This report focuses on those practical constraints so you can see what is likely to be realistic before spending money on design or formal planning advice.',
      ];
    }

    if (upper.includes('RZ2')) {
      return [
        `Your block is zoned ${label}.`,
        'RZ2 is generally more flexible than RZ1 and can support a broader range of residential outcomes, but the practical result still turns on the details of the site and the constraints already on it.',
        'This report focuses on those real-world constraints so you can judge whether the apparent zoning upside is likely to translate into a workable project.',
      ];
    }

    return [
      `Your block is zoned ${label}.`,
      "Zoning sets the starting point for what's possible, but it does not tell the whole story. The sections below assess the site conditions that usually determine whether a project is realistic in practice.",
    ];
  }

  private buildExistingHouseParagraphs_(housePositionRaw: string): string[] {
    const pos = String(housePositionRaw || '')
      .trim()
      .toLowerCase();

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
    const c = String(categoryRaw || '')
      .trim()
      .toLowerCase();

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
    const s = String(raw || '')
      .trim()
      .toLowerCase();
    if (!s) return 0;
    if (s.includes('none') || s === '0') return 0;
    if (s.includes('3+') || s.includes('3 plus') || s.includes('three'))
      return 3;
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
  }): SectionContent {
    const { treesVisibleCount, treeLocation } = params;

    const metaItems: ReportKeyValue[] = [
      {
        label: 'Large trees visible',
        value:
          treesVisibleCount >= 3
            ? '3+'
            : String(Math.max(0, treesVisibleCount)),
      },
    ];
    if (treeLocation)
      metaItems.push({ label: 'Tree location', value: treeLocation });

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
    const s = String(value || '')
      .trim()
      .toLowerCase();
    return s === 'yes' || s === 'y' || s === 'true' || s === '1' || s === 'on';
  }

  private buildHeritageSection_(
    heritageOverlayRaw: string,
  ): SectionContent {
    const yes = this.isYesLike_(heritageOverlayRaw);
    const metaValue = heritageOverlayRaw
      ? heritageOverlayRaw
      : yes
        ? 'Yes'
        : 'No';

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

  private buildEasementsSection_(easementRaw: string): SectionContent {
    const s = String(easementRaw || '')
      .trim()
      .toLowerCase();
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

  private buildSewerSection_(sewerRaw: string): SectionContent {
    const s = String(sewerRaw || '')
      .trim()
      .toLowerCase();
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
  }): SectionContent {
    const frontageText = this.formatMeters_(params.frontageM);
    const s = String(params.secondDriveway || '')
      .trim()
      .toLowerCase();

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
    const s = String(raw || '')
      .trim()
      .toLowerCase();
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

  private buildExecutiveSummary_(params: {
    blockSizeM2: number | null;
    grannyFlat: string;
    dualOcc: string;
    subdivision: string;
    housePosition: string;
    treesVisibleCount: number;
    sewerLocation: string;
  }): PaidReport['executiveSummary'] {
    const bullets: ReportBullet[] = [];

    const gf = this.normalizeFeasibility_(params.grannyFlat, {
      possibleOk: true,
    });
    const dual = this.normalizeFeasibility_(params.dualOcc, {
      possibleOk: false,
    });
    const sub = this.normalizeFeasibility_(params.subdivision, {
      possibleOk: false,
    });

    bullets.push({
      status: gf.ok ? 'possible' : 'review',
      title: 'Keep the house and add a second dwelling',
      text: gf.ok
        ? 'A self-contained dwelling behind the existing home appears achievable in principle, subject to setbacks, tree protection zones, access and services.'
        : 'This path looks constrained by the current house position, rear yard depth, site coverage or likely tree and access issues.',
    });

    bullets.push({
      status: dual.ok ? 'possible' : 'review',
      title: 'Remove the house and build two homes',
      text: dual.ok
        ? 'A knockdown-rebuild pathway with two dwellings looks plausible, though design, access, servicing and site constraints still need to be confirmed.'
        : 'A two-dwelling outcome may still be possible, but it would need closer testing against access, trees, heritage, servicing or other site limitations.',
    });

    bullets.push({
      status: sub.ok ? 'possible' : 'review',
      title: 'Create separate titles and sell',
      text: sub.ok
        ? 'Creating separate titles looks plausible in principle, subject to the legal pathway, layout, access and certification requirements.'
        : 'Separate titles are not an obvious outcome from the high-level evidence alone and would need detailed testing before being relied on.',
    });

    const qualifiesThree =
      params.blockSizeM2 !== null ? params.blockSizeM2 >= 800 : false;
    const blockSizeText = this.formatArea_(params.blockSizeM2);

    bullets.push({
      status: qualifiesThree ? 'review' : 'not_available',
      title: 'Push for a larger redevelopment',
      text: qualifiesThree
        ? `At ${blockSizeText}, the block is large enough to justify asking the question, but fitting a more intensive outcome while managing trees, servicing, parking and private open space could still be difficult.`
        : 'There is not enough headline site area here to treat a more intensive redevelopment outcome as a realistic starting assumption.',
    });

    return {
      title: 'Executive summary',
      intro:
        'This is the high-level view of what appears most realistic based on the available evidence and the constraints identified on your block.',
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
    const pos = String(params.housePosition || '')
      .trim()
      .toLowerCase();
    const hasTrees = params.treesVisibleCount > 0;
    const sewerRear =
      String(params.sewerLocation || '')
        .trim()
        .toLowerCase()
        .includes('rear') ||
      String(params.sewerLocation || '')
        .trim()
        .toLowerCase()
        .includes('through');

    if (
      !params.grannyFlatOk &&
      params.dualOk &&
      (pos.includes('middle') || pos.includes('rear') || pos.includes('back'))
    ) {
      return `Your block has strong underlying redevelopment metrics, but the existing house is the main constraint. The clearest path is likely to be a knockdown-rebuild scenario${hasTrees ? ', designed around tree protection zones' : ''}${sewerRear ? ' and sewer constraints' : ''}.`;
    }

    if (params.grannyFlatOk && !hasTrees) {
      return 'Your block appears well suited to a secondary residence while retaining the existing house, subject to confirming access and services in a detailed feasibility review.';
    }

    return 'Your block has redevelopment potential, but the achievable outcome depends on detailed due diligence of access, trees, services, and other site constraints.';
  }

  private buildNextStepSection_(intention: {
    key:
      | 'sell'
      | 'develop_myself'
      | 'have_someone_develop_for_me'
      | 'open_to_options';
    label: string;
  }): PaidReport['nextStep'] {
    switch (intention.key) {
      case 'sell':
        return {
          intentionLabel: intention.label,
          title: 'Your next step',
          paragraphs: [
            "You've made a smart move getting here. This assessment gives you a clear, honest picture of what your block can support under current planning rules. It's a high-level starting point, not a full feasibility analysis, but it is the right foundation before making decisions.",
            "Here's what the path to selling a developed asset typically looks like:",
          ],
          checklist: [
            'Check your Crown lease and vary it if needed',
            'Engage a designer and prepare plans',
            'Lodge and obtain development approval',
            'Build and certify the dwelling',
            'Separate the titles (unit titling)',
            'Sell',
          ],
          closing:
            "If you want to go deeper — a detailed feasibility analysis, professional planning advice, or an introduction to the right people to move this forward — that's exactly what we can help with next.",
          cta: 'Talk to BlockPlanner about the next step',
        };
      case 'develop_myself':
        return {
          intentionLabel: intention.label,
          title: 'Your next step',
          paragraphs: [
            'Getting here means you already have a clearer picture of your block than most people do. This is a high-level development assessment — it tells you what the planning rules allow. The detailed numbers and design work come next.',
            "Here's what the development journey typically looks like:",
          ],
          checklist: [
            'Check your Crown lease and vary it if needed',
            'Engage a designer to prepare compliant plans',
            'Lodge a development application',
            'Complete the public notification period',
            'Receive development approval',
            'Appoint a building certifier',
            'Build',
            'Receive a Certificate of Occupancy and Use',
          ],
          closing:
            "From DA lodgement to decision is usually one to three months for straightforward residential projects, with construction added on top. When you're ready to take the next step — whether that's a detailed feasibility analysis, professional planning advice, or connecting with the right designer or builder — we can point you in the right direction.",
          cta: 'Talk to BlockPlanner about feasibility and planning',
        };
      case 'have_someone_develop_for_me':
        return {
          intentionLabel: intention.label,
          title: 'Your next step',
          paragraphs: [
            "This assessment gives you a solid, honest foundation — it shows what your block can support under current planning rules. A detailed feasibility analysis is the natural next step, and that's something we can help with directly.",
            'Having someone else manage the development is a good option for a lot of people. The journey broadly looks like this:',
          ],
          checklist: [
            'Understand your options and agree on a structure',
            'Have the developer manage Crown lease, planning and design',
            'Lodge and approve the development application',
            'Have the developer manage construction and certification',
            'Settle or receive returns at completion',
          ],
          closing:
            'We work with experienced local developers who know the ACT market well, and we can help with the planning advice and feasibility work needed before you commit to a structure.',
          cta: 'Talk to BlockPlanner about developer pathways',
        };
      case 'open_to_options':
      default:
        return {
          intentionLabel: intention.label,
          title: 'Your next step',
          paragraphs: [
            "You haven't landed on a direction yet — and that's a sensible place to be. This assessment shows you what your block can support. What you do with that is worth thinking through properly before committing to anything.",
            'The main paths from here:',
          ],
          checklist: [
            'Sell the block as-is with development potential clearly documented',
            'Develop and hold — build a second dwelling and rent it',
            'Develop and sell — create separate titles and sell one or both',
            'Bring in a development partner and retain an interest in the outcome',
          ],
          closing:
            'Each path has a different process, timeline and financial shape. If you want to understand the numbers behind any of them, a proper feasibility analysis and professional planning advice are the logical next step. Both are things we can help with, with no commitment required just to have the conversation.',
          cta: 'Talk to BlockPlanner about your options',
        };
    }
  }

  private formatCtx_(params?: {
    rowNumber?: number;
    reportId?: string;
  }): string {
    if (!params) {
      return '';
    }

    const parts = [
      params.rowNumber ? `row=${params.rowNumber}` : null,
      params.reportId ? `reportId=${params.reportId}` : null,
    ].filter(Boolean);

    return parts.length ? ` (${parts.join(' ')})` : '';
  }

  private buildDeliveryAttachmentFilename_(params: {
    reportId?: string;
    rowNumber: number;
    fullAddress: string;
  }): string {
    const id =
      (params.reportId && String(params.reportId).trim()) ||
      `row-${params.rowNumber}`;

    const addressPart = String(params.fullAddress || '')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const base = addressPart
      ? `BlockPlanner_Report_${addressPart}_${id}`
      : `BlockPlanner_Report_${id}`;

    const maxBaseLen = 140;
    const trimmedBase =
      base.length > maxBaseLen ? base.slice(0, maxBaseLen) : base;
    return `${trimmedBase}.pdf`;
  }

  private async downloadPdf_(url: string): Promise<Buffer> {
    const timeoutMs = Number(
      process.env.DASHBOARD_DELIVERY_PDF_TIMEOUT_MS || 30_000,
    );
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: abortController.signal,
      });
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
