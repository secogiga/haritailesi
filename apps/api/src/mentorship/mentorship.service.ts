import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { eq, and, isNull, desc, ne, sql, inArray, or } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  mentorProfiles,
  mentorshipRequests,
  mentorshipSessions,
  menteeApplications,
  users,
  userProfiles,
} from '@haritailesi/database';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const EXPERTISE_AREAS = [
  'kadastro', 'fotogrametri', 'uzaktan_algilama', 'cbs_gis',
  'insaat_olcmesi', 'gayrimenkul', 'deniz_hidrografi', 'yazilim_teknoloji',
  'kariyer_danismanligi', 'akademik_arastirma', 'girisimcilik',
];
export { EXPERTISE_AREAS };

const PERIODIC_MONTHS = 4; // dönemlik program süresi

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

function formatTR(d: Date): string {
  return d.toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function toIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
}

function buildIcs(uid: string, start: Date, durationMin: number, mentorName: string, menteeName: string, topic: string): string {
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Haritailesi//Mentorluk//TR', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@haritailesi.org`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    'SUMMARY:Mentorluk Seansı',
    `DESCRIPTION:Konu: ${topic}\\nMentör: ${mentorName}\\nMentee: ${menteeName}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY',
    'DESCRIPTION:30 dakika kaldı', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class MentorshipService {
  private readonly logger = new Logger(MentorshipService.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // MENTOR PROFİLİ
  // ═══════════════════════════════════════════════════════════════════════════

  async getMyMentorProfile(userId: string) {
    return this.db.query.mentorProfiles.findFirst({
      where: eq(mentorProfiles.userId, userId),
    });
  }

  async upsertMentorProfile(
    userId: string,
    data: {
      expertiseAreas: string[];
      bio?: string;
      sessionFormat: 'online' | 'in_person' | 'both';
      city?: string;
      sessionDurationMin: number;
      sessionDurationMax: number;
      capacityType: 'monthly' | 'periodic' | 'both';
      monthlyCapacity: number;
      periodicCapacity: number;
      isAcceptingRequests: boolean;
    },
  ) {
    const existing = await this.db.query.mentorProfiles.findFirst({
      where: eq(mentorProfiles.userId, userId),
    });
    const payload = { ...data, updatedAt: new Date() };
    if (existing) {
      const [updated] = await this.db
        .update(mentorProfiles).set(payload)
        .where(eq(mentorProfiles.userId, userId)).returning();
      return updated;
    }
    const [created] = await this.db
      .insert(mentorProfiles).values({ userId, ...data }).returning();
    return created;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MENTOR DİZİNİ (PUBLIC)
  // ═══════════════════════════════════════════════════════════════════════════

  async listMentors(params: { expertise?: string; format?: string; type?: string } = {}) {
    const rows = await this.db
      .select({
        id: mentorProfiles.id,
        userId: mentorProfiles.userId,
        expertiseAreas: mentorProfiles.expertiseAreas,
        bio: mentorProfiles.bio,
        sessionFormat: mentorProfiles.sessionFormat,
        sessionDurationMin: mentorProfiles.sessionDurationMin,
        sessionDurationMax: mentorProfiles.sessionDurationMax,
        capacityType: mentorProfiles.capacityType,
        city: mentorProfiles.city,
        monthlyCapacity: mentorProfiles.monthlyCapacity,
        periodicCapacity: mentorProfiles.periodicCapacity,
        completedSessionCount: mentorProfiles.completedSessionCount,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
        averageRating: sql<number | null>`(
          SELECT ROUND(AVG(ms.mentee_rating)::numeric, 1)
          FROM mentorship_sessions ms
          JOIN mentorship_requests mr ON mr.id = ms.engagement_id
          WHERE mr.mentor_id = ${mentorProfiles.userId}
            AND ms.mentee_rating IS NOT NULL
        )`,
        ratingCount: sql<number>`(
          SELECT COUNT(*)
          FROM mentorship_sessions ms
          JOIN mentorship_requests mr ON mr.id = ms.engagement_id
          WHERE mr.mentor_id = ${mentorProfiles.userId}
            AND ms.mentee_rating IS NOT NULL
        )`,
      })
      .from(mentorProfiles)
      .innerJoin(userProfiles, eq(userProfiles.userId, mentorProfiles.userId))
      .innerJoin(users, and(eq(users.id, mentorProfiles.userId), isNull(users.deletedAt)))
      .where(and(
        eq(mentorProfiles.isAcceptingRequests, true),
        eq(mentorProfiles.adminStatus, 'approved'),
      ))
      .orderBy(desc(mentorProfiles.completedSessionCount));

    let result = rows;
    if (params.expertise) result = result.filter(r => r.expertiseAreas.includes(params.expertise!));
    if (params.format && params.format !== 'both') {
      result = result.filter(r => r.sessionFormat === params.format || r.sessionFormat === 'both');
    }
    if (params.type) {
      result = result.filter(r =>
        params.type === 'periodic'
          ? r.capacityType === 'periodic' || r.capacityType === 'both'
          : r.capacityType === 'monthly' || r.capacityType === 'both',
      );
    }
    return result;
  }

  async getMentor(userId: string) {
    const rows = await this.db
      .select({
        id: mentorProfiles.id,
        userId: mentorProfiles.userId,
        expertiseAreas: mentorProfiles.expertiseAreas,
        bio: mentorProfiles.bio,
        sessionFormat: mentorProfiles.sessionFormat,
        sessionDurationMin: mentorProfiles.sessionDurationMin,
        sessionDurationMax: mentorProfiles.sessionDurationMax,
        capacityType: mentorProfiles.capacityType,
        city: mentorProfiles.city,
        monthlyCapacity: mentorProfiles.monthlyCapacity,
        periodicCapacity: mentorProfiles.periodicCapacity,
        completedSessionCount: mentorProfiles.completedSessionCount,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
      })
      .from(mentorProfiles)
      .innerJoin(userProfiles, eq(userProfiles.userId, mentorProfiles.userId))
      .where(eq(mentorProfiles.userId, userId))
      .limit(1);
    if (!rows[0]) throw new NotFoundException('Mentor bulunamadı.');
    return rows[0];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MENTEE → MENTÖR DOĞRUDAN İSTEK (single_session hızlı yol)
  // ═══════════════════════════════════════════════════════════════════════════

  async createRequest(
    menteeId: string,
    data: {
      mentorId: string;
      topic: string;
      goal: string;
      preferredFormat: 'online' | 'in_person';
    },
  ) {
    if (menteeId === data.mentorId) throw new BadRequestException('Kendinize mentorluk isteği gönderemezsiniz.');

    const existing = await this.db.query.mentorshipRequests.findFirst({
      where: and(
        eq(mentorshipRequests.menteeId, menteeId),
        eq(mentorshipRequests.mentorId, data.mentorId),
        ne(mentorshipRequests.status, 'completed'),
        ne(mentorshipRequests.status, 'rejected'),
        ne(mentorshipRequests.status, 'cancelled'),
      ),
    });
    if (existing) throw new BadRequestException('Bu mentöre zaten açık bir isteğiniz var.');

    const mentorProfile = await this.db.query.mentorProfiles.findFirst({
      where: and(
        eq(mentorProfiles.userId, data.mentorId),
        eq(mentorProfiles.isAcceptingRequests, true),
        eq(mentorProfiles.adminStatus, 'approved'),
      ),
    });
    if (!mentorProfile) throw new BadRequestException('Mentor şu anda yeni istekleri kabul etmiyor.');

    const [engagement] = await this.db
      .insert(mentorshipRequests)
      .values({ menteeId, ...data, engagementType: 'single_session', initiatedBy: 'mentee' })
      .returning();

    if (engagement) {
      // Tek session stub oluştur
      await this.db.insert(mentorshipSessions).values({
        engagementId: engagement.id,
        sessionNumber: 1,
        status: 'pending',
      });

      void this.notifyMentorOfRequest(data.mentorId, menteeId, data.topic, data.goal, 'single_session')
        .catch((e: unknown) => this.logger.error('request email failed', e));
      void this.notificationsService.create(data.mentorId, {
        type: 'mentorship_request',
        title: 'Yeni mentorluk isteği',
        body: `Konu: ${data.topic}`,
        data: { requestId: engagement.id },
      }).catch((e: unknown) => this.logger.error('request notification failed', e));
    }
    return engagement!;
  }

  async getMyRequestsAsMentee(menteeId: string) {
    return this.db.query.mentorshipRequests.findMany({
      where: eq(mentorshipRequests.menteeId, menteeId),
      orderBy: [desc(mentorshipRequests.createdAt)],
      with: {
        mentor: {
          columns: { id: true, email: true },
          with: { profile: { columns: { displayName: true, avatarUrl: true, profession: true } } },
        },
        sessions: { orderBy: [mentorshipSessions.sessionNumber] },
      },
    });
  }

  async getMyRequestsAsMentor(mentorId: string) {
    return this.db.query.mentorshipRequests.findMany({
      where: eq(mentorshipRequests.mentorId, mentorId),
      orderBy: [desc(mentorshipRequests.createdAt)],
      with: {
        mentee: {
          columns: { id: true, email: true },
          with: { profile: { columns: { displayName: true, avatarUrl: true, profession: true, city: true } } },
        },
        sessions: { orderBy: [mentorshipSessions.sessionNumber] },
      },
    });
  }

  async getMyHistory(userId: string) {
    const rows = await this.db.query.mentorshipRequests.findMany({
      where: and(
        or(
          eq(mentorshipRequests.menteeId, userId),
          eq(mentorshipRequests.mentorId, userId),
        ),
        inArray(mentorshipRequests.status, ['completed', 'cancelled', 'rejected']),
      ),
      orderBy: [desc(mentorshipRequests.updatedAt)],
      with: {
        mentor: {
          columns: { id: true, email: true },
          with: { profile: { columns: { displayName: true, avatarUrl: true, profession: true } } },
        },
        mentee: {
          columns: { id: true, email: true },
          with: { profile: { columns: { displayName: true, avatarUrl: true, profession: true } } },
        },
        sessions: { orderBy: [mentorshipSessions.sessionNumber] },
      },
    });

    return rows.map(row => {
      const isMentee = row.menteeId === userId;
      const peer = isMentee ? row.mentor : row.mentee;
      return {
        ...row,
        role: isMentee ? 'mentee' as const : 'mentor' as const,
        counterpart: {
          id: peer.id,
          email: peer.email,
          displayName: peer.profile?.displayName ?? null,
          avatarUrl: peer.profile?.avatarUrl ?? null,
          profession: peer.profile?.profession ?? null,
        },
      };
    });
  }

  async cancelRequest(menteeId: string, requestId: string) {
    const req = await this.db.query.mentorshipRequests.findFirst({
      where: and(eq(mentorshipRequests.id, requestId), eq(mentorshipRequests.menteeId, menteeId)),
    });
    if (!req) throw new NotFoundException('İstek bulunamadı.');
    if (!['pending', 'accepted'].includes(req.status)) throw new BadRequestException('Bu istek iptal edilemez.');
    const [updated] = await this.db
      .update(mentorshipRequests)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(mentorshipRequests.id, requestId))
      .returning();
    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OTURUM YÖNETİMİ
  // ═══════════════════════════════════════════════════════════════════════════

  async getEngagementSessions(userId: string, engagementId: string) {
    const engagement = await this.db.query.mentorshipRequests.findFirst({
      where: eq(mentorshipRequests.id, engagementId),
    });
    if (!engagement) throw new NotFoundException('Eşleşme bulunamadı.');
    if (engagement.mentorId !== userId && engagement.menteeId !== userId) {
      throw new ForbiddenException('Bu eşleşmeye erişim yetkiniz yok.');
    }
    return this.db.query.mentorshipSessions.findMany({
      where: eq(mentorshipSessions.engagementId, engagementId),
      orderBy: [mentorshipSessions.sessionNumber],
    });
  }

  // Mentor: session tarihini belirle
  async scheduleSession(mentorId: string, sessionId: string, scheduledAt: string) {
    const session = await this.db.query.mentorshipSessions.findFirst({
      where: eq(mentorshipSessions.id, sessionId),
      with: { engagement: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    if (session.engagement.mentorId !== mentorId) throw new ForbiddenException('Bu oturumu planlama yetkiniz yok.');
    if (session.engagement.status !== 'accepted') throw new BadRequestException('Sadece aktif eşleşmelerde oturum planlanabilir.');
    if (session.status === 'completed') throw new BadRequestException('Tamamlanmış oturumun tarihi değiştirilemez.');

    const [updated] = await this.db
      .update(mentorshipSessions)
      .set({ scheduledAt: new Date(scheduledAt), status: 'scheduled', updatedAt: new Date() })
      .where(eq(mentorshipSessions.id, sessionId))
      .returning();

    // Mentee'ye bildirim
    void this.notificationsService.create(session.engagement.menteeId, {
      type: 'session_scheduled',
      title: `${session.engagement.engagementType === 'periodic' ? `${session.sessionNumber}. Oturum` : 'Oturum'} Planlandı`,
      body: `${formatTR(new Date(scheduledAt))} tarihine ayarlandı.`,
      data: { sessionId, engagementId: session.engagementId },
    }).catch((e: unknown) => this.logger.error('schedule notify failed', e));

    // Takvim dosyası ile email gönder
    void this.sendSessionScheduledEmail(session.engagement, session.sessionNumber, new Date(scheduledAt), mentorId)
      .catch((e: unknown) => this.logger.error('schedule email failed', e));

    return updated;
  }

  // Mentör: oturumu tamamlandı olarak işaretle
  async completeSessionById(mentorId: string, sessionId: string) {
    const session = await this.db.query.mentorshipSessions.findFirst({
      where: eq(mentorshipSessions.id, sessionId),
      with: { engagement: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    if (session.engagement.mentorId !== mentorId) throw new ForbiddenException('Bu oturumu tamamlama yetkiniz yok.');
    if (session.status !== 'scheduled') throw new BadRequestException('Sadece planlanmış oturumlar tamamlanabilir.');

    const now = new Date();
    const [updated] = await this.db
      .update(mentorshipSessions)
      .set({ status: 'completed', completedAt: now, updatedAt: now })
      .where(eq(mentorshipSessions.id, sessionId))
      .returning();

    // Mentör istatistiği güncelle
    await this.db.update(mentorProfiles)
      .set({ completedSessionCount: sql`${mentorProfiles.completedSessionCount} + 1`, updatedAt: now })
      .where(eq(mentorProfiles.userId, mentorId));

    // Tüm session'lar tamamlandı mı kontrol et
    const allSessions = await this.db.query.mentorshipSessions.findMany({
      where: eq(mentorshipSessions.engagementId, session.engagementId),
    });
    const allDone = allSessions.every(s => s.id === sessionId ? true : s.status === 'completed');

    if (allDone) {
      if (session.engagement.engagementType === 'single_session') {
        // Tek seans — engagement tamamlandı
        await this.db.update(mentorshipRequests)
          .set({ status: 'completed', completedAt: now, updatedAt: now })
          .where(eq(mentorshipRequests.id, session.engagementId));
      }
      // Dönemlik için: son değerlendirme bekleniyor, engagement 'accepted' kalır
      // finalEvaluation çağrıldığında tamamlanacak

      // Her iki tarafa bildirim
      const title = session.engagement.engagementType === 'periodic'
        ? `${allSessions.length}. oturum tamamlandı — Dönem değerlendirmesini yapın`
        : 'Mentorluk seansınız tamamlandı';
      const body = session.engagement.engagementType === 'periodic'
        ? 'Dönem sonunda değerlendirmenizi unutmayın.'
        : 'Değerlendirme yapmayı unutmayın.';

      void this.notificationsService.create(session.engagement.menteeId, {
        type: 'session_completed',
        title, body,
        data: { sessionId, engagementId: session.engagementId },
      }).catch(() => null);
    } else {
      void this.notificationsService.create(session.engagement.menteeId, {
        type: 'session_completed',
        title: `${session.sessionNumber}. Oturum Tamamlandı`,
        body: 'Oturum notunuzu ekleyebilirsiniz.',
        data: { sessionId, engagementId: session.engagementId },
      }).catch(() => null);
    }

    return updated;
  }

  // Her iki taraf: oturum sonrası not ekle
  async submitSessionNote(
    userId: string,
    sessionId: string,
    data: { note: string; rating?: number },
  ) {
    const session = await this.db.query.mentorshipSessions.findFirst({
      where: eq(mentorshipSessions.id, sessionId),
      with: { engagement: true },
    });
    if (!session) throw new NotFoundException('Oturum bulunamadı.');
    if (session.status !== 'completed') throw new BadRequestException('Sadece tamamlanmış oturumlara not eklenebilir.');

    const isMentor = session.engagement.mentorId === userId;
    const isMentee = session.engagement.menteeId === userId;
    if (!isMentor && !isMentee) throw new ForbiddenException('Bu oturuma erişim yetkiniz yok.');

    if (isMentor && session.mentorNote) throw new BadRequestException('Mentör notu zaten girilmiş.');
    if (isMentee && session.menteeNote) throw new BadRequestException('Mentee notu zaten girilmiş.');

    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new BadRequestException('Puan 1-5 arasında olmalıdır.');
    }

    const patch = isMentee
      ? { menteeNote: data.note, ...(data.rating !== undefined && { menteeRating: data.rating }) }
      : { mentorNote: data.note };

    const [updated] = await this.db
      .update(mentorshipSessions)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(mentorshipSessions.id, sessionId))
      .returning();

    return updated;
  }

  // Dönem sonu değerlendirmesi (periodic engagements)
  async submitFinalEvaluation(
    userId: string,
    engagementId: string,
    data: { comment: string; rating?: number },
  ) {
    const engagement = await this.db.query.mentorshipRequests.findFirst({
      where: eq(mentorshipRequests.id, engagementId),
    });
    if (!engagement) throw new NotFoundException('Eşleşme bulunamadı.');
    if (engagement.engagementType !== 'periodic') throw new BadRequestException('Sadece dönemlik eşleşmelerde dönem değerlendirmesi yapılır.');
    if (engagement.status !== 'accepted') throw new BadRequestException('Tamamlanmamış bir eşleşmede değerlendirme yapılamaz.');

    const isMentor = engagement.mentorId === userId;
    const isMentee = engagement.menteeId === userId;
    if (!isMentor && !isMentee) throw new ForbiddenException('Bu eşleşmeye erişim yetkiniz yok.');

    if (isMentee && engagement.menteeFinalComment) throw new BadRequestException('Mentee değerlendirmesi zaten girilmiş.');
    if (isMentor && engagement.mentorFinalComment) throw new BadRequestException('Mentör değerlendirmesi zaten girilmiş.');

    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new BadRequestException('Puan 1-5 arasında olmalıdır.');
    }

    const patch = isMentee
      ? { menteeFinalComment: data.comment, ...(data.rating !== undefined && { menteeFinalRating: data.rating }) }
      : { mentorFinalComment: data.comment };

    const [updated] = await this.db
      .update(mentorshipRequests)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(mentorshipRequests.id, engagementId))
      .returning();

    // Her ikisi de değerlendirme girdiyse engagement tamamlandı
    const menteeEval = isMentee ? data.comment : engagement.menteeFinalComment;
    const mentorEval = isMentor ? data.comment : engagement.mentorFinalComment;
    if (menteeEval && mentorEval) {
      const now = new Date();
      await this.db.update(mentorshipRequests)
        .set({ status: 'completed', completedAt: now, updatedAt: now })
        .where(eq(mentorshipRequests.id, engagementId));
    }

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MENTÖR: EŞLEŞME YANITI
  // ═══════════════════════════════════════════════════════════════════════════

  async respondToRequest(
    mentorId: string,
    requestId: string,
    data: { action: 'accept' | 'reject'; mentorNote?: string },
  ) {
    const req = await this.db.query.mentorshipRequests.findFirst({
      where: and(eq(mentorshipRequests.id, requestId), eq(mentorshipRequests.mentorId, mentorId)),
    });
    if (!req) throw new NotFoundException('Eşleşme bulunamadı.');
    if (req.status !== 'pending') throw new BadRequestException('Sadece bekleyen eşleşmelere yanıt verilebilir.');

    const [updated] = await this.db
      .update(mentorshipRequests)
      .set({
        status: data.action === 'accept' ? 'accepted' : 'rejected',
        mentorNote: data.mentorNote ?? null,
        updatedAt: new Date(),
      })
      .where(eq(mentorshipRequests.id, requestId))
      .returning();

    if (data.action === 'accept') {
      void this.notificationsService.create(req.menteeId, {
        type: 'mentorship_accepted',
        title: `Mentorluk ${req.engagementType === 'periodic' ? 'dönem programınız' : 'isteğiniz'} kabul edildi`,
        body: req.engagementType === 'periodic'
          ? 'Mentörünüz programı kabul etti. Oturum tarihlerini yakında belirleyecek.'
          : 'Mentörünüz isteğinizi kabul etti. Oturum tarihini yakında belirleyecek.',
        data: { requestId },
      }).catch(() => null);
    } else {
      void this.notificationsService.create(req.menteeId, {
        type: 'mentorship_rejected',
        title: 'Mentorluk isteğiniz reddedildi',
        body: data.mentorNote ? `Mentör notu: ${data.mentorNote}` : 'Başka bir mentor ile eşleşme talep edebilirsiniz.',
        data: { requestId },
      }).catch(() => null);
    }

    void this.notifyResponseToMentee(data.action, req.menteeId, mentorId, requestId, req.topic, data.mentorNote ?? '')
      .catch((e: unknown) => this.logger.error('response email failed', e));

    return updated;
  }

  // ─── Reschedule (geriye uyumluluk, single-session için) ───────────────────

  async proposeReschedule(mentorId: string, requestId: string, data: { proposedScheduledAt: string; rescheduleNote?: string }) {
    const req = await this.db.query.mentorshipRequests.findFirst({
      where: and(eq(mentorshipRequests.id, requestId), eq(mentorshipRequests.mentorId, mentorId)),
    });
    if (!req) throw new NotFoundException('Eşleşme bulunamadı.');
    if (!['accepted', 'reschedule_proposed'].includes(req.status)) {
      throw new BadRequestException('Sadece aktif eşleşmelerde yeniden zamanlama önerilebilir.');
    }
    const [updated] = await this.db
      .update(mentorshipRequests)
      .set({ status: 'reschedule_proposed', proposedScheduledAt: new Date(data.proposedScheduledAt), rescheduleNote: data.rescheduleNote ?? null, updatedAt: new Date() })
      .where(eq(mentorshipRequests.id, requestId))
      .returning();
    return updated;
  }

  async respondToReschedule(menteeId: string, requestId: string, action: 'accept' | 'reject') {
    const req = await this.db.query.mentorshipRequests.findFirst({
      where: and(eq(mentorshipRequests.id, requestId), eq(mentorshipRequests.menteeId, menteeId)),
    });
    if (!req) throw new NotFoundException('Eşleşme bulunamadı.');
    if (req.status !== 'reschedule_proposed') throw new BadRequestException('Bekleyen bir yeniden zamanlama önerisi yok.');
    if (!req.proposedScheduledAt) throw new BadRequestException('Önerilen zaman bulunamadı.');
    const [updated] = await this.db
      .update(mentorshipRequests)
      .set({ status: 'accepted', scheduledAt: action === 'accept' ? req.proposedScheduledAt : req.scheduledAt, proposedScheduledAt: null, rescheduleNote: null, updatedAt: new Date() })
      .where(eq(mentorshipRequests.id, requestId))
      .returning();
    return updated;
  }

  // Eski endpoint geriye uyumluluk
  async completeSession(mentorId: string, requestId: string) {
    // Eğer sessions tablosunda kayıt varsa oraya yönlendir
    const sessions = await this.db.query.mentorshipSessions.findMany({
      where: eq(mentorshipSessions.engagementId, requestId),
    });
    const scheduledSession = sessions.find(s => s.status === 'scheduled');
    if (scheduledSession) {
      return this.completeSessionById(mentorId, scheduledSession.id);
    }
    // Fallback — eski davranış
    const req = await this.db.query.mentorshipRequests.findFirst({
      where: and(eq(mentorshipRequests.id, requestId), eq(mentorshipRequests.mentorId, mentorId)),
    });
    if (!req) throw new NotFoundException('Eşleşme bulunamadı.');
    if (req.status !== 'accepted') throw new BadRequestException('Sadece kabul edilmiş eşleşmeler tamamlanabilir.');
    const now = new Date();
    const [updated] = await this.db
      .update(mentorshipRequests)
      .set({ status: 'completed', completedAt: now, updatedAt: now })
      .where(eq(mentorshipRequests.id, requestId))
      .returning();
    await this.db.update(mentorProfiles)
      .set({ completedSessionCount: sql`${mentorProfiles.completedSessionCount} + 1`, updatedAt: now })
      .where(eq(mentorProfiles.userId, mentorId));
    return updated;
  }

  async submitFeedback(menteeId: string, requestId: string, data: { rating: number; feedbackComment?: string }) {
    if (data.rating < 1 || data.rating > 5) throw new BadRequestException('Puan 1-5 arasında olmalıdır.');
    const req = await this.db.query.mentorshipRequests.findFirst({
      where: and(eq(mentorshipRequests.id, requestId), eq(mentorshipRequests.menteeId, menteeId)),
    });
    if (!req) throw new NotFoundException('İstek bulunamadı.');
    if (req.status !== 'completed') throw new BadRequestException('Sadece tamamlanmış seanslara değerlendirme yapılabilir.');
    if (req.rating !== null) throw new BadRequestException('Bu seans zaten değerlendirildi.');
    const [updated] = await this.db
      .update(mentorshipRequests)
      .set({ rating: data.rating, feedbackComment: data.feedbackComment ?? null, updatedAt: new Date() })
      .where(eq(mentorshipRequests.id, requestId))
      .returning();
    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MENTEE BAŞVURUSU (sahne / mutfak / kutu'dan)
  // ═══════════════════════════════════════════════════════════════════════════

  async createMenteeApplication(data: {
    userId?: string;
    name: string;
    email: string;
    topic: string;
    goal: string;
    preferredFormat: string;
    engagementType: 'single_session' | 'periodic';
    source: string;
  }) {
    const [app] = await this.db
      .insert(menteeApplications)
      .values({
        userId: data.userId ?? null,
        name: data.name,
        email: data.email,
        topic: data.topic,
        goal: data.goal,
        preferredFormat: data.preferredFormat,
        engagementType: data.engagementType,
        source: data.source,
      })
      .returning();
    return app;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMİN
  // ═══════════════════════════════════════════════════════════════════════════

  async adminListMentorPool(adminStatus?: string) {
    const where = adminStatus ? eq(mentorProfiles.adminStatus, adminStatus) : undefined;
    return this.db.query.mentorProfiles.findMany({
      where,
      orderBy: [desc(mentorProfiles.createdAt)],
      with: {
        user: {
          columns: { id: true, email: true },
          with: { profile: { columns: { displayName: true, city: true, profession: true } } },
        },
      },
    });
  }

  async adminReviewMentor(mentorProfileId: string, status: 'approved' | 'rejected', note?: string) {
    const [updated] = await this.db
      .update(mentorProfiles)
      .set({ adminStatus: status, adminNote: note ?? null, updatedAt: new Date() })
      .where(eq(mentorProfiles.id, mentorProfileId))
      .returning();
    if (!updated) throw new NotFoundException('Mentor profili bulunamadı.');

    const mentor = await this.db.query.users.findFirst({
      where: eq(users.id, updated.userId),
      columns: { id: true, email: true },
      with: { profile: { columns: { displayName: true } } },
    });
    if (mentor) {
      const name = mentor.profile?.displayName ?? mentor.email;
      if (status === 'approved') {
        await this.emailService.send(mentor.email, 'mentor_profile_approved', { displayName: name });
        await this.notificationsService.create(mentor.id, {
          type: 'mentor_approved',
          title: 'Mentor Profiliniz Onaylandı',
          body: 'Artık mentee eşleşmelerinde yer alabilirsiniz.',
        });
      } else {
        await this.notificationsService.create(mentor.id, {
          type: 'mentor_rejected',
          title: 'Mentor Başvurusu',
          body: note ? `Profiliniz onaylanmadı: ${note}` : 'Profiliniz şu an için onaylanmadı.',
        });
      }
    }
    return updated;
  }

  async adminListMenteeApplications(status?: string, engagementType?: string) {
    const conditions: ReturnType<typeof eq>[] = [];
    if (status) conditions.push(eq(menteeApplications.status, status));
    if (engagementType) conditions.push(eq(menteeApplications.engagementType, engagementType));
    return this.db.query.menteeApplications.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(menteeApplications.createdAt)],
      with: {
        user: {
          columns: { id: true, email: true },
          with: {
            profile: {
              columns: {
                displayName: true,
                city: true,
                profession: true,
                bio: true,
                birthDate: true,
                graduationYear: true,
                workStatus: true,
                professionalExperienceYears: true,
                skillTags: true,
                linkedinUrl: true,
              },
            },
          },
        },
      },
    });
  }

  // Admin eşleştirme: mentor + onaylı mentee → session stub'ları oluştur → mentöre bildirim
  async adminCreateMatch(dto: {
    mentorUserId: string;
    menteeApplicationId: string;
    engagementType: 'single_session' | 'periodic';
  }) {
    const menteeApp = await this.db.query.menteeApplications.findFirst({
      where: eq(menteeApplications.id, dto.menteeApplicationId),
    });
    if (!menteeApp) throw new NotFoundException('Mentee başvurusu bulunamadı.');
    if (menteeApp.status === 'matched') throw new BadRequestException('Bu başvuru zaten eşleştirilmiş.');

    const mentorProfile = await this.db.query.mentorProfiles.findFirst({
      where: and(eq(mentorProfiles.userId, dto.mentorUserId), eq(mentorProfiles.adminStatus, 'approved')),
    });
    if (!mentorProfile) throw new NotFoundException('Onaylı mentor profili bulunamadı.');

    if (!menteeApp.userId) throw new BadRequestException('Bu mentee başvurusu bir üye hesabına bağlı değil.');

    const sessionCount = dto.engagementType === 'periodic' ? PERIODIC_MONTHS : 1;

    // Engagement oluştur
    const [engagement] = await this.db
      .insert(mentorshipRequests)
      .values({
        menteeId: menteeApp.userId,
        mentorId: dto.mentorUserId,
        topic: menteeApp.topic,
        goal: menteeApp.goal,
        preferredFormat: menteeApp.preferredFormat as 'online' | 'in_person',
        engagementType: dto.engagementType,
        periodMonths: dto.engagementType === 'periodic' ? PERIODIC_MONTHS : null,
        status: 'pending',
        initiatedBy: 'admin',
        menteeApplicationId: dto.menteeApplicationId,
      })
      .returning();

    if (!engagement) throw new BadRequestException('Eşleşme oluşturulamadı.');

    // Session stub'larını oluştur (tarih mentor tarafından belirlenecek)
    await this.db.insert(mentorshipSessions).values(
      Array.from({ length: sessionCount }, (_, i) => ({
        engagementId: engagement.id,
        sessionNumber: i + 1,
        status: 'pending',
      })),
    );

    // Mentee başvurusunu 'matched' yap
    await this.db.update(menteeApplications)
      .set({ status: 'matched' })
      .where(eq(menteeApplications.id, dto.menteeApplicationId));

    // Mentor ve mentee'ye bildirim
    const [mentorUser, menteeUser, mentorProfileUser, menteeProfile] = await Promise.all([
      this.db.query.users.findFirst({ where: eq(users.id, dto.mentorUserId), columns: { email: true } }),
      this.db.query.users.findFirst({ where: eq(users.id, menteeApp.userId!), columns: { email: true } }),
      this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, dto.mentorUserId), columns: { displayName: true } }),
      this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, menteeApp.userId!), columns: { displayName: true } }),
    ]);

    const mentorName = mentorProfileUser?.displayName ?? (mentorUser?.email ?? 'Mentör');
    const menteeName = menteeProfile?.displayName ?? menteeApp.name;
    const typeLabel = dto.engagementType === 'periodic' ? 'dönemlik (4 ay)' : 'tek seans';

    if (mentorUser?.email) {
      await this.emailService.send(mentorUser.email, 'mentorship_request_received', {
        displayName: mentorName, menteeName,
        topic: menteeApp.topic, goal: menteeApp.goal,
        scheduledAt: `${typeLabel} — tarih sizin tarafınızdan belirlenecek`,
      });
      await this.notificationsService.create(dto.mentorUserId, {
        type: 'admin_match_pending',
        title: 'Yeni Eşleşme Önerisi',
        body: `${menteeName} ile "${menteeApp.topic}" konusunda ${typeLabel} mentorluk önerildi.`,
        data: { requestId: engagement.id },
      });
    }

    if (menteeApp.userId) {
      await this.notificationsService.create(menteeApp.userId, {
        type: 'admin_match_pending',
        title: 'Mentorluk Eşleşmesi Oluşturuldu',
        body: `${mentorName} ile eşleştirildniz. Mentörünüzün onayı bekleniyor.`,
        data: { requestId: engagement.id },
      });
    }

    return { ...engagement, sessions: [] };
  }

  async listAllRequests(params: { status?: string; engagementType?: string } = {}) {
    const conditions = [];
    if (params.status) conditions.push(eq(mentorshipRequests.status, params.status));
    if (params.engagementType) conditions.push(eq(mentorshipRequests.engagementType, params.engagementType));
    return this.db.query.mentorshipRequests.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(mentorshipRequests.createdAt)],
      with: {
        mentee: {
          columns: { id: true, email: true },
          with: { profile: { columns: { displayName: true } } },
        },
        mentor: {
          columns: { id: true, email: true },
          with: { profile: { columns: { displayName: true } } },
        },
        sessions: { orderBy: [mentorshipSessions.sessionNumber] },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAİL YARDIMCILARI
  // ═══════════════════════════════════════════════════════════════════════════

  private async notifyMentorOfRequest(
    mentorId: string, menteeId: string, topic: string, goal: string, type: string,
  ): Promise<void> {
    const [mentorUser, mentorProfile, menteeProfile] = await Promise.all([
      this.db.query.users.findFirst({ where: eq(users.id, mentorId), columns: { email: true } }),
      this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, mentorId), columns: { displayName: true } }),
      this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, menteeId), columns: { displayName: true } }),
    ]);
    if (!mentorUser?.email) return;
    await this.emailService.sendMentorshipRequestReceived(
      mentorUser.email,
      mentorProfile?.displayName ?? mentorUser.email,
      menteeProfile?.displayName ?? 'Bir üye',
      topic, goal,
    );
  }

  private async notifyResponseToMentee(
    action: 'accept' | 'reject', menteeId: string, mentorId: string,
    requestId: string, topic: string, mentorNote: string,
  ): Promise<void> {
    const [menteeUser, menteeProfile, mentorUser, mentorProfile] = await Promise.all([
      this.db.query.users.findFirst({ where: eq(users.id, menteeId), columns: { email: true } }),
      this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, menteeId), columns: { displayName: true } }),
      this.db.query.users.findFirst({ where: eq(users.id, mentorId), columns: { email: true } }),
      this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, mentorId), columns: { displayName: true } }),
    ]);
    if (!menteeUser?.email) return;
    const menteeName = menteeProfile?.displayName ?? menteeUser.email;
    const mentorName = mentorProfile?.displayName ?? (mentorUser?.email ?? 'Mentor');
    if (action === 'reject') {
      await this.emailService.sendMentorshipRequestRejected(menteeUser.email, menteeName, mentorName, mentorNote);
    } else {
      await this.emailService.sendMentorshipRequestAccepted(
        menteeUser.email, menteeName, mentorName,
        'Mentörünüz kısa sürede oturum tarihini belirleyecek.', mentorNote, '',
      );
    }
  }

  private async sendSessionScheduledEmail(
    engagement: typeof mentorshipRequests.$inferSelect,
    sessionNumber: number,
    scheduledAt: Date,
    mentorId: string,
  ): Promise<void> {
    const [menteeUser, menteeProfile, mentorProfile, mentorProfileRow] = await Promise.all([
      this.db.query.users.findFirst({ where: eq(users.id, engagement.menteeId), columns: { email: true } }),
      this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, engagement.menteeId), columns: { displayName: true } }),
      this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, mentorId), columns: { displayName: true } }),
      this.db.query.mentorProfiles.findFirst({ where: eq(mentorProfiles.userId, mentorId) }),
    ]);
    if (!menteeUser?.email) return;
    const menteeName = menteeProfile?.displayName ?? menteeUser.email;
    const mentorName = mentorProfile?.displayName ?? 'Mentörünüz';
    const duration = mentorProfileRow?.sessionDurationMin ?? 45;
    const icsBase64 = Buffer.from(buildIcs(`${engagement.id}-${sessionNumber}`, scheduledAt, duration, mentorName, menteeName, engagement.topic)).toString('base64');
    await this.emailService.sendMentorshipRequestAccepted(
      menteeUser.email, menteeName, mentorName, formatTR(scheduledAt), '', icsBase64,
    );
  }
}
