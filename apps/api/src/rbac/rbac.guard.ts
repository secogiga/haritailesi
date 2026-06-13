import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from './rbac.decorator';
import { can, type Permission } from './permissions';
import type { RequestUser } from '../auth/auth.types';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { auditLogs } from '@haritailesi/database';

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private reflector: Reflector,
    @InjectDb() private readonly db: Database,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request & { user: RequestUser }>();
    const user = req.user;

    if (!user) throw new ForbiddenException();

    const denied = required.filter((p) => !can(user, p));

    if (denied.length > 0) {
      this.logDenial(user, required, denied, req);
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmuyor.');
    }

    return true;
  }

  private logDenial(
    user: RequestUser,
    required: Permission[],
    denied: Permission[],
    req: Request,
  ): void {
    this.logger.warn(
      `rbac.denied userId=${user.id} roles=${(user.functionalRoles ?? []).join(',')} denied=${denied.join(',')} ${req.method} ${req.path}`,
    );

    void this.db
      .insert(auditLogs)
      .values({
        actorId: user.id,
        actorEmail: user.email ?? null,
        action: 'rbac.permission_denied',
        entityType: 'permission',
        entityId: null,
        afterState: {
          requiredPermissions: required,
          deniedPermissions: denied,
          endpoint: `${req.method} ${req.path}`,
          roles: user.functionalRoles ?? [],
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        },
        ipAddress: req.ip ?? null,
        userAgent: String(req.headers['user-agent'] ?? ''),
      })
      .catch((err: Error) =>
        this.logger.error(`rbac.denial_audit_failed: ${err.message}`),
      );
  }
}
