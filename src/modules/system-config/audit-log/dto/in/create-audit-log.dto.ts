import { AuditAction, AuditModule } from '../../enums';

export class CreateAuditLogDto {
  userId?: number | null;
  usernameSnapshot?: string | null;
  roleSnapshot?: string | null;
  action: AuditAction;
  module: AuditModule;
  affectedEntity?: string | null;
  entityId?: number | null;
  previousValue?: string | null;
  newValue?: string | null;
  ip?: string | null;
  device?: string | null;
}
