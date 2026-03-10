import { Injectable, Logger } from '@nestjs/common';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';

const MIXPANEL_EXPORT_URL = 'https://data.mixpanel.com/api/2.0/export';
const MIXPANEL_IMPORT_URL = 'https://api.mixpanel.com/import';
const MIXPANEL_TRACK_URL = 'https://api.mixpanel.com/track';
const MIXPANEL_PROJECT_ID = '3834941';
const AUDIT_EVENT_NAME = 'Admin Audit';
const LOGIN_EVENT_NAME = 'Admin Login';
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

type MixpanelEventRecord = {
  event?: string;
  properties?: Record<string, unknown>;
};

type AuditActionType =
  | 'login'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'recompute'
  | 'invite'
  | 'enable'
  | 'disable'
  | 'upload'
  | 'other';

export type AuditLogItem = {
  insertId: string;
  event: string;
  createdAt: string;
  actionType: AuditActionType;
  method: string;
  path: string;
  resourceType?: string;
  entityId?: string;
  entityLabel?: string;
  actor: {
    id?: string;
    email?: string;
    displayName?: string;
    role?: string;
  };
  request?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
};

type AuditLogQuery = {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  actionType?: string;
  resourceType?: string;
  search?: string;
};

type AuditLogTrackParams = {
  event: typeof AUDIT_EVENT_NAME | typeof LOGIN_EVENT_NAME;
  req: AuthenticatedRequest;
  actionType: AuditActionType;
  method: string;
  path: string;
  resourceType?: string;
  entityId?: string;
  entityLabel?: string;
  request?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
};

const redactKey = (key: string): boolean => {
  const normalized = key.trim().toLowerCase();
  return (
    normalized.includes('password') ||
    normalized.includes('token') ||
    normalized.includes('secret') ||
    normalized.includes('authorization') ||
    normalized.includes('cookie')
  );
};

const sanitizeValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return value.length > 1000 ? `${value.slice(0, 997)}...` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => sanitizeValue(item));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 40);
    const sanitized: Record<string, unknown> = {};
    for (const [key, nestedValue] of entries) {
      sanitized[key] = redactKey(key) ? '[REDACTED]' : sanitizeValue(nestedValue);
    }
    return sanitized;
  }
  return String(value);
};

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .trim();

const normalizePath = (value: string): string => value.split('?')[0] || value;

const parsePositiveInt = (
  value: unknown,
  fallback: number,
  maxValue: number,
): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, maxValue);
};

const parseDateOnly = (value: string | undefined, fallback: Date): string => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return fallback.toISOString().slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return fallback.toISOString().slice(0, 10);
  }
  return normalized;
};

const toEpochSeconds = (value: Date): number =>
  Math.floor(value.getTime() / 1000);

@Injectable()
export class AdminAuditLogService {
  private readonly logger = new Logger(AdminAuditLogService.name);

  private getServiceAccountAuthHeader(): string | null {
    const username = normalizeText(process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME);
    const secret = normalizeText(process.env.MIXPANEL_SERVICE_ACCOUNT_SECRET);
    if (!username || !secret) {
      return null;
    }
    return `Basic ${Buffer.from(`${username}:${secret}`).toString('base64')}`;
  }

  private getProjectToken(): string | null {
    return (
      normalizeText(process.env.MIXPANEL_PROJECT_TOKEN) ||
      normalizeText(process.env.VITE_MIXPANEL_TOKEN) ||
      null
    );
  }

  private resolveEventTimestampMs(event: MixpanelEventRecord): number {
    const raw = event.properties?.time ?? event.properties?.timestamp;
    if (typeof raw === 'number') {
      if (!Number.isFinite(raw)) {
        return Date.now();
      }
      return raw > 1_000_000_000_000 ? raw : raw * 1000;
    }
    const parsed = Date.parse(String(raw ?? ''));
    return Number.isFinite(parsed) ? parsed : Date.now();
  }

