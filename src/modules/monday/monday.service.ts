import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  BLOCKPLANNER_PAID_REPORTS_BOARD_SCHEMA,
  BlockplannerPaidReportsBoardSchema,
} from '@modules/monday/monday-board.schema';
import {
  MondayApiClient,
  MondayItemSummary,
} from '@modules/monday/monday-api.client';
import { randomInt } from 'crypto';

const ACT_TIME_ZONE = 'Australia/Sydney';

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
  stripePaymentId: string;
};

@Injectable()
export class MondayService {
  private readonly logger = new Logger(MondayService.name);
  private client: MondayApiClient | null = null;

  generateReportId(now = new Date()): string {
    const { year, month, day } = this.getActDateTimeParts(now);
    const suffix = String(randomInt(1000, 10000));
    return `BP-${year}${month}${day}-${suffix}`;
  }

  async upsertPaidReportRequest(
    rawPayload: Record<string, unknown>,
  ): Promise<{
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

    await client.changeMultipleColumnValues(board.boardId, itemId, columnValues);

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
      columnValues[board.columns.internalNotes.id] = params.internalNotes.trim();
    }

    if (params.escalation !== undefined) {
      columnValues[board.columns.escalation.id] = { label: params.escalation };
    }

    if (params.qaCompleted !== undefined) {
      columnValues[board.columns.qaCompleted.id] = { label: params.qaCompleted };
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
    const columnMap = new Map(item.columnValues.map((column) => [column.id, column]));
    const requestDate = this.readMondayDateValue(columnMap, board.columns.date.id);
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
      'Frontage (m)': this.readMondayText(columnMap, board.columns.frontageM.id),
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
      'send for QA?': this.readMondayText(columnMap, board.columns.sendForQa.id),
      'QA completed': this.readMondayText(columnMap, board.columns.qaCompleted.id),
      'Final PDF link': this.readMondayText(
        columnMap,
        board.columns.finalPdfLink.id,
      ),
      finalPdfLink: this.readMondayText(columnMap, board.columns.finalPdfLink.id),
      'Delivery status': this.readMondayText(
        columnMap,
        board.columns.deliveryStatus.id,
      ),
      deliveryStatus: this.readMondayText(
        columnMap,
        board.columns.deliveryStatus.id,
      ),
      'Delivery date': this.readMondayText(
        columnMap,
        board.columns.deliveryDate.id,
      ) || deliveryDate,
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
      columnValues[board.columns.date.id] = this.buildDateValue(new Date().toISOString());
      columnValues[board.columns.deliveryStatus.id] = {
        label: board.statusLabels.deliveryStatus.notStarted,
      };
    }

    return columnValues;
  }

  private buildItemName(payload: ReportRequestPayload): string {
    return (
      payload.clientName ||
      payload.clientEmail ||
      payload.address ||
      payload.reportId
    );
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
      stripePaymentId: this.normalizeToString(payload.stripePaymentId),
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

  private parseMondayColumnJson(value: string | null): Record<string, unknown> | null {
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
    return {
      ...BLOCKPLANNER_PAID_REPORTS_BOARD_SCHEMA,
      boardId:
        process.env.MONDAY_PAID_REPORTS_BOARD_ID ||
        BLOCKPLANNER_PAID_REPORTS_BOARD_SCHEMA.boardId,
      defaultGroupId:
        process.env.MONDAY_PAID_REPORTS_GROUP_ID ||
        BLOCKPLANNER_PAID_REPORTS_BOARD_SCHEMA.defaultGroupId,
    };
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
