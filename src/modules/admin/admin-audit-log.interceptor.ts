import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuthenticatedRequest } from '@/modules/auth/auth.request';
import {
  AdminAuditLogService,
  resolveAuditActionType,
  resolveAuditEntityId,
  resolveAuditEntityLabel,
  resolveAuditResourceType,
} from '@/modules/admin/admin-audit-log.service';

const isAuditableAdminRequest = (req: AuthenticatedRequest): boolean => {
  const method = String(req.method || '').toUpperCase();
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    return false;
  }
  const path = req.originalUrl || req.url || '';
  if (!path.includes('/admin/')) {
    return false;
  }
  if (path.includes('/audit-log')) {
    return false;
  }
  return true;
};

@Injectable()
export class AdminAuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AdminAuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!isAuditableAdminRequest(req)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const method = String(req.method || '').toUpperCase();
          const path = this.auditLogService.normalizeAuditPath(req.originalUrl || req.url || '');
          const requestBody = this.auditLogService.sanitizeRequestBody(req.body);
          const responseSummary = this.auditLogService.sanitizeResponseBody(responseBody);
          const actionType = resolveAuditActionType(method, path);
          const resourceType = resolveAuditResourceType(path);
          const entityId = resolveAuditEntityId(path, responseSummary);
          const entityLabel = resolveAuditEntityLabel(requestBody, responseSummary);

          void this.auditLogService.trackAction({
            event: 'Admin Audit',
            req,
            actionType,
            method,
            path,
            resourceType,
            entityId,
            entityLabel,
            request: requestBody,
            response: responseSummary,
          });
        },
      }),
    );
  }
}
