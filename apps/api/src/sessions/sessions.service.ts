import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { eq, and, desc, isNull, gte } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  meetingSessions,
  meetingParticipants,
  mentorshipRequests,
  mentorshipSessions,
  users,
  userProfiles,
} from '@haritailesi/database';

@Injectable()
export class SessionsService {
  constructor(@InjectDb() private readonly db: Database) {}

  // ─── Start / Get ──────────────────────────────────────────────────────────────

  async startOrGetSession(
    userId: string,
    referenceType: 'mentorship',
    referenceId: string,
  ) {
    // Zaten açık bir session var mı?
    const existing = await this.db.query.meetingSessions.findFirst({
      where: and(
        eq(meetingSessions.referenceType, referenceType),
        eq(meetingSessions.referenceId, referenceId),
      ),
    });
    if (existing) return existing;

    if (referenceType === 'mentorship') {
      await this.assertMentorshipAccess(userId, referenceId);
    }

    const roomName = `hrtl-${referenceType}-${referenceId}`;
    const [session] = await this.db
      .insert(meetingSessions)
      .values({
        referenceType,
        referenceId,
        roomName,
        hostUserId: userId,
        startedAt: new Date(),
      })
      .returning();

    return session;
  }

  async getSession(referenceType: string, referenceId: string) {
    const session = await this.db.query.meetingSessions.findFirst({
      where: and(
        eq(meetingSessions.referenceType, referenceType),
        eq(meetingSessions.referenceId, referenceId),
      ),
    });
    return session ?? null;
  }

  // ─── Events (join / leave) ────────────────────────────────────────────────────

  async recordJoin(sessionId: string, userId: string) {
    await this.db
      .insert(meetingParticipants)
      .values({ sessionId, userId, joinedAt: new Date() })
      .onConflictDoUpdate({
        target: [meetingParticipants.sessionId, meetingParticipants.userId],
        set: { joinedAt: new Date(), leftAt: null, durationSeconds: null },
      });

    if (!await this.sessionStarted(sessionId)) {
      await this.db
        .update(meetingSessions)
        .set({ startedAt: new Date() })
        .where(and(eq(meetingSessions.id, sessionId)));
    }
  }

  async recordLeave(sessionId: string, userId: string) {
    const participant = await this.db.query.meetingParticipants.findFirst({
      where: and(
        eq(meetingParticipants.sessionId, sessionId),
        eq(meetingParticipants.userId, userId),
      ),
    });
    if (!participant) return;

    const leftAt = new Date();
    const durationSeconds = Math.floor((leftAt.getTime() - participant.joinedAt.getTime()) / 1000);

    await this.db
      .update(meetingParticipants)
      .set({ leftAt, durationSeconds })
      .where(eq(meetingParticipants.id, participant.id));
  }

  // ─── My Sessions ──────────────────────────────────────────────────────────────

  async getMySessions(userId: string) {
    // Kullanıcının katıldığı veya host olduğu tüm sessionlar
    const participations = await this.db.query.meetingParticipants.findMany({
      where: eq(meetingParticipants.userId, userId),
      with: {
        session: true,
      },
      orderBy: [desc(meetingParticipants.joinedAt)],
    });
    return participations.map((p) => ({
      ...p.session,
      joinedAt: p.joinedAt,
      leftAt: p.leftAt,
      durationSeconds: p.durationSeconds,
    }));
  }

  // ─── Upcoming Sessions (for calendar) ────────────────────────────────────────

