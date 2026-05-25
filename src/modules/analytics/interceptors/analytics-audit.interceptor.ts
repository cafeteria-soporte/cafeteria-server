import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import { AuditAction } from 'src/modules/system-config/audit-log/enums/audit-action.enum';
import { AuditModule } from 'src/modules/system-config/audit-log/enums/audit-module.enum';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

const ROLE_NAMES: Record<number, string> = {
  1: 'root',
  2: 'administrator',
  3: 'cashier',
};

@Injectable()
export class AnalyticsAuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLog: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthUser; url: string }>();
    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        if (user) {
          void this.auditLog.create({
            action: AuditAction.REPORT_QUERIED,
            module: AuditModule.ANALYTICS,
            userId: user.id,
            usernameSnapshot: user.username,
            roleSnapshot: ROLE_NAMES[user.roleId],
            affectedEntity: 'analytics',
            newValue: request.url,
          });
        }
      }),
    );
  }
}
