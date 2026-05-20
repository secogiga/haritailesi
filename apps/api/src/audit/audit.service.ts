import { Injectable } from '@nestjs/common';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { auditLogs, actionLogs } from '@haritailesi/database';
import type { RequestUser } from '../auth/auth.types';

@Injectable()
export class AuditService {
  constructor(@InjectDb() private readonly db: Database) {}

  async log(params: {
    actor?: RequestUser | null;
    action: string;
    entityType?: string;
    entityId?: string;
    beforeState?: unknown;
    afterState?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.db.insert(auditLogs).values({
      actorId: params.actor?.id ?? null,
      actorEmail: params.actor?.email ?? null,
      action: params.action,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      beforeState: params.beforeState ? (params.beforeState as Record<string, unknown>) : null,
      afterState: params.afterState ? (params.afterState as Record<string, unknown>) : null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
  }

  // Gamification verisi toplama — Faz 1'de kullanıcıya gösterilmez
  async logAction(params: {
    userId: string;
    actionType: string;
    entityType?: string;
    entityId?: string;
    scoreReserved?: number;
    metadata?: unknown;
  }): Promise<void> {
    await this.db.insert(actionLogs).values({
      userId: params.userId,
      actionType: params.actionType,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      scoreReserved: params.scoreReserved ?? 0,
      metadata: params.metadata ? (params.metadata as Record<string, unknown>) : null,
    });
  }
}
