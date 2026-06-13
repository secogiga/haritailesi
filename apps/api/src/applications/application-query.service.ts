import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, and, asc, sql } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  applications,
  applicationStateLogs,
  auditLogs,
  interviewRequests,
  donations,
} from '@haritailesi/database';
import { getValidNextStates } from './state-machine';
import type { CursorPage } from '@haritailesi/types';

export interface TimelineEvent {
  id: string;
  at: string;
  type: 'state_change' | 'audit' | 'notes' | 'interview' | 'payment';
  title: string;
  description?: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  'application.notes_updated':   'İnceleme notu güncellendi',
  'application.submitted':       'Başvuru gönderildi',
  'application.state_transition': 'Durum değiştirildi',
  'application.deleted':         'Başvuru silindi',
  'application.payment_waived':  'Ödeme muaf tutuldu',
};

const STATE_LABEL_TR: Record<string, string> = {
  submitted:          'Yeni Başvuru',
  under_review:       'Ön İnceleme',
  interview_needed:   'Görüşme',
  interview_scheduled:'Görüşme Planlandı',
  interview_completed:'Görüşme Tamamlandı',
  shortlisted:        'Ön Eleme Geçildi',
  approved:           'Kabul',
  rejected:           'Reddedildi',
  waiting_payment:    'Ödeme Bekleniyor',
  waiting_verification:'Doğrulama Bekleniyor',
  waitlisted:         'Yedek Listede',
  accepted:           'Kabul Edildi',
  active:             'Aktif',
  passive:            'Pasif',
  active_program_member: 'Program Üyesi',
  program_completed:  'Program Tamamlandı',
};

const REASON_TR: Record<string, string> = {
  'Initial submission': 'İlk başvuru',
  'Approved':           'Kabul edildi',
  'Rejected':           'Reddedildi',
};

const PAGE_SIZE = 20;

@Injectable()
export class ApplicationQueryService {
  constructor(@InjectDb() private readonly db: Database) {}

  // ─── List (admin cursor pagination) ──────────────────────────────────────────