  private async postViaImport(events: Array<Record<string, unknown>>): Promise<void> {
    const authHeader = this.getServiceAccountAuthHeader();
    if (!authHeader) {
      throw new Error('Mixpanel service account credentials are not configured');
    }

    const response = await fetch(
      `${MIXPANEL_IMPORT_URL}?strict=1&project_id=${encodeURIComponent(MIXPANEL_PROJECT_ID)}`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
      },
    );

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(
        `Mixpanel import failed (${response.status}): ${bodyText || 'unknown error'}`,
      );
    }
  }

  private async postViaTrack(events: Array<Record<string, unknown>>): Promise<void> {
    const token = this.getProjectToken();
    if (!token) {
      throw new Error('Mixpanel project token is not configured');
    }

    const withToken = events.map((item) => ({
      ...item,
      properties: {
        ...(item.properties as Record<string, unknown>),
        token,
      },
    }));

    const response = await fetch(`${MIXPANEL_TRACK_URL}?verbose=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(withToken),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(
        `Mixpanel track failed (${response.status}): ${bodyText || 'unknown error'}`,
      );
    }
  }

  private async sendEvents(events: Array<Record<string, unknown>>): Promise<void> {
    try {
      if (this.getServiceAccountAuthHeader()) {
        await this.postViaImport(events);
        return;
      }
      await this.postViaTrack(events);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Audit log event failed to send to Mixpanel: ${reason}`);
    }
  }

  private toAuditItem(event: MixpanelEventRecord): AuditLogItem {
    const properties = event.properties ?? {};
    return {
      insertId:
        normalizeText(properties.$insert_id) ||
        `${normalizeText(event.event)}:${normalizeText(properties.distinct_id)}:${String(
          properties.time ?? '',
        )}`,
      event: normalizeText(event.event) || AUDIT_EVENT_NAME,
      createdAt: new Date(this.resolveEventTimestampMs(event)).toISOString(),
      actionType: (normalizeText(properties.actionType).toLowerCase() as AuditActionType) || 'other',
      method: normalizeText(properties.method).toUpperCase() || '--',
      path: normalizeText(properties.path) || '--',
      resourceType: normalizeText(properties.resourceType) || undefined,
      entityId: normalizeText(properties.entityId) || undefined,
      entityLabel: normalizeText(properties.entityLabel) || undefined,
      actor: {
        id: normalizeText(properties.actorId) || undefined,
        email: normalizeText(properties.actorEmail) || undefined,
        displayName: normalizeText(properties.actorDisplayName) || undefined,
        role: normalizeText(properties.actorRole) || undefined,
      },
      request:
        properties.request && typeof properties.request === 'object'
          ? (properties.request as Record<string, unknown>)
          : null,
      response:
        properties.response && typeof properties.response === 'object'
          ? (properties.response as Record<string, unknown>)
          : null,
      ip: normalizeText(properties.ip) || undefined,
      userAgent: normalizeText(properties.userAgent) || undefined,
    };
  }

  private async fetchExportEvents(fromDate: string, toDate: string): Promise<MixpanelEventRecord[]> {
    const authHeader = this.getServiceAccountAuthHeader();
    if (!authHeader) {
      return [];
    }

    const params = new URLSearchParams({
      project_id: MIXPANEL_PROJECT_ID,
      from_date: fromDate,
      to_date: toDate,
      event: JSON.stringify([AUDIT_EVENT_NAME, LOGIN_EVENT_NAME]),
    });

    const response = await fetch(`${MIXPANEL_EXPORT_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(
        `Mixpanel export failed (${response.status}): ${bodyText || 'unknown error'}`,
      );
    }

    const body = await response.text();
    const rows: MixpanelEventRecord[] = [];
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      try {
        rows.push(JSON.parse(trimmed) as MixpanelEventRecord);
      } catch {
        continue;
      }
    }
    return rows;
  }

  async trackLogin(req: AuthenticatedRequest): Promise<void> {
    const actorId = req.auth?.id?.toString();
    const actorEmail = normalizeText(req.auth?.email) || undefined;
    const actorDisplayName = normalizeText(req.auth?.displayName) || undefined;
    const actorRole = normalizeText(req.auth?.role) || undefined;
    const now = new Date();

    await this.sendEvents([
      {
        event: LOGIN_EVENT_NAME,
        properties: {
          distinct_id: actorId || actorEmail || actorDisplayName || 'unknown-user',
          time: toEpochSeconds(now),
          $insert_id: `login:${actorId || actorEmail || 'unknown'}:${now.getTime()}`,
          actionType: 'login',
          method: 'LOGIN',
          path: '/admin/login',
          resourceType: 'auth',
          actorId,
          actorEmail,
          actorDisplayName,
          actorRole,
          ip: normalizeText(req.ip) || undefined,
          userAgent: normalizeText(req.headers['user-agent']) || undefined,
        },
      },
    ]);
  }

  async trackAction(params: AuditLogTrackParams): Promise<void> {
    const actorId = params.req.auth?.id?.toString();
    const actorEmail = normalizeText(params.req.auth?.email) || undefined;
    const actorDisplayName = normalizeText(params.req.auth?.displayName) || undefined;
    const actorRole = normalizeText(params.req.auth?.role) || undefined;
    const now = new Date();
    const insertIdBase = [
      params.actionType,
      params.method,
      params.path,
      params.entityId,
      actorId || actorEmail || actorDisplayName,
      now.getTime(),
    ]
      .filter(Boolean)
      .join(':');

    await this.sendEvents([
      {
        event: params.event,
        properties: {
          distinct_id: actorId || actorEmail || actorDisplayName || 'unknown-user',
          time: toEpochSeconds(now),
          $insert_id: insertIdBase,
          actionType: params.actionType,
          method: params.method,
          path: params.path,
          resourceType: params.resourceType,
          entityId: params.entityId,
          entityLabel: params.entityLabel,
          actorId,
          actorEmail,
          actorDisplayName,
          actorRole,
          ip: normalizeText(params.req.ip) || undefined,
          userAgent: normalizeText(params.req.headers['user-agent']) || undefined,
          request: params.request ?? null,
          response: params.response ?? null,
        },
      },
    ]);
  }

  async list(query: AuditLogQuery) {
    const today = new Date();
    const defaultFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = parseDateOnly(query.from, defaultFrom);
    const to = parseDateOnly(query.to, today);
    const page = parsePositiveInt(query.page, 1, 10_000);
    const pageSize = parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const actionType = normalizeText(query.actionType).toLowerCase();
    const resourceType = normalizeText(query.resourceType).toLowerCase();
    const search = normalizeText(query.search).toLowerCase();

    const configured = Boolean(this.getServiceAccountAuthHeader());
    if (!configured) {
      return {
        source: {
          provider: 'mixpanel',
          configured: false,
          available: false,
          message:
            'Mixpanel service account credentials are not configured in backend environment variables.',
        },
        filters: { from, to, actionType: actionType || null, resourceType: resourceType || null, search: search || null },
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        items: [],
      };
    }

    const rows = await this.fetchExportEvents(from, to);
    const items = rows
      .map((row) => this.toAuditItem(row))
      .filter((item) => {
        if (actionType && item.actionType !== actionType) {
          return false;
        }
        if (resourceType && normalizeText(item.resourceType).toLowerCase() !== resourceType) {
          return false;
        }
        if (!search) {
          return true;
        }
        const haystack = [
          item.event,
          item.actionType,
          item.method,
          item.path,
          item.resourceType,
          item.entityId,
          item.entityLabel,
          item.actor.email,
          item.actor.displayName,
          item.actor.role,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return {
      source: {
        provider: 'mixpanel',
        configured: true,
        available: true,
      },
      filters: {
        from,
        to,
        actionType: actionType || null,
        resourceType: resourceType || null,
        search: search || null,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      items: paged,
    };
  }

  sanitizeRequestBody(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null;
    }
    return sanitizeValue(body) as Record<string, unknown>;
  }

  sanitizeResponseBody(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const record = sanitizeValue(body);
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      return null;
    }
    const objectRecord = record as Record<string, unknown>;
    const summary: Record<string, unknown> = {};
    for (const key of ['id', 'guid', 'name', 'status', 'message', 'estateId', 'builderId', 'userId']) {
      if (key in objectRecord) {
        summary[key] = objectRecord[key];
      }
    }
    return Object.keys(summary).length > 0 ? summary : objectRecord;
  }

  normalizeAuditPath(path: string): string {
    return normalizePath(path);
  }
}

export const resolveAuditActionType = (
  method: string,
  path: string,
): AuditActionType => {
  const normalizedMethod = normalizeText(method).toUpperCase();
  const normalizedPath = normalizePath(path).toLowerCase();

  if (normalizedPath.endsWith('/login')) {
    return 'login';
  }
  if (normalizedPath.includes('/recompute-design-on-lot')) {
    return 'recompute';
  }
  if (normalizedPath.includes('/builder-approvals')) {
    return 'approve';
  }
  if (normalizedPath.includes('/invitations')) {
    return 'invite';
  }
  if (normalizedPath.endsWith('/enable')) {
    return 'enable';
  }
  if (normalizedPath.endsWith('/disable')) {
    return 'disable';
  }
  if (normalizedPath.includes('/upload')) {
    return 'upload';
  }
  if (normalizedMethod === 'POST') {
    return 'create';
  }
  if (normalizedMethod === 'PATCH' || normalizedMethod === 'PUT') {
    return 'update';
  }
  if (normalizedMethod === 'DELETE') {
    return 'delete';
  }
  return 'other';
};

export const resolveAuditResourceType = (path: string): string | undefined => {
  const segments = normalizePath(path)
    .split('/')
    .filter(Boolean);
  const adminIndex = segments.findIndex((segment) => segment === 'admin');
  if (adminIndex < 0) {
    return undefined;
  }

  const resourceSegments = segments.slice(adminIndex + 1);
  for (const segment of resourceSegments) {
    if (!segment) {
      continue;
    }
    if (/^\d+$/.test(segment)) {
      continue;
    }
    if (
      segment === 'enable' ||
      segment === 'disable' ||
      segment === 'export'
    ) {
      continue;
    }
    return segment;
  }
  return resourceSegments[0];
};

export const resolveAuditEntityId = (path: string, response: Record<string, unknown> | null): string | undefined => {
  for (const key of ['id', 'guid', 'estateId', 'builderId', 'userId']) {
    const value = normalizeText(response?.[key]);
    if (value) {
      return value;
    }
  }

  const segments = normalizePath(path)
    .split('/')
    .filter(Boolean);
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    if (/^\d+$/.test(segment)) {
      return segment;
    }
  }
  return undefined;
};

export const resolveAuditEntityLabel = (
  request: Record<string, unknown> | null,
  response: Record<string, unknown> | null,
): string | undefined => {
  for (const source of [response, request]) {
    const name = normalizeText(source?.name);
    if (name) {
      return name;
    }
    const title = normalizeText(source?.title);
    if (title) {
      return title;
    }
    const message = normalizeText(source?.message);
    if (message) {
      return message;
    }
  }
  return undefined;
};