  async getMyUpcomingMentorshipSessions(userId: string) {
    const now = new Date();

    // Yeni tablo: mentorship_sessions üzerinden planlanmış gelecek oturumlar
    const sessionRows = await this.db.query.mentorshipSessions.findMany({
      where: and(
        eq(mentorshipSessions.status, 'scheduled'),
        gte(mentorshipSessions.scheduledAt, now),
      ),
      with: {
        engagement: {
          columns: {
            id: true, topic: true, status: true, menteeId: true,
            mentorId: true, preferredFormat: true, engagementType: true,
          },
        },
      },
      orderBy: [mentorshipSessions.scheduledAt],
    });

    // Kullanıcıya ait olanları filtrele
    const mine = sessionRows.filter(
      s => s.engagement.menteeId === userId || s.engagement.mentorId === userId,
    );

    const enriched = await Promise.all(
      mine.map(async (s) => {
        const eng = s.engagement;
        const counterpartId = eng.menteeId === userId ? eng.mentorId : eng.menteeId;
        const role = eng.menteeId === userId ? 'mentee' : 'mentor';
        const [counterpartUser, counterpartProfile] = await Promise.all([
          this.db.query.users.findFirst({ where: eq(users.id, counterpartId), columns: { email: true } }),
          this.db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, counterpartId),
            columns: { displayName: true, avatarUrl: true, profession: true },
          }),
        ]);
        const meetingSession = await this.getSession('mentorship', s.id);
        return {
          id: eng.id,
          sessionRowId: s.id,
          sessionNumber: s.sessionNumber,
          engagementType: eng.engagementType,
          topic: eng.topic,
          status: s.status,
          scheduledAt: s.scheduledAt,
          proposedScheduledAt: null,
          rescheduleNote: null,
          menteeId: eng.menteeId,
          mentorId: eng.mentorId,
          mentorNote: null,
          preferredFormat: eng.preferredFormat,
          role,
          counterpart: {
            email: counterpartUser?.email ?? '',
            displayName: counterpartProfile?.displayName ?? null,
            avatarUrl: counterpartProfile?.avatarUrl ?? null,
            profession: counterpartProfile?.profession ?? null,
          },
          roomName: meetingSession?.roomName ?? null,
          sessionId: meetingSession?.id ?? null,
        };
      }),
    );

    return enriched;
  }

  // ─── Completed sessions awaiting mentee rating ────────────────────────────────

  async getMyUnratedSessions(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 60);

    // Mentee'nin notu olmayan tamamlanmış session'lar
    const sessionRows = await this.db.query.mentorshipSessions.findMany({
      where: and(
        eq(mentorshipSessions.status, 'completed'),
        isNull(mentorshipSessions.menteeNote),
        gte(mentorshipSessions.completedAt, since),
      ),
      with: {
        engagement: {
          columns: {
            id: true, topic: true, status: true, menteeId: true,
            mentorId: true, preferredFormat: true, engagementType: true,
          },
        },
      },
    });

    const mine = sessionRows.filter(s => s.engagement.menteeId === userId);

    const enriched = await Promise.all(
      mine.map(async (s) => {
        const eng = s.engagement;
        const [counterpartUser, counterpartProfile] = await Promise.all([
          this.db.query.users.findFirst({ where: eq(users.id, eng.mentorId), columns: { email: true } }),
          this.db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, eng.mentorId),
            columns: { displayName: true, avatarUrl: true, profession: true },
          }),
        ]);
        return {
          id: eng.id,
          sessionRowId: s.id,
          sessionNumber: s.sessionNumber,
          engagementType: eng.engagementType,
          topic: eng.topic,
          status: s.status,
          scheduledAt: s.scheduledAt,
          completedAt: s.completedAt,
          menteeRating: s.menteeRating,
          menteeNote: s.menteeNote,
          menteeId: eng.menteeId,
          mentorId: eng.mentorId,
          role: 'mentee' as const,
          proposedScheduledAt: null,
          rescheduleNote: null,
          mentorNote: null,
          preferredFormat: eng.preferredFormat,
          counterpart: {
            email: counterpartUser?.email ?? '',
            displayName: counterpartProfile?.displayName ?? null,
            avatarUrl: counterpartProfile?.avatarUrl ?? null,
            profession: counterpartProfile?.profession ?? null,
          },
          roomName: null,
          sessionId: null,
        };
      }),
    );

    return enriched;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private async sessionStarted(sessionId: string) {
    const s = await this.db.query.meetingSessions.findFirst({
      where: eq(meetingSessions.id, sessionId),
      columns: { startedAt: true },
    });
    return s?.startedAt !== null;
  }

  private async assertMentorshipAccess(userId: string, requestId: string) {
    const req = await this.db.query.mentorshipRequests.findFirst({
      where: and(
        eq(mentorshipRequests.id, requestId),
        eq(mentorshipRequests.status, 'accepted'),
      ),
    });
    if (!req) throw new NotFoundException('Kabul edilmiş seans bulunamadı.');
    if (req.menteeId !== userId && req.mentorId !== userId) {
      throw new ForbiddenException('Bu seansa erişim yetkiniz yok.');
    }
    if (!req.scheduledAt) throw new BadRequestException('Seans zamanı belirlenmemiş.');

    // 30 dakika öncesinden itibaren aktif
    const openAt = new Date(req.scheduledAt.getTime() - 30 * 60 * 1000);
    if (new Date() < openAt) {
      throw new BadRequestException('Görüşme henüz başlamamıştır. 30 dakika öncesinden girebilirsiniz.');
    }
  }
}
