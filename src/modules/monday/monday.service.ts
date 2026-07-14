import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type {
  BlockplannerLeadsBoardSchema,
  BlockplannerPaidReportsBoardSchema,
  MondayColumnDefinition,
} from '@modules/monday/monday-board.schema';
import {
  MondayApiClient,
  MondayItemSummary,
} from '@modules/monday/monday-api.client';
import {
  BLOCKPLANNER_LEAD_TYPES,
  type BlockplannerLeadType,
  type BlockplannerPaidProductCode,
} from '@modules/blockplanner/blockplanner-product';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomInt } from 'crypto';

const ACT_TIME_ZONE = 'Australia/Sydney';
const MONDAY_WORKFLOW_MAPPINGS_FILE = join(
  __dirname,
  '..',
  '..',
  'config',
  'blockplanner-monday-workflows.json',
);
const CONFIGURED_PAID_PRODUCT_CODES = [
  'crown_lease',
  'feasibility_report',
] as const;
type ConfiguredPaidProductCode =
  (typeof CONFIGURED_PAID_PRODUCT_CODES)[number];
const PAID_REPORT_COLUMN_KEYS = [
  'name',
  'date',
  'email',
  'phone',
  'reportId',
  'address',
  'suburb',
  'blockSizeM2',
  'zone',
  'frontageM',
  'housePosition',
  'houseFootprintM2',
  'rearYardDepthM',
  'largeTreesVisible',
  'treeLocation',
  'registeredTrees',
  'heritageOverlay',
  'sewerLocation',
  'easementImpact',
  'shedInRear',
  'secondDrivewayFeasible',
  'mapImageUrl',
  'maxBuildingAllowedM2',
  'remainingSiteCoverageM2',
  'rearYardCategory',
  'grannyFlatKeepHouse',
  'dualOccRemoveHouse',
  'subdivisionPotential',
  'analystAssigned',
  'sendForQa',
  'qaCompleted',
  'finalPdfLink',
  'deliveryStatus',
  'deliveryDate',
  'escalation',
  'internalNotes',
  'intention',
  'stripePaymentId',
] as const;
const TREE_LOCATION_STATUS_KEYS = [
  'north',
  'south',
  'east',
  'west',
  'multiple',
  'middleOfBlock',
  'notApplicable',
] as const;
const REGISTERED_TREE_STATUS_KEYS = [
  'none',
  'oneTree',
  'multipleTrees',
  'protected',
  'unknown',
  'yes',
  'no',
] as const;
const DELIVERY_STATUS_KEYS = [
  'sent',
  'notStarted',
  'readyToSend',
] as const;
const INTENTION_STATUS_KEYS = [
  'openToOptions',
  'jointVenture',
  'sell',
  'developMyself',
] as const;

type ReportRequestPayload = {
  reportId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  address: string;
  suburb: string;
  blockSizeM2: string;
  zone: string;
  intention: string;
  checkoutMode: string;
  stripePaymentId: string;
  productCode: string;
  sourceApp: string;
};

type ConfiguredPaidProductBoard = {
  boardId: string;
  defaultGroupId: string;
  columns: {
    email?: string;
    phone?: string;
    reportId: string;
    stripePaymentId: string;
    address?: string;
    suburb?: string;
    intention?: string;
    sourceApp?: string;
    checkoutMode?: string;
    paymentDate?: string;
  };
};

type ConfiguredLeadBoard = {
  boardId: string;
  defaultGroupId: string;
  columns: {
    email: string;
    phone?: string;
    address?: string;
    suburb?: string;
    intentUse?: string;
    intentReason?: string;
    contactOptIn?: string;
    propertyType?: string;
    buildEra?: string;
    bedrooms?: string;
    bathrooms?: string;
    floorArea?: string;
    upgrades?: string;
    totalLow?: string;
    totalExpected?: string;
    totalHigh?: string;
    sourceApp?: string;
    details?: string;
    createdDate?: string;
  };
};

type ConfiguredLeadBoardMap = Partial<
  Record<BlockplannerLeadType, ConfiguredLeadBoard>
>;

type ConfiguredPaidProductBoardMap = Partial<
  Record<ConfiguredPaidProductCode, ConfiguredPaidProductBoard>
>;

type FreeAssessmentLeadPayload = {
  email: string;
};

@Injectable()
export class MondayService {
  private readonly logger = new Logger(MondayService.name);
  private client: MondayApiClient | null = null;
  private workflowMappings: Record<string, unknown> | null = null;
  private paidReportsBoardSchema: BlockplannerPaidReportsBoardSchema | null =
    null;
  private leadsBoardSchema: BlockplannerLeadsBoardSchema | null = null;
  private configuredPaidProductBoards: ConfiguredPaidProductBoardMap | null =
    null;
  private configuredLeadBoards: ConfiguredLeadBoardMap | null = null;

  generateReportId(now = new Date()): string {
    const { year, month, day } = this.getActDateTimeParts(now);
    const suffix = String(randomInt(1000, 10000));
    return `BP-${year}${month}${day}-${suffix}`;
  }

  async upsertPaidProductRequest(
    productCode: BlockplannerPaidProductCode,
    rawPayload: Record<string, unknown>,
  ): Promise<{
    action: 'created' | 'updated';
    itemId: string;
    reportId: string;
  }> {
    if (productCode === 'site_report') {
      return this.upsertPaidReportRequest(rawPayload);
    }

    return this.upsertConfiguredPaidProductRequest(productCode, rawPayload);
  }

  isPaidProductConfigured(
    productCode: BlockplannerPaidProductCode,
  ): boolean {
    if (productCode === 'site_report') {
      this.getBoardSchema();
      return true;
    }

    return Boolean(this.getConfiguredPaidProductBoardMap()[productCode]);
  }

