import { Injectable } from '@nestjs/common';
import { eq, desc, and, type SQL } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { feedbackReports, mentorApplications, users, userProfiles } from '@haritailesi/database';

@Injectable()
export class CommunityService {
  constructor(@InjectDb() private readonly db: Database) {}

  // ─── Feedback ────────────────────────────────────────────────────────────────

  async createFeedback(dto: {
    userId?: string | undefined;
    email?: string | undefined;
    subject: string;
    body: string;
    type: 'talep' | 'gorus';
    source: 'sahne' | 'mutfak' | 'web';
  }) {
    const [row] = await this.db
      .insert(feedbackReports)
      .values({
        userId: dto.userId ?? null,
        email: dto.email ?? null,
        subject: dto.subject,
        body: dto.body,
        type: dto.type,
        source: dto.source,
      })
      .returning({ id: feedbackReports.id });

    return { id: row!.id };
  }

  async listFeedback(params: { status?: string | undefined; source?: string | undefined; type?: string | undefined; limit?: number | undefined; cursor?: string | undefined }) {
    const limit = Math.min(params.limit ?? 30, 100);
    const conditions: SQL[] = [];
    if (params.status) conditions.push(eq(feedbackReports.status, params.status as 'open' | 'in_progress' | 'resolved'));
    if (params.source) conditions.push(eq(feedbackReports.source, params.source as 'sahne' | 'mutfak' | 'web'));
    if (params.type) conditions.push(eq(feedbackReports.type, params.type as 'talep' | 'gorus'));
    if (params.cursor) {
      const { sql } = await import('drizzle-orm');
      conditions.push(sql`${feedbackReports.createdAt} < (SELECT created_at FROM feedback_reports WHERE id = ${params.cursor})`);
    }

    const rows = await this.db
      .select({
        id: feedbackReports.id,
        subject: feedbackReports.subject,
        body: feedbackReports.body,
        type: feedbackReports.type,
        source: feedbackReports.source,
        status: feedbackReports.status,
        email: feedbackReports.email,
        adminNotes: feedbackReports.adminNotes,
        createdAt: feedbackReports.createdAt,
        resolvedAt: feedbackReports.resolvedAt,
        displayName: userProfiles.displayName,
      })
      .from(feedbackReports)
      .leftJoin(userProfiles, eq(userProfiles.userId, feedbackReports.userId!))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(feedbackReports.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    return { data, next_cursor: hasMore ? (data[data.length - 1]?.id ?? null) : null, has_more: hasMore };
  }

  async updateFeedbackStatus(id: string, status: 'open' | 'in_progress' | 'resolved', adminNotes?: string) {
    const [row] = await this.db
      .update(feedbackReports)
      .set({
        status,
        adminNotes: adminNotes ?? null,
        resolvedAt: status === 'resolved' ? new Date() : null,
      })
      .where(eq(feedbackReports.id, id))
      .returning({ id: feedbackReports.id });
    return row;
  }

  // ─── Mentor/Mentee Applications ───────────────────────────────────────────────

  async createMentorApplication(dto: {
    userId?: string | undefined;
    email: string;
    displayName: string;
    type: 'mentor' | 'mentee';
    source: 'sahne' | 'mutfak';
    expertise?: string | undefined;
    goals?: string | undefined;
    preferredFormat?: string | undefined;
  }) {
    const [row] = await this.db
      .insert(mentorApplications)
      .values({
        userId: dto.userId ?? null,
        email: dto.email,
        displayName: dto.displayName,
        type: dto.type,
        source: dto.source,
        expertise: dto.expertise ?? null,
        goals: dto.goals ?? null,
        preferredFormat: dto.preferredFormat ?? 'online',
      })
      .returning({ id: mentorApplications.id });

    return { id: row!.id };
  }

  async listMentorApplications(params: { status?: string | undefined; type?: string | undefined; limit?: number | undefined; cursor?: string | undefined }) {
    const limit = Math.min(params.limit ?? 30, 100);
    const conditions: SQL[] = [];
    if (params.status) conditions.push(eq(mentorApplications.status, params.status as 'pending' | 'reviewing' | 'matched' | 'rejected'));
    if (params.type) conditions.push(eq(mentorApplications.type, params.type as 'mentor' | 'mentee'));
    if (params.cursor) {
      const { sql } = await import('drizzle-orm');
      conditions.push(sql`${mentorApplications.createdAt} < (SELECT created_at FROM mentor_applications WHERE id = ${params.cursor})`);
    }

    const rows = await this.db
      .select()
      .from(mentorApplications)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(mentorApplications.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    return { data, next_cursor: hasMore ? (data[data.length - 1]?.id ?? null) : null, has_more: hasMore };
  }

  async updateMentorApplicationStatus(
    id: string,
    status: 'pending' | 'reviewing' | 'matched' | 'rejected',
    adminNotes?: string,
  ) {
    const [row] = await this.db
      .update(mentorApplications)
      .set({ status, adminNotes: adminNotes ?? null, reviewedAt: new Date() })
      .where(eq(mentorApplications.id, id))
      .returning({ id: mentorApplications.id });
    return row;
  }
}