  async list(params: {
    type?: string;
    state?: string;
    cursor?: string;
    limit?: number;
  }): Promise<CursorPage<typeof applications.$inferSelect>> {
    const limit = Math.min(params.limit ?? PAGE_SIZE, 100);

    const conditions = [];
    if (params.type)   conditions.push(sql`${applications.type} = ${params.type}`);
    if (params.state)  conditions.push(eq(applications.state, params.state));
    if (params.cursor) {
      conditions.push(
        sql`${applications.createdAt} < (SELECT created_at FROM applications WHERE id = ${params.cursor})`,
      );
    }

    const rows = await this.db.query.applications.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(applications.createdAt)],
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);

    return {
      data,
      next_cursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
      has_more: hasMore,
    };
  }

  // ─── Detail ───────────────────────────────────────────────────────────────────

  async findById(id: string) {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');

    const stateLogs = await this.db.query.applicationStateLogs.findMany({
      where: eq(applicationStateLogs.applicationId, id),
      orderBy: [desc(applicationStateLogs.createdAt)],
    });

    const validNextStates = getValidNextStates(app.type, app.state);

    return { ...app, stateLogs, validNextStates };
  }

  // ─── Activity Timeline ────────────────────────────────────────────────────────

  async getTimeline(id: string): Promise<TimelineEvent[]> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
      columns: { id: true },
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');

    const [stateLogs, auditEntries, interviews, paymentRecords] = await Promise.all([
      this.db
        .select()
        .from(applicationStateLogs)
        .where(eq(applicationStateLogs.applicationId, id))
        .orderBy(asc(applicationStateLogs.createdAt)),

      this.db
        .select()
        .from(auditLogs)
        .where(and(eq(auditLogs.entityType, 'application'), eq(auditLogs.entityId, id)))
        .orderBy(asc(auditLogs.createdAt)),

      this.db
        .select()
        .from(interviewRequests)
        .where(eq(interviewRequests.applicationId, id))
        .orderBy(asc(interviewRequests.createdAt)),

      this.db
        .select()
        .from(donations)
        .where(sql`${donations.referenceCode} LIKE ${'MBR-' + id.slice(0, 8).toUpperCase() + '%'}`)
        .orderBy(asc(donations.createdAt)),
    ]);

    const events: TimelineEvent[] = [];

    for (const log of stateLogs) {
      events.push({
        id: log.id,
        at: log.createdAt.toISOString(),
        type: 'state_change',
        title: log.fromState
          ? `${STATE_LABEL_TR[log.fromState] ?? log.fromState} → ${STATE_LABEL_TR[log.toState] ?? log.toState}`
          : 'Başvuru oluşturuldu',
        ...(log.reason ? { description: REASON_TR[log.reason] ?? log.reason } : {}),
        metadata: { fromState: log.fromState, toState: log.toState },
      });
    }

    for (const entry of auditEntries) {
      if (entry.action === 'application.state_transition') continue;
      events.push({
        id: entry.id,
        at: entry.createdAt.toISOString(),
        type: entry.action === 'application.notes_updated' ? 'notes' : 'audit',
        title: AUDIT_ACTION_LABELS[entry.action] ?? entry.action,
        ...(entry.actorEmail ? { actor: entry.actorEmail } : {}),
        ...(entry.afterState ? { metadata: entry.afterState as Record<string, unknown> } : {}),
      });
    }

    for (const ireq of interviews) {
      events.push({
        id: ireq.id,
        at: ireq.createdAt.toISOString(),
        type: 'interview',
        title: 'Görüşme talebi oluşturuldu',
        metadata: { state: ireq.state, meetUrl: ireq.meetUrl },
      });
      if (ireq.confirmedAt) {
        events.push({
          id: `${ireq.id}:confirmed`,
          at: ireq.confirmedAt.toISOString(),
          type: 'interview',
          title: 'Görüşme zamanı onaylandı',
          metadata: { slotId: ireq.slotId },
        });
      }
      if (ireq.cancelledAt && ireq.state === 'rescheduled') {
        events.push({
          id: `${ireq.id}:reschedule`,
          at: ireq.cancelledAt.toISOString(),
          type: 'interview',
          title: 'Yeniden zamanlama istendi',
          ...(ireq.rescheduleNote ? { description: ireq.rescheduleNote } : {}),
        });
      }
    }

    for (const d of paymentRecords) {
      events.push({
        id: d.id,
        at: d.createdAt.toISOString(),
        type: 'payment',
        title: `Ödeme kaydedildi — ${(d.amount / 100).toLocaleString('tr-TR')} ₺`,
        ...(d.notes ? { description: d.notes } : {}),
        metadata: { referenceCode: d.referenceCode, method: d.method },
      });
    }

    events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    return events;
  }

  // ─── Stuck Applications (SLA cron) ────────────────────────────────────────────

  async getStuckApplications(): Promise<
    Array<{
      id: string;
      type: string;
      state: string;
      applicantEmail: string;
      formData: Record<string, unknown>;
      updatedAt: Date;
      daysStuck: number;
    }>
  > {
    const rows = await this.db.execute<{
      id: string;
      type: string;
      state: string;
      applicant_email: string;
      form_data: Record<string, unknown>;
      updated_at: Date;
    }>(sql`
      SELECT id, type, state, applicant_email, form_data, updated_at
      FROM applications
      WHERE deleted_at IS NULL
        AND state NOT IN ('rejected', 'active', 'passive', 'program_completed')
        AND (
          (state = 'submitted'        AND updated_at < NOW() - INTERVAL '2 days')  OR
          (state = 'under_review'     AND updated_at < NOW() - INTERVAL '5 days')  OR
          (state = 'interview_needed' AND updated_at < NOW() - INTERVAL '5 days')  OR
          (state = 'waiting_payment'  AND updated_at < NOW() - INTERVAL '3 days')  OR
          (state = 'approved'         AND updated_at < NOW() - INTERVAL '2 days')
        )
      ORDER BY updated_at ASC
    `);

    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      state: r.state,
      applicantEmail: r.applicant_email,
      formData: r.form_data as Record<string, unknown>,
      updatedAt: new Date(r.updated_at),
      daysStuck: Math.floor((Date.now() - new Date(r.updated_at).getTime()) / 86_400_000),
    }));
  }
}