  async createFreeAssessmentLead(rawPayload: Record<string, unknown>): Promise<{
    itemId: string;
  }> {
    const payload = this.normalizeFreeAssessmentLeadPayload(rawPayload);
    if (!this.isValidEmail(payload.email)) {
      throw new BadRequestException('Missing or invalid email');
    }

    const board = this.getLeadsBoardSchema();
    const client = this.getClient();
    const columnValues = this.buildFreeAssessmentLeadColumnValues(
      payload,
      board,
    );

    const created = await client.createItem(
      board.boardId,
      board.defaultGroupId,
      payload.email,
    );

    await client.changeMultipleColumnValues(
      board.boardId,
      created.id,
      columnValues,
    );

    this.logger.log(
      `Monday free assessment lead created (itemId=${created.id} email=${this.maskEmail(
        payload.email,
      )})`,
    );

    return {
      itemId: created.id,
    };
  }

  async createProductLead(
    leadType: BlockplannerLeadType,
    rawPayload: Record<string, unknown>,
  ): Promise<{ itemId: string }> {
    const email = this.normalizeToString(rawPayload.email);
    const name = this.normalizeToString(rawPayload.name);
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Missing or invalid email');
    }

    const board = this.getConfiguredLeadBoard(leadType);
    const client = this.getClient();
    const columnValues = this.buildConfiguredLeadColumnValues(
      rawPayload,
      board,
      email,
    );
    const itemName =
      name ||
      email ||
      this.normalizeToString(rawPayload.address) ||
      `${leadType} lead`;
    const created = await client.createItem(
      board.boardId,
      board.defaultGroupId,
      itemName,
    );

    await client.changeMultipleColumnValues(
      board.boardId,
      created.id,
      columnValues,
    );

    this.logger.log(
      `Monday ${leadType} lead created (itemId=${created.id} email=${this.maskEmail(email)})`,
    );

    return { itemId: created.id };
  }

  isProductLeadConfigured(leadType: BlockplannerLeadType): boolean {
    return Boolean(this.getConfiguredLeadBoardMap()[leadType]);
  }

  async upsertPaidReportRequest(rawPayload: Record<string, unknown>): Promise<{
    action: 'created' | 'updated';
    itemId: string;
    reportId: string;
  }> {
    const payload = this.normalizeReportRequestPayload(rawPayload);
    const board = this.getBoardSchema();
    const client = this.getClient();
    const existingItem = await this.findExistingPaidReportItem(payload);
    const itemName = this.buildItemName(payload);
    const columnValues = this.buildRequestColumnValues(payload, board, {
      setInitialWorkflowFields: !existingItem,
    });

    let itemId = existingItem?.id || '';
    let action: 'created' | 'updated' = 'updated';

    if (!itemId) {
      const created = await client.createItem(
        board.boardId,
        this.getTargetGroupId(board),
        itemName,
      );
      itemId = created.id;
      action = 'created';
    }

    await client.changeMultipleColumnValues(
      board.boardId,
      itemId,
      columnValues,
    );

    this.logger.log(
      `Monday paid report item ${action} (itemId=${itemId} reportId=${payload.reportId}${
        payload.stripePaymentId
          ? ` stripePaymentId=${payload.stripePaymentId}`
          : ''
      })`,
    );

    return {
      action,
      itemId,
      reportId: payload.reportId,
    };
  }

  private async upsertConfiguredPaidProductRequest(
    productCode: Exclude<BlockplannerPaidProductCode, 'site_report'>,
    rawPayload: Record<string, unknown>,
  ): Promise<{
    action: 'created' | 'updated';
    itemId: string;
    reportId: string;
  }> {
    const payload = this.normalizeReportRequestPayload(rawPayload);
    const board = this.getConfiguredPaidProductBoard(productCode);
    const client = this.getClient();
    const existingItem = await this.findExistingConfiguredPaidProductItem(
      payload,
      board,
    );
    const itemName = this.buildItemName(payload);
    const columnValues = this.buildConfiguredPaidProductColumnValues(
      payload,
      board,
    );

    let itemId = existingItem?.id || '';
    let action: 'created' | 'updated' = 'updated';

    if (!itemId) {
      const created = await client.createItem(
        board.boardId,
        board.defaultGroupId,
        itemName,
      );
      itemId = created.id;
      action = 'created';
    }

    await client.changeMultipleColumnValues(
      board.boardId,
      itemId,
      columnValues,
    );

    this.logger.log(
      `Monday ${productCode} item ${action} (itemId=${itemId} reportId=${payload.reportId} stripePaymentId=${payload.stripePaymentId})`,
    );

    return { action, itemId, reportId: payload.reportId };
  }

  async getNormalizedPaidReportPayload(
    itemId: string,
  ): Promise<Record<string, unknown>> {
    const item = await this.getPaidReportItem(itemId);
    return this.normalizeMondayItemToPayload(item);
  }

  async updatePaidReportItem(params: {
    itemId: string;
    finalPdfLink?: string;
    deliveryStatus?: string;
    deliveryDate?: string;
    internalNotes?: string;
    escalation?: string;
    qaCompleted?: string;
  }) {
    const board = this.getBoardSchema();
    const columnValues: Record<string, unknown> = {};

    if (params.finalPdfLink !== undefined) {
      columnValues[board.columns.finalPdfLink.id] = params.finalPdfLink.trim();
    }

    if (params.deliveryStatus !== undefined) {
      columnValues[board.columns.deliveryStatus.id] = {
        label: params.deliveryStatus,
      };
    }

    if (params.deliveryDate !== undefined) {
      const value = this.buildDateTimeValue(params.deliveryDate);
      if (value) {
        columnValues[board.columns.deliveryDate.id] = value;
      }
    }

    if (params.internalNotes !== undefined) {
      columnValues[board.columns.internalNotes.id] =
        params.internalNotes.trim();
    }

    if (params.escalation !== undefined) {
      columnValues[board.columns.escalation.id] = { label: params.escalation };
    }

    if (params.qaCompleted !== undefined) {
      columnValues[board.columns.qaCompleted.id] = {
        label: params.qaCompleted,
      };
    }

    return this.getClient().changeMultipleColumnValues(
      board.boardId,
      params.itemId,
      columnValues,
    );
  }

  extractItemIdFromWebhookPayload(body: Record<string, unknown>): string {
    const candidates = [
      body.itemId,
      body.item_id,
      body.pulseId,
      body.pulse_id,
      body['Item ID'],
      this.readNested(body, ['event', 'itemId']),
      this.readNested(body, ['event', 'item_id']),
      this.readNested(body, ['event', 'pulseId']),
      this.readNested(body, ['event', 'pulse_id']),
      this.readNested(body, ['event', 'pulseId']),
    ];

    for (const candidate of candidates) {
      const value = String(candidate || '').trim();
      if (value) return value;
    }

    return '';
  }

  shouldProcessDashboardTrigger(payload: Record<string, unknown>): boolean {
    return (
      this.normalizeStatusLabel(
        this.readPayloadValue(payload, 'send for QA?'),
      ) === this.normalizeStatusLabel(this.getBoardSchema().statusLabels.yes)
    );
  }

  shouldProcessDashboardDelivery(payload: Record<string, unknown>): boolean {
    return (
      this.normalizeStatusLabel(
        this.readPayloadValue(payload, 'Delivery status'),
      ) ===
      this.normalizeStatusLabel(
        this.getBoardSchema().statusLabels.deliveryStatus.readyToSend,
      )
    );
  }

  private async findExistingPaidReportItem(
    payload: ReportRequestPayload,
  ): Promise<MondayItemSummary | undefined> {
    const board = this.getBoardSchema();
    const client = this.getClient();
    const lookupColumnIds = [
      board.columns.reportId.id,
      board.columns.stripePaymentId.id,
    ];

    if (payload.stripePaymentId) {
      const byStripePaymentId = await client.listItemsByColumnValues(
        board.boardId,
        {
          columnId: board.columns.stripePaymentId.id,
          columnValues: [payload.stripePaymentId],
          limit: 2,
          columnIds: lookupColumnIds,
        },
      );
      if (byStripePaymentId.length > 1) {
        this.logger.warn(
          `Multiple monday items matched stripePaymentId=${payload.stripePaymentId}; using itemId=${byStripePaymentId[0]?.id || 'unknown'}`,
        );
      }
      if (byStripePaymentId[0]) return byStripePaymentId[0];
    }

    if (!payload.reportId) {
      return undefined;
    }

    const byReportId = await client.listItemsByColumnValues(board.boardId, {
      columnId: board.columns.reportId.id,
      columnValues: [payload.reportId],
      limit: 2,
      columnIds: lookupColumnIds,
    });

    if (byReportId.length > 1) {
      this.logger.warn(
        `Multiple monday items matched reportId=${payload.reportId}; using itemId=${byReportId[0]?.id || 'unknown'}`,
      );
    }

    return byReportId[0];
  }

  private async findExistingConfiguredPaidProductItem(
    payload: ReportRequestPayload,
    board: ConfiguredPaidProductBoard,
  ): Promise<MondayItemSummary | undefined> {
    const client = this.getClient();
    const lookupColumnIds = [
      board.columns.reportId,
      board.columns.stripePaymentId,
    ];

    if (payload.stripePaymentId) {
      const byStripePaymentId = await client.listItemsByColumnValues(
        board.boardId,
        {
          columnId: board.columns.stripePaymentId,
          columnValues: [payload.stripePaymentId],
          limit: 2,
          columnIds: lookupColumnIds,
        },
      );
      if (byStripePaymentId[0]) return byStripePaymentId[0];
    }

    if (!payload.reportId) return undefined;

    const byReportId = await client.listItemsByColumnValues(board.boardId, {
      columnId: board.columns.reportId,
      columnValues: [payload.reportId],
      limit: 2,
      columnIds: lookupColumnIds,
    });

    return byReportId[0];
  }

  private async getPaidReportItem(itemId: string): Promise<MondayItemSummary> {
    const columnIds = Object.values(this.getBoardSchema().columns).map(
      (column) => column.id,
    );
    const item = (
      await this.getClient().getItemsByIds([itemId], {
        columnIds,
      })
    )[0];

    if (!item) {
      throw new InternalServerErrorException(
        `Monday item not found for itemId=${itemId}`,
      );
    }

    return item;
  }

  private normalizeMondayItemToPayload(
    item: MondayItemSummary,
  ): Record<string, unknown> {
    const board = this.getBoardSchema();
    const columnMap = new Map(
      item.columnValues.map((column) => [column.id, column]),
    );
    const requestDate = this.readMondayDateValue(
      columnMap,
      board.columns.date.id,
    );
    const deliveryDate = this.readMondayDateValue(
      columnMap,
      board.columns.deliveryDate.id,
      { includeTime: true },
    );

    return {
      'Item ID': item.id,
      itemId: item.id,
      'Client name': item.name,
      clientName: item.name,
      'Client email': this.readMondayText(columnMap, board.columns.email.id),
      clientEmail: this.readMondayText(columnMap, board.columns.email.id),
      'Client phone': this.readMondayText(columnMap, board.columns.phone.id),
      clientPhone: this.readMondayText(columnMap, board.columns.phone.id),
      Timestamp: requestDate,
      timestamp: requestDate,
      'Report ID': this.readMondayText(columnMap, board.columns.reportId.id),
      reportId: this.readMondayText(columnMap, board.columns.reportId.id),
      Address: this.readMondayText(columnMap, board.columns.address.id),
      address: this.readMondayText(columnMap, board.columns.address.id),
      Suburb: this.readMondayText(columnMap, board.columns.suburb.id),
      suburb: this.readMondayText(columnMap, board.columns.suburb.id),
      'Block size (m²)': this.readMondayText(
        columnMap,
        board.columns.blockSizeM2.id,
      ),
      blockSizeM2: this.readMondayText(columnMap, board.columns.blockSizeM2.id),
      Zone: this.readMondayText(columnMap, board.columns.zone.id),
      zone: this.readMondayText(columnMap, board.columns.zone.id),
      'Frontage (m)': this.readMondayText(
        columnMap,
        board.columns.frontageM.id,
      ),
      'House position': this.readMondayText(
        columnMap,
        board.columns.housePosition.id,
      ),
      'House footprint (m²)': this.readMondayText(
        columnMap,
        board.columns.houseFootprintM2.id,
      ),
      'Rear yard depth (m)': this.readMondayText(
        columnMap,
        board.columns.rearYardDepthM.id,
      ),
      'Large trees visible': this.readMondayText(
        columnMap,
        board.columns.largeTreesVisible.id,
      ),
      'Tree location': this.readMondayText(
        columnMap,
        board.columns.treeLocation.id,
      ),
      'Registered trees': this.readMondayText(
        columnMap,
        board.columns.registeredTrees.id,
      ),
      'Heritage overlay': this.readMondayText(
        columnMap,
        board.columns.heritageOverlay.id,
      ),
      'Sewer location': this.readMondayText(
        columnMap,
        board.columns.sewerLocation.id,
      ),
      'Easement impact': this.readMondayText(
        columnMap,
        board.columns.easementImpact.id,
      ),
      'Shed in rear': this.readMondayText(
        columnMap,
        board.columns.shedInRear.id,
      ),
      'Second driveway feasible': this.readMondayText(
        columnMap,
        board.columns.secondDrivewayFeasible.id,
      ),
      'Map image URL': this.readMondayText(
        columnMap,
        board.columns.mapImageUrl.id,
      ),
      'Max building allowed (m²)': this.readMondayText(
        columnMap,
        board.columns.maxBuildingAllowedM2.id,
      ),
      'Remaining site coverage (m²)': this.readMondayText(
        columnMap,
        board.columns.remainingSiteCoverageM2.id,
      ),
      'Rear yard category': this.readMondayText(
        columnMap,
        board.columns.rearYardCategory.id,
      ),
      'Granny flat (keep house)': this.readMondayText(
        columnMap,
        board.columns.grannyFlatKeepHouse.id,
      ),
      'Dual occ (remove house)': this.readMondayText(
        columnMap,
        board.columns.dualOccRemoveHouse.id,
      ),
      'Subdivision potential': this.readMondayText(
        columnMap,
        board.columns.subdivisionPotential.id,
      ),
      'Analyst assigned': this.readMondayText(
        columnMap,
        board.columns.analystAssigned.id,
      ),
      'send for QA?': this.readMondayText(
        columnMap,
        board.columns.sendForQa.id,
      ),
      'QA completed': this.readMondayText(
        columnMap,
        board.columns.qaCompleted.id,
      ),
      'Final PDF link': this.readMondayText(
        columnMap,
        board.columns.finalPdfLink.id,
      ),
      finalPdfLink: this.readMondayText(
        columnMap,
        board.columns.finalPdfLink.id,
      ),
      'Delivery status': this.readMondayText(
        columnMap,
        board.columns.deliveryStatus.id,
      ),
      deliveryStatus: this.readMondayText(
        columnMap,
        board.columns.deliveryStatus.id,
      ),
      'Delivery date':
        this.readMondayText(columnMap, board.columns.deliveryDate.id) ||
        deliveryDate,
      deliveryDate: deliveryDate,
      Escalation: this.readMondayText(columnMap, board.columns.escalation.id),
      escalation: this.readMondayText(columnMap, board.columns.escalation.id),
      'Internal notes': this.readMondayText(
        columnMap,
        board.columns.internalNotes.id,
      ),
      internalNotes: this.readMondayText(
        columnMap,
        board.columns.internalNotes.id,
      ),
      Intention: this.readMondayText(columnMap, board.columns.intention.id),
      intention: this.readMondayText(columnMap, board.columns.intention.id),
      'Stripe payment id': this.readMondayText(
        columnMap,
        board.columns.stripePaymentId.id,
      ),
      stripePaymentId: this.readMondayText(
        columnMap,
        board.columns.stripePaymentId.id,
      ),
    };
  }

  private buildRequestColumnValues(
    payload: ReportRequestPayload,
    board: BlockplannerPaidReportsBoardSchema,
    options?: { setInitialWorkflowFields?: boolean },
  ): Record<string, unknown> {
    const columnValues: Record<string, unknown> = {
      [board.columns.email.id]: payload.clientEmail
        ? { email: payload.clientEmail, text: payload.clientEmail }
        : null,
      [board.columns.phone.id]: this.buildPhoneValue(payload.clientPhone),
      [board.columns.reportId.id]: payload.reportId,
      [board.columns.address.id]: payload.address,
      [board.columns.suburb.id]: payload.suburb,
      [board.columns.blockSizeM2.id]: payload.blockSizeM2,
      [board.columns.zone.id]: payload.zone,
      [board.columns.intention.id]: payload.intention
        ? { label: this.normalizeMondayIntentionLabel(payload.intention) }
        : null,
      [board.columns.stripePaymentId.id]: payload.stripePaymentId || null,
    };

    if (options?.setInitialWorkflowFields) {
      columnValues[board.columns.date.id] = this.buildDateValue(
        new Date().toISOString(),
      );
      columnValues[board.columns.deliveryStatus.id] = {
        label: board.statusLabels.deliveryStatus.notStarted,
      };
    }

    return columnValues;
  }

  private buildConfiguredPaidProductColumnValues(
    payload: ReportRequestPayload,
    board: ConfiguredPaidProductBoard,
  ): Record<string, unknown> {
    const columnValues: Record<string, unknown> = {
      [board.columns.reportId]: payload.reportId,
      [board.columns.stripePaymentId]: payload.stripePaymentId,
    };

    const setColumn = (columnId: string | undefined, value: unknown) => {
      if (columnId && value !== '' && value !== null && value !== undefined) {
        columnValues[columnId] = value;
      }
    };

    setColumn(
      board.columns.email,
      payload.clientEmail
        ? { email: payload.clientEmail, text: payload.clientEmail }
        : undefined,
    );
    setColumn(board.columns.phone, this.buildPhoneValue(payload.clientPhone));
    setColumn(board.columns.address, payload.address);
    setColumn(board.columns.suburb, payload.suburb);
    setColumn(board.columns.intention, payload.intention);
    setColumn(board.columns.sourceApp, payload.sourceApp);
    setColumn(board.columns.checkoutMode, payload.checkoutMode);
    setColumn(
      board.columns.paymentDate,
      this.buildDateValue(new Date().toISOString()),
    );

    return columnValues;
  }

  private buildItemName(payload: ReportRequestPayload): string {
    const prefix = payload.checkoutMode === 'sandbox' ? '[SANDBOX] ' : '';

    return (
      prefix +
      (payload.clientName ||
        payload.clientEmail ||
        payload.address ||
        payload.reportId)
    );
  }

  private buildFreeAssessmentLeadColumnValues(
    payload: FreeAssessmentLeadPayload,
    board: BlockplannerLeadsBoardSchema,
  ): Record<string, unknown> {
    return {
      [board.columns.email.id]: {
        email: payload.email,
        text: payload.email,
      },
      [board.columns.leadSource.id]: {
        label: board.statusLabels.leadSource.freeAssessment,
      },
    };
  }

  private buildConfiguredLeadColumnValues(
    payload: Record<string, unknown>,
    board: ConfiguredLeadBoard,
    email: string,
  ): Record<string, unknown> {
    const columnValues: Record<string, unknown> = {
      [board.columns.email]: { email, text: email },
    };
    const setColumn = (columnId: string | undefined, value: unknown) => {
      const normalized = this.normalizeToString(value);
      if (columnId && normalized) columnValues[columnId] = normalized;
    };

    if (board.columns.phone) {
      const phone = this.normalizeToString(payload.phone);
      if (phone)
        columnValues[board.columns.phone] = this.buildPhoneValue(phone);
    }

    setColumn(board.columns.address, payload.address);
    setColumn(board.columns.suburb, payload.suburb);
    setColumn(board.columns.intentUse, payload.intent_use);
    setColumn(board.columns.intentReason, payload.intent_reason);
    setColumn(board.columns.contactOptIn, payload.presale_contact_opt_in);
    setColumn(board.columns.propertyType, payload.property_type);
    setColumn(board.columns.buildEra, payload.build_era);
    setColumn(board.columns.bedrooms, payload.bedrooms);
    setColumn(board.columns.bathrooms, payload.bathrooms);
    setColumn(board.columns.floorArea, payload.floor_area);
    setColumn(board.columns.upgrades, payload.upgrades_selected);
    setColumn(board.columns.totalLow, payload.total_low);
    setColumn(board.columns.totalExpected, payload.total_expected);
    setColumn(board.columns.totalHigh, payload.total_high);
    setColumn(board.columns.sourceApp, payload.sourceApp);
    setColumn(board.columns.details, JSON.stringify(payload));

    if (board.columns.createdDate) {
      columnValues[board.columns.createdDate] = this.buildDateValue(
        this.normalizeToString(payload.timestamp) || new Date().toISOString(),
      );
    }

    return columnValues;
  }

  private normalizeFreeAssessmentLeadPayload(
    payload: Record<string, unknown>,
  ): FreeAssessmentLeadPayload {
    return {
      email: this.normalizeToString(payload.email),
    };
  }

  private normalizeReportRequestPayload(
    payload: Record<string, unknown>,
  ): ReportRequestPayload {
    return {
      reportId:
        this.normalizeToString(payload.reportId) || this.generateReportId(),
      clientName: this.normalizeToString(payload.clientName),
      clientEmail: this.normalizeToString(payload.clientEmail),
      clientPhone: this.normalizeToString(payload.clientPhone),
      address: this.normalizeToString(payload.address),
      suburb: this.normalizeToString(payload.suburb),
      blockSizeM2: this.normalizeToString(payload.blockSizeM2),
      zone: this.normalizeToString(payload.zone),
      intention: this.normalizeToString(payload.intention),
      checkoutMode: this.normalizeToString(payload.checkoutMode),
      stripePaymentId: this.normalizeToString(payload.stripePaymentId),
      productCode: this.normalizeToString(payload.productCode),
      sourceApp: this.normalizeToString(payload.sourceApp),
    };
  }

  private normalizeMondayIntentionLabel(value: string): string {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();
    const intention = this.getBoardSchema().statusLabels.intention;

    if (normalized.includes('sell')) {
      return intention.sell;
    }
    if (
      normalized.includes('joint') ||
      normalized.includes('partner') ||
      normalized.includes('someone develop') ||
      normalized.includes('develop for me')
    ) {
      return intention.jointVenture;
    }
    if (normalized.includes('develop')) {
      return intention.developMyself;
    }
    return intention.openToOptions;
  }

  private buildDateValue(input: string): { date: string } | null {
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const { year, month, day } = this.getActDateTimeParts(parsed);

    return {
      date: `${year}-${month}-${day}`,
    };
  }

  private buildDateTimeValue(
    input: string,
  ): { date: string; time?: string } | null {
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const { year, month, day, hour, minute, second } =
      this.getActDateTimeParts(parsed);

    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}:${second}`,
    };
  }

  private buildPhoneValue(
    rawPhone: string,
  ): { phone: string; countryShortName: string } | null {
    const phone = String(rawPhone || '').trim();
    if (!phone) {
      return null;
    }

    return {
      phone,
      countryShortName: this.inferPhoneCountry(phone),
    };
  }

  private inferPhoneCountry(phone: string): string {
    const normalized = phone.replace(/\s+/g, '');
    if (normalized.startsWith('+852') || normalized.startsWith('852')) {
      return 'HK';
    }
    if (normalized.startsWith('+1')) {
      return 'US';
    }
    return 'AU';
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  private readMondayText(
    columnMap: Map<string, { id: string; text: string; value: string | null }>,
    columnId: string,
  ): string {
    return columnMap.get(columnId)?.text?.trim() || '';
  }

  private readMondayDateValue(
    columnMap: Map<string, { id: string; text: string; value: string | null }>,
    columnId: string,
    options?: { includeTime?: boolean },
  ): string {
    const column = columnMap.get(columnId);
    if (!column) {
      return '';
    }

    const parsed = this.parseMondayColumnJson(column.value);
    const date =
      parsed && typeof parsed.date === 'string' ? parsed.date.trim() : '';
    const time =
      options?.includeTime && parsed && typeof parsed.time === 'string'
        ? parsed.time.trim()
        : '';

    if (date && time) {
      return `${date} ${time}`;
    }

    if (date) {
      return date;
    }

    return column.text?.trim() || '';
  }

  private parseMondayColumnJson(
    value: string | null,
  ): Record<string, unknown> | null {
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private getActDateTimeParts(date: Date): {
    year: string;
    month: string;
    day: string;
    hour: string;
    minute: string;
    second: string;
  } {
    const formatter = new Intl.DateTimeFormat('en-AU', {
      timeZone: ACT_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);
    return {
      year: this.readDatePart(parts, 'year', '0000'),
      month: this.readDatePart(parts, 'month', '01'),
      day: this.readDatePart(parts, 'day', '01'),
      hour: this.readDatePart(parts, 'hour', '00'),
      minute: this.readDatePart(parts, 'minute', '00'),
      second: this.readDatePart(parts, 'second', '00'),
    };
  }

  private readDatePart(
    parts: Intl.DateTimeFormatPart[],
    type: Intl.DateTimeFormatPartTypes,
    fallback: string,
  ): string {
    return parts.find((part) => part.type === type)?.value || fallback;
  }

  private readNested(
    payload: Record<string, unknown>,
    path: string[],
  ): unknown {
    let current: unknown = payload;
    for (const key of path) {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  private normalizeToString(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }

  private readPayloadValue(
    payload: Record<string, unknown>,
    label: string,
  ): string {
    const variants = this.getKeyVariants(label);
    for (const key of variants) {
      if (key in payload) {
        return this.normalizeToString(payload[key]);
      }
    }
    return '';
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
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join('')
    );
  }

  private toSnakeCase(label: string): string {
    return this.toWords(label)
      .map((word) => word.toLowerCase())
      .join('_');
  }

  private toWords(label: string): string[] {
    return String(label || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(/[^a-zA-Z0-9]+/)
      .map((word) => word.trim())
      .filter(Boolean);
  }

  private normalizeStatusLabel(value: string): string {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private getClient(): MondayApiClient {
    if (!this.client) {
      this.client = new MondayApiClient(
        {
          apiToken: this.getRequiredEnv('MONDAY_API_TOKEN'),
          apiBaseUrl:
            process.env.MONDAY_API_BASE_URL || 'https://api.monday.com/v2',
          apiVersion: process.env.MONDAY_API_VERSION || '2026-01',
        },
        new Logger(MondayApiClient.name),
      );
    }

    return this.client;
  }

  private getBoardSchema(): BlockplannerPaidReportsBoardSchema {
    if (this.paidReportsBoardSchema) return this.paidReportsBoardSchema;

    const value = this.getWorkflowMappings().site_report;
    if (!this.isRecord(value)) {
      throw new InternalServerErrorException(
        'Missing site_report mapping in blockplanner-monday-workflows.json',
      );
    }

    const statusLabels = this.getRequiredMappingRecord(
      value,
      'statusLabels',
      'site_report',
    );
    const schema: BlockplannerPaidReportsBoardSchema = {
      boardId: this.getRequiredMappingString(value, 'boardId', 'site_report'),
      boardName: this.getRequiredMappingString(
        value,
        'boardName',
        'site_report',
      ),
      defaultGroupId: this.getRequiredMappingString(
        value,
        'groupId',
        'site_report',
      ),
      columns: this.parseColumnDefinitions(
        value.columns,
        PAID_REPORT_COLUMN_KEYS,
        'site_report.columns',
      ),
      statusLabels: {
        yes: this.getRequiredMappingString(
          statusLabels,
          'yes',
          'site_report.statusLabels',
        ),
        no: this.getRequiredMappingString(
          statusLabels,
          'no',
          'site_report.statusLabels',
        ),
        treeLocation: this.parseStringMap(
          statusLabels.treeLocation,
          TREE_LOCATION_STATUS_KEYS,
          'site_report.statusLabels.treeLocation',
        ),
        registeredTrees: this.parseStringMap(
          statusLabels.registeredTrees,
          REGISTERED_TREE_STATUS_KEYS,
          'site_report.statusLabels.registeredTrees',
        ),
        deliveryStatus: this.parseStringMap(
          statusLabels.deliveryStatus,
          DELIVERY_STATUS_KEYS,
          'site_report.statusLabels.deliveryStatus',
        ),
        intention: this.parseStringMap(
          statusLabels.intention,
          INTENTION_STATUS_KEYS,
          'site_report.statusLabels.intention',
        ),
      },
    };

    this.paidReportsBoardSchema = schema;
    return schema;
  }

  private getConfiguredPaidProductBoard(
    productCode: ConfiguredPaidProductCode,
  ): ConfiguredPaidProductBoard {
    const board = this.getConfiguredPaidProductBoardMap()[productCode];
    if (!board) {
      throw new InternalServerErrorException(
        `Missing ${productCode} mapping in blockplanner-monday-workflows.json`,
      );
    }
    return board;
  }

  private getConfiguredPaidProductBoardMap(): ConfiguredPaidProductBoardMap {
    if (this.configuredPaidProductBoards) {
      return this.configuredPaidProductBoards;
    }

    const mappingsFile = this.getWorkflowMappings();
    const mappings: ConfiguredPaidProductBoardMap = {};
    for (const productCode of CONFIGURED_PAID_PRODUCT_CODES) {
      const value = mappingsFile[productCode];
      if (this.isEmptyWorkflowMapping(value)) continue;
      mappings[productCode] = this.parseConfiguredPaidProductBoard(
        productCode,
        value,
      );
    }

    this.configuredPaidProductBoards = mappings;
    return mappings;
  }

  private parseConfiguredPaidProductBoard(
    productCode: ConfiguredPaidProductCode,
    value: unknown,
  ): ConfiguredPaidProductBoard {
    if (!this.isRecord(value)) {
      throw new InternalServerErrorException(
        `${productCode} in blockplanner-monday-workflows.json must be an object`,
      );
    }

    const columns = value.columns;
    if (!this.isRecord(columns)) {
      throw new InternalServerErrorException(
        `${productCode}.columns in blockplanner-monday-workflows.json must be an object`,
      );
    }

    const optionalColumnKeys: Array<
      Exclude<
        keyof ConfiguredPaidProductBoard['columns'],
        'reportId' | 'stripePaymentId'
      >
    > = [
      'email',
      'phone',
      'address',
      'suburb',
      'intention',
      'sourceApp',
      'checkoutMode',
      'paymentDate',
    ];
    const parsedColumns: ConfiguredPaidProductBoard['columns'] = {
      reportId: this.getRequiredMappingString(
        columns,
        'reportId',
        `${productCode}.columns`,
      ),
      stripePaymentId: this.getRequiredMappingString(
        columns,
        'stripePaymentId',
        `${productCode}.columns`,
      ),
    };

    for (const key of optionalColumnKeys) {
      const columnId = this.getOptionalMappingString(
        columns,
        key,
        `${productCode}.columns`,
      );
      if (columnId) parsedColumns[key] = columnId;
    }

    return {
      boardId: this.getRequiredMappingString(value, 'boardId', productCode),
      defaultGroupId: this.getRequiredMappingString(
        value,
        'groupId',
        productCode,
      ),
      columns: parsedColumns,
    };
  }

  private getLeadsBoardSchema(): BlockplannerLeadsBoardSchema {
    if (this.leadsBoardSchema) return this.leadsBoardSchema;

    const value = this.getWorkflowMappings().free_assessment;
    if (!this.isRecord(value)) {
      throw new InternalServerErrorException(
        'Missing free_assessment mapping in blockplanner-monday-workflows.json',
      );
    }

    const statusLabels = this.getRequiredMappingRecord(
      value,
      'statusLabels',
      'free_assessment',
    );
    const schema: BlockplannerLeadsBoardSchema = {
      boardId: this.getRequiredMappingString(
        value,
        'boardId',
        'free_assessment',
      ),
      boardName: this.getRequiredMappingString(
        value,
        'boardName',
        'free_assessment',
      ),
      defaultGroupId: this.getRequiredMappingString(
        value,
        'groupId',
        'free_assessment',
      ),
      columns: this.parseColumnDefinitions(
        value.columns,
        ['name', 'email', 'leadSource'] as const,
        'free_assessment.columns',
      ),
      statusLabels: {
        leadSource: this.parseStringMap(
          statusLabels.leadSource,
          ['freeAssessment'] as const,
          'free_assessment.statusLabels.leadSource',
        ),
      },
    };

    this.leadsBoardSchema = schema;
    return schema;
  }

  private getConfiguredLeadBoard(
    leadType: BlockplannerLeadType,
  ): ConfiguredLeadBoard {
    const board = this.getConfiguredLeadBoardMap()[leadType];
    if (!board) {
      throw new InternalServerErrorException(
        `Missing ${leadType} mapping in blockplanner-monday-workflows.json`,
      );
    }
    return board;
  }

  private getConfiguredLeadBoardMap(): ConfiguredLeadBoardMap {
    if (this.configuredLeadBoards) return this.configuredLeadBoards;

    const mappingsFile = this.getWorkflowMappings();
    const mappings: ConfiguredLeadBoardMap = {};
    for (const leadType of BLOCKPLANNER_LEAD_TYPES) {
      const value = mappingsFile[leadType];
      if (this.isEmptyWorkflowMapping(value)) continue;
      mappings[leadType] = this.parseConfiguredLeadBoard(leadType, value);
    }

    this.configuredLeadBoards = mappings;
    return mappings;
  }

  private parseConfiguredLeadBoard(
    leadType: BlockplannerLeadType,
    value: unknown,
  ): ConfiguredLeadBoard {
    if (!this.isRecord(value)) {
      throw new InternalServerErrorException(
        `${leadType} in blockplanner-monday-workflows.json must be an object`,
      );
    }

    const columns = value.columns;
    if (!this.isRecord(columns)) {
      throw new InternalServerErrorException(
        `${leadType}.columns in blockplanner-monday-workflows.json must be an object`,
      );
    }

    const optionalColumnKeys: Array<
      Exclude<keyof ConfiguredLeadBoard['columns'], 'email'>
    > = [
      'phone',
      'address',
      'suburb',
      'intentUse',
      'intentReason',
      'contactOptIn',
      'propertyType',
      'buildEra',
      'bedrooms',
      'bathrooms',
      'floorArea',
      'upgrades',
      'totalLow',
      'totalExpected',
      'totalHigh',
      'sourceApp',
      'details',
      'createdDate',
    ];
    const parsedColumns: ConfiguredLeadBoard['columns'] = {
      email: this.getRequiredMappingString(
        columns,
        'email',
        `${leadType}.columns`,
      ),
    };

    for (const key of optionalColumnKeys) {
      const columnId = this.getOptionalMappingString(
        columns,
        key,
        `${leadType}.columns`,
      );
      if (columnId) parsedColumns[key] = columnId;
    }

    return {
      boardId: this.getRequiredMappingString(value, 'boardId', leadType),
      defaultGroupId: this.getRequiredMappingString(
        value,
        'groupId',
        leadType,
      ),
      columns: parsedColumns,
    };
  }

  private getRequiredMappingString(
    record: Record<string, unknown>,
    key: string,
    path: string,
  ): string {
    const value = this.getOptionalMappingString(record, key, path);
    if (!value) {
      throw new InternalServerErrorException(
        `Missing ${path}.${key} in blockplanner-monday-workflows.json`,
      );
    }
    return value;
  }

  private getRequiredMappingRecord(
    record: Record<string, unknown>,
    key: string,
    path: string,
  ): Record<string, unknown> {
    const value = record[key];
    if (!this.isRecord(value)) {
      throw new InternalServerErrorException(
        `${path}.${key} in blockplanner-monday-workflows.json must be an object`,
      );
    }
    return value;
  }

  private parseColumnDefinitions<const T extends readonly string[]>(
    value: unknown,
    keys: T,
    path: string,
  ): Record<T[number], MondayColumnDefinition> {
    if (!this.isRecord(value)) {
      throw new InternalServerErrorException(
        `${path} in blockplanner-monday-workflows.json must be an object`,
      );
    }

    const result = {} as Record<T[number], MondayColumnDefinition>;
    for (const key of keys) {
      const column = value[key];
      if (!this.isRecord(column)) {
        throw new InternalServerErrorException(
          `${path}.${key} in blockplanner-monday-workflows.json must be an object`,
        );
      }
      result[key as T[number]] = {
        id: this.getRequiredMappingString(column, 'id', `${path}.${key}`),
        title: this.getRequiredMappingString(
          column,
          'title',
          `${path}.${key}`,
        ),
        type: this.getRequiredMappingString(
          column,
          'type',
          `${path}.${key}`,
        ),
      };
    }
    return result;
  }

  private parseStringMap<const T extends readonly string[]>(
    value: unknown,
    keys: T,
    path: string,
  ): Record<T[number], string> {
    if (!this.isRecord(value)) {
      throw new InternalServerErrorException(
        `${path} in blockplanner-monday-workflows.json must be an object`,
      );
    }

    const result = {} as Record<T[number], string>;
    for (const key of keys) {
      result[key as T[number]] = this.getRequiredMappingString(
        value,
        key,
        path,
      );
    }
    return result;
  }

  private getOptionalMappingString(
    record: Record<string, unknown>,
    key: string,
    path: string,
  ): string | undefined {
    const value = record[key];
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string') {
      throw new InternalServerErrorException(
        `${path}.${key} in blockplanner-monday-workflows.json must be a string`,
      );
    }
    return value.trim() || undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  private getWorkflowMappings(): Record<string, unknown> {
    if (this.workflowMappings) return this.workflowMappings;

    let raw: string;
    try {
      raw = readFileSync(MONDAY_WORKFLOW_MAPPINGS_FILE, 'utf8');
    } catch (error) {
      throw new InternalServerErrorException(
        `Unable to read blockplanner-monday-workflows.json: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new InternalServerErrorException(
        `Invalid blockplanner-monday-workflows.json: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    if (!this.isRecord(parsed)) {
      throw new InternalServerErrorException(
        'blockplanner-monday-workflows.json must contain a JSON object',
      );
    }

    const supportedKeys = new Set<string>([
      'site_report',
      ...CONFIGURED_PAID_PRODUCT_CODES,
      ...BLOCKPLANNER_LEAD_TYPES,
      'free_assessment',
    ]);
    const unsupportedKeys = Object.keys(parsed).filter(
      (key) => !supportedKeys.has(key),
    );
    if (unsupportedKeys.length) {
      throw new InternalServerErrorException(
        `Unsupported mapping(s) in blockplanner-monday-workflows.json: ${unsupportedKeys.join(', ')}`,
      );
    }

    this.workflowMappings = parsed;
    return parsed;
  }

  private isEmptyWorkflowMapping(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (!this.isRecord(value)) return false;

    const hasConfiguredValue = (candidate: unknown): boolean => {
      if (typeof candidate === 'string') return Boolean(candidate.trim());
      if (!this.isRecord(candidate)) return false;
      return Object.values(candidate).some(hasConfiguredValue);
    };

    return !hasConfiguredValue(value);
  }

  private getTargetGroupId(board: BlockplannerPaidReportsBoardSchema): string {
    return board.defaultGroupId;
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new InternalServerErrorException(`Missing env var ${name}`);
    }
    return value;
  }
}
