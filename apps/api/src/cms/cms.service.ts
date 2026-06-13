import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { eq, asc, desc, and, sql, or, ilike, count, isNotNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as QRCode from 'qrcode';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { pages, boardMembers, events, eventAttendances, eventPublicRegistrations, eventSponsors, eventSpeakers, eventSessions, eventSessionFavorites, eventRegistrationQuestions, eventRegistrationAnswers, eventWaitlist, projects, siteSettings, userProfiles, trainings, courseSections, courseLessons, courseEnrollments, lessonProgress, courseReviews, courseCertificates, courseQuizzes, quizQuestions, quizAttempts, userCourseBadges, lessonQuestions, courseAnnouncements, coursePayments, examResources, users, talents, posts, comments, projectLikes, projectFavorites, projectComments } from '@haritailesi/database';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import type {
  UpsertPageDto,
  CreateBoardMemberDto,
  UpdateBoardMemberDto,
  CreateEventDto,
  UpdateEventDto,
  CreateProjectDto,
  UpdateProjectDto,
  CreateTalentDto,
  AdminUpdateTalentDto,
} from './dto/cms.dto';

const WEB_URL = process.env['WEB_URL'] ?? 'https://haritailesi.org';
const SAHNE_URL = process.env['SAHNE_URL'] ?? 'https://sahne.haritailesi.org';

const EVENT_TYPE_LABELS: Record<string, string> = {
  kongre: 'Kongre', networking: 'Networking', odul: 'Ödül Töreni',
  webinar: 'Webinar', calistay: 'Çalıştay', sempozyum: 'Sempozyum', diger: 'Etkinlik',
};

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly whatsappService: WhatsappService,
  ) {}

  // ─── Pages ───────────────────────────────────────────────────────────────────

  async listPages() {
    return this.db.select().from(pages).orderBy(asc(pages.slug));
  }

  async getPage(slug: string, publishedOnly = true) {
    const [page] = await this.db
      .select()
      .from(pages)
      .where(
        publishedOnly
          ? and(eq(pages.slug, slug), eq(pages.isPublished, true))
          : eq(pages.slug, slug),
      )
      .limit(1);
    if (!page) throw new NotFoundException(`Sayfa bulunamadı: ${slug}`);
    return page;
  }

  async upsertPage(slug: string, dto: UpsertPageDto, updatedById: string) {
    const [existing] = await this.db.select({ id: pages.id }).from(pages).where(eq(pages.slug, slug)).limit(1);
    const now = new Date();

    if (existing) {
      const [updated] = await this.db
        .update(pages)
        .set({
          title: dto.title,
          ...(dto.body !== undefined ? { body: dto.body } : {}),
          ...(dto.metaDescription !== undefined ? { metaDescription: dto.metaDescription } : {}),
          isPublished: dto.isPublished,
          updatedBy: updatedById,
          updatedAt: now,
        })
        .where(eq(pages.slug, slug))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(pages)
      .values({
        slug,
        title: dto.title,
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.metaDescription !== undefined ? { metaDescription: dto.metaDescription } : {}),
        isPublished: dto.isPublished,
        updatedBy: updatedById,
      })
      .returning();
    return created;
  }

  async deletePage(slug: string) {
    const [deleted] = await this.db.delete(pages).where(eq(pages.slug, slug)).returning({ id: pages.id });
    if (!deleted) throw new NotFoundException(`Sayfa bulunamadı: ${slug}`);
    return { deleted: true };
  }

  // ─── Board Members ────────────────────────────────────────────────────────────

  async listBoardMembers(activeOnly = true) {
    return this.db
      .select()
      .from(boardMembers)
      .where(activeOnly ? eq(boardMembers.isActive, true) : undefined)
      .orderBy(asc(boardMembers.sortOrder), asc(boardMembers.name));
  }

  async getBoardMember(id: string) {
    const [member] = await this.db.select().from(boardMembers).where(eq(boardMembers.id, id)).limit(1);
    if (!member) throw new NotFoundException('Üye bulunamadı');
    return member;
  }

  async createBoardMember(dto: CreateBoardMemberDto) {
    const [created] = await this.db
      .insert(boardMembers)
      .values({
        name: dto.name,
        title: dto.title,
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.photoKey !== undefined ? { photoKey: dto.photoKey } : {}),
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      })
      .returning();
    return created;
  }

  async updateBoardMember(id: string, dto: UpdateBoardMemberDto) {
    const [updated] = await this.db
      .update(boardMembers)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.photoKey !== undefined ? { photoKey: dto.photoKey } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(boardMembers.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Üye bulunamadı');
    return updated;
  }

  async deleteBoardMember(id: string) {
    const [deleted] = await this.db.delete(boardMembers).where(eq(boardMembers.id, id)).returning({ id: boardMembers.id });
    if (!deleted) throw new NotFoundException('Üye bulunamadı');
    return { deleted: true };
  }

  // ─── Events ───────────────────────────────────────────────────────────────────

  async listEvents(opts: { type?: string; publishedOnly?: boolean } = {}) {
    const conditions = [];
    if (opts.publishedOnly) conditions.push(eq(events.isPublished, true));
    if (opts.type) conditions.push(eq(events.type, opts.type as 'kongre' | 'networking' | 'odul' | 'diger'));

    const rows = await this.db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        type: events.type,
        dateStart: events.dateStart,
        dateEnd: events.dateEnd,
        location: events.location,
        description: events.description,
        registrationUrl: events.registrationUrl,
        meetingUrl: events.meetingUrl,
        coverImageKey: events.coverImageKey,
        maxCapacity: events.maxCapacity,
        isCancelled: events.isCancelled,
        isPublished: events.isPublished,
        viewCount: events.viewCount,
        createdAt: events.createdAt,
        attendeeCount: sql<number>`(SELECT COUNT(*) FROM event_attendances WHERE event_id = ${events.id})`.as('attendee_count'),
        publicCount: sql<number>`(SELECT COUNT(*) FROM event_public_registrations WHERE event_id = ${events.id})`.as('public_count'),
      })
      .from(events)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(events.dateStart));

    return rows;
  }

  async getEvent(slug: string, publishedOnly = true) {
    const [event] = await this.db
      .select()
      .from(events)
      .where(
        publishedOnly
          ? and(eq(events.slug, slug), eq(events.isPublished, true))
          : eq(events.slug, slug),
      )
      .limit(1);
    if (!event) throw new NotFoundException(`Etkinlik bulunamadı: ${slug}`);
    if (publishedOnly) {
      void this.db
        .update(events)
        .set({ viewCount: sql`${events.viewCount} + 1` })
        .where(eq(events.slug, slug))
        .catch(() => {});
    }
    return event;
  }

  async getEventById(id: string) {
    const [event] = await this.db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!event) throw new NotFoundException('Etkinlik bulunamadı');
    return event;
  }

  async createEvent(dto: CreateEventDto, createdById: string) {
    const [created] = await this.db
      .insert(events)
      .values({
        slug: dto.slug,
        title: dto.title,
        type: dto.type,
        dateStart: new Date(dto.dateStart),
        ...(dto.dateEnd ? { dateEnd: new Date(dto.dateEnd) } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.registrationUrl !== undefined ? { registrationUrl: dto.registrationUrl } : {}),
        ...(dto.meetingUrl !== undefined ? { meetingUrl: dto.meetingUrl } : {}),
        ...(dto.coverImageKey !== undefined ? { coverImageKey: dto.coverImageKey } : {}),
        ...(dto.maxCapacity !== undefined ? { maxCapacity: dto.maxCapacity } : {}),
        ...(dto.isCancelled !== undefined ? { isCancelled: dto.isCancelled } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.paymentUrl !== undefined ? { paymentUrl: dto.paymentUrl } : {}),
        isPublished: dto.isPublished,
        createdBy: createdById,
      })
      .returning();
    return created;
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    const [updated] = await this.db
      .update(events)
      .set({
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.dateStart !== undefined ? { dateStart: new Date(dto.dateStart) } : {}),
        ...(dto.dateEnd !== undefined ? { dateEnd: new Date(dto.dateEnd) } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.registrationUrl !== undefined ? { registrationUrl: dto.registrationUrl } : {}),
        ...(dto.meetingUrl !== undefined ? { meetingUrl: dto.meetingUrl } : {}),
        ...(dto.coverImageKey !== undefined ? { coverImageKey: dto.coverImageKey } : {}),
        ...(dto.maxCapacity !== undefined ? { maxCapacity: dto.maxCapacity } : {}),
        ...(dto.isCancelled !== undefined ? { isCancelled: dto.isCancelled } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.paymentUrl !== undefined ? { paymentUrl: dto.paymentUrl } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Etkinlik bulunamadı');
    return updated;
  }

  async copyEvent(id: string, createdById: string) {
    const source = await this.getEventById(id);
    const newSlug = `${source.slug}-kopya-${Date.now()}`;
    const [created] = await this.db
      .insert(events)
      .values({
        slug: newSlug,
        title: `${source.title} — Kopya`,
        type: source.type,
        dateStart: source.dateStart,
        dateEnd: source.dateEnd ?? undefined,
        location: source.location ?? undefined,
        description: source.description ?? undefined,
        body: source.body ?? undefined,
        registrationUrl: source.registrationUrl ?? undefined,
        meetingUrl: source.meetingUrl ?? undefined,
        coverImageKey: source.coverImageKey ?? undefined,
        maxCapacity: source.maxCapacity ?? undefined,
        price: source.price,
        paymentUrl: source.paymentUrl ?? undefined,
        isPublished: false,
        createdBy: createdById,
      })
      .returning();
    return created!;
  }

  async deleteEvent(id: string) {
    const [deleted] = await this.db.delete(events).where(eq(events.id, id)).returning({ id: events.id });
    if (!deleted) throw new NotFoundException('Etkinlik bulunamadı');
    return { deleted: true };
  }

  // ─── Event RSVP ───────────────────────────────────────────────────────────────

  async rsvp(userId: string, eventId: string) {
    const event = await this.getEventById(eventId);
    if (event.isCancelled) throw new BadRequestException('Bu etkinlik iptal edilmiştir.');
    if (event.maxCapacity != null) {
      const [memberCountRow] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(eventAttendances)
        .where(eq(eventAttendances.eventId, eventId));
      const [pubCountRow] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(eventPublicRegistrations)
        .where(eq(eventPublicRegistrations.eventId, eventId));
      const total = Number(memberCountRow?.count ?? 0) + Number(pubCountRow?.count ?? 0);
      if (total >= event.maxCapacity) {
        // Bekleme listesine ekle
        await this.db
          .insert(eventWaitlist)
          .values({ eventId, userId })
          .onConflictDoNothing();
        const [posRow] = await this.db
          .select({ pos: sql<number>`COUNT(*)` })
          .from(eventWaitlist)
          .where(and(
            eq(eventWaitlist.eventId, eventId),
            sql`created_at <= (SELECT created_at FROM event_waitlist WHERE event_id = ${eventId} AND user_id = ${userId} LIMIT 1)`,
          ));
        return { rsvp: false, waitlisted: true, waitlistPosition: Number(posRow?.pos ?? 1) };
      }
    }

    const ticketCode = randomUUID();

    const [attendance] = await this.db
      .insert(eventAttendances)
      .values({ eventId, userId, ticketCode })
      .onConflictDoUpdate({
        target: [eventAttendances.eventId, eventAttendances.userId],
        set: { joinCount: sql`${eventAttendances.joinCount} + 1` },
      })
      .returning();

    // Bilet gönderimini arka planda yap (await'siz — kullanıcıyı bekletme)
    if (attendance?.ticketCode) {
      void this.sendEventTicket(userId, event, attendance.id, attendance.ticketCode);
    }

    return { rsvp: true, waitlisted: false, attendanceId: attendance?.id };
  }

  private async sendEventTicket(
    userId: string,
    event: { id: string; slug: string; title: string; type: string; dateStart: Date | string; location: string | null; registrationUrl: string | null; meetingUrl: string | null },
    attendanceId: string,
    ticketCode: string,
  ) {
    try {
      const profile = await this.db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, userId),
        columns: { displayName: true, phone: true, whatsappConsent: true, smsConsent: true },
      });
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { email: true },
      });
      if (!profile || !user?.email) return;

      const eventDate = new Date(event.dateStart).toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      const verifyUrl = `${SAHNE_URL}/etkinlikler/bilet/${ticketCode}`;
      const typeLabel = EVENT_TYPE_LABELS[event.type] ?? event.type;

      // QR kod üret (base64 data URL)
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 280, margin: 2,
        color: { dark: '#1e3a56', light: '#ffffff' },
      });

      // ── E-posta ──────────────────────────────────────────────────────────────
      await this.emailService.send(
        user.email,
        'event_ticket',
        {
          displayName: profile.displayName,
          eventTitle: event.title,
          eventDate,
          eventType: typeLabel,
          ticketCode: ticketCode.split('-')[0]!.toUpperCase(),
          qrDataUrl,
          verifyUrl,
          ...(event.location ? { eventLocation: event.location } : {}),
          ...(event.meetingUrl ? { meetingUrl: event.meetingUrl } : {}),
        },
        { jobId: `event_ticket:${attendanceId}` },
      );

      this.logger.log(`event_ticket_email_sent userId=${userId} eventId=${event.id}`);

      // ── WhatsApp ─────────────────────────────────────────────────────────────
      if (profile.whatsappConsent && profile.phone) {
        const msg = [
          `✅ *${event.title}*`,
          `Katılımınız onaylandı!`,
          ``,
          `📅 ${eventDate}`,
          event.location ? `📍 ${event.location}` : `🖥 Online`,
          ``,
          `🎫 Bilet kodunuz: *${ticketCode.split('-')[0]!.toUpperCase()}*`,
          ``,
          `E-biletiniz e-posta adresinize gönderildi. Kapıda QR kodunu gösterin.`,
          `${verifyUrl}`,
        ].join('\n');

        await this.whatsappService.sendText(profile.phone, msg);
        this.logger.log(`event_ticket_whatsapp_sent userId=${userId}`);
      }

      // ── SMS ──────────────────────────────────────────────────────────────────
      if (profile.smsConsent && profile.phone) {
        const sms = `Haritailesi: "${event.title}" etkinligine kaydiniz alindi. Bilet kodunuz: ${ticketCode.split('-')[0]!.toUpperCase()}. E-biletiniz mailinize gönderildi.`;
        await this.smsService.send(profile.phone, sms);
        this.logger.log(`event_ticket_sms_sent userId=${userId}`);
      }
    } catch (err) {
      this.logger.error(`event_ticket_error userId=${userId} err=${(err as Error).message}`);
    }
  }

  // ─── Public Registration (üyeliksiz) ──────────────────────────────────────────

  async publicRegister(eventId: string, dto: {
    email: string;
    displayName: string;
    phone?: string;
    whatsappConsent?: boolean;
    answers?: Record<string, string>;
    ticketTier?: string;
  }) {
    const event = await this.getEventById(eventId);
    if (!event.isPublished) throw new BadRequestException('Etkinlik yayınlanmamış.');
    if (event.isCancelled) throw new BadRequestException('Bu etkinlik iptal edilmiştir.');
    if (new Date(event.dateStart) < new Date()) throw new BadRequestException('Bu etkinlik geçmiş bir etkinliktir.');

    if (event.maxCapacity != null) {
      const [memberCount] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(eventAttendances)
        .where(eq(eventAttendances.eventId, eventId));
      const [pubCount] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(eventPublicRegistrations)
        .where(eq(eventPublicRegistrations.eventId, eventId));
      const total = Number(memberCount?.count ?? 0) + Number(pubCount?.count ?? 0);
      if (total >= event.maxCapacity) throw new BadRequestException('Etkinlik kapasitesi dolmuştur.');
    }

    // Aynı e-posta ile daha önce kayıt olduysa ticketCode döndür
    const existing = await this.db.query.eventPublicRegistrations.findFirst({
      where: and(
        eq(eventPublicRegistrations.eventId, eventId),
        eq(eventPublicRegistrations.email, dto.email),
      ),
    });
    if (existing) return { ticketCode: existing.ticketCode, alreadyRegistered: true };

    const ticketCode = randomUUID();

    await this.db.insert(eventPublicRegistrations).values({
      eventId, email: dto.email, displayName: dto.displayName,
      phone: dto.phone ?? null,
      whatsappConsent: dto.whatsappConsent ?? false,
      ticketCode,
      ticketTier: dto.ticketTier ?? 'standard',
      answers: dto.answers ?? null,
    });

    // Bilet gönder (arka planda)
    void this.sendPublicTicket(dto, event, ticketCode);

    return { ticketCode, alreadyRegistered: false };
  }

  private async sendPublicTicket(
    reg: { email: string; displayName: string; phone?: string; whatsappConsent?: boolean },
    event: { id: string; slug: string; title: string; type: string; dateStart: Date | string; location: string | null; registrationUrl: string | null; meetingUrl: string | null },
    ticketCode: string,
  ) {
    try {
      const eventDate = new Date(event.dateStart).toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      const verifyUrl = `${SAHNE_URL}/etkinlikler/bilet/${ticketCode}`;
      const typeLabel = EVENT_TYPE_LABELS[event.type] ?? event.type;

      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 280, margin: 2,
        color: { dark: '#1e3a56', light: '#ffffff' },
      });

      await this.emailService.send(
        reg.email,
        'event_ticket',
        {
          displayName: reg.displayName,
          eventTitle: event.title,
          eventDate,
          eventType: typeLabel,
          ticketCode: ticketCode.split('-')[0]!.toUpperCase(),
          qrDataUrl,
          verifyUrl,
          ...(event.location ? { eventLocation: event.location } : {}),
          ...(event.meetingUrl ? { meetingUrl: event.meetingUrl } : {}),
        },
        { jobId: `pub_ticket:${ticketCode}` },
      );

      if (reg.whatsappConsent && reg.phone) {
        const msg = [
          `✅ *${event.title}*`,
          `Kaydınız alındı!`,
          ``,
          `📅 ${eventDate}`,
          event.location ? `📍 ${event.location}` : `🖥 Online`,
          ``,
          `🎫 Bilet kodunuz: *${ticketCode.split('-')[0]!.toUpperCase()}*`,
          ``,
          `E-biletiniz e-posta adresinize gönderildi.`,
          `${verifyUrl}`,
        ].join('\n');
        await this.whatsappService.sendText(reg.phone, msg);
      }

      this.logger.log(`pub_ticket_sent email=${reg.email} event=${event.id}`);
    } catch (err) {
      this.logger.error(`pub_ticket_error email=${reg.email} err=${(err as Error).message}`);
    }
  }

  async getTicketByCode(ticketCode: string) {
    // Önce üye kaydına bak
    const [memberRow] = await this.db
      .select({
        ticketCode: eventAttendances.ticketCode,
        attendanceId: eventAttendances.id,
        joinedAt: eventAttendances.firstJoinedAt,
        eventId: events.id,
        eventSlug: events.slug,
        eventTitle: events.title,
        eventType: events.type,
        dateStart: events.dateStart,
        dateEnd: events.dateEnd,
        location: events.location,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(eventAttendances)
      .innerJoin(events, eq(events.id, eventAttendances.eventId))
      .innerJoin(userProfiles, eq(userProfiles.userId, eventAttendances.userId))
      .where(eq(eventAttendances.ticketCode, ticketCode));

    if (memberRow) return { ...memberRow, registrationType: 'member' as const };

    // Sonra anonim kayda bak
    const [pubRow] = await this.db
      .select({
        ticketCode: eventPublicRegistrations.ticketCode,
        attendanceId: eventPublicRegistrations.id,
        joinedAt: eventPublicRegistrations.createdAt,
        eventId: events.id,
        eventSlug: events.slug,
        eventTitle: events.title,
        eventType: events.type,
        dateStart: events.dateStart,
        dateEnd: events.dateEnd,
        location: events.location,
        displayName: eventPublicRegistrations.displayName,
        avatarUrl: sql<string | null>`NULL::text`,
      })
      .from(eventPublicRegistrations)
      .innerJoin(events, eq(events.id, eventPublicRegistrations.eventId))
      .where(eq(eventPublicRegistrations.ticketCode, ticketCode));

    if (pubRow) return { ...pubRow, registrationType: 'public' as const };

    throw new NotFoundException('Bilet bulunamadı.');
  }

  async cancelRsvp(userId: string, eventId: string) {
    const [deleted] = await this.db
      .delete(eventAttendances)
      .where(and(eq(eventAttendances.eventId, eventId), eq(eventAttendances.userId, userId)))
      .returning();

    if (deleted) {
      // İptal bildirimi arka planda
      void this.sendCancellationEmail(userId, eventId);
      // Waitlist'i tetikle: yer açıldıysa ilk kişiye bildir
      void this.notifyFirstWaitlisted(eventId);
    }

    return { rsvp: false };
  }

  private async sendCancellationEmail(userId: string, eventId: string) {
    try {
      const event = await this.getEventById(eventId);
      const user = await this.db.query.users.findFirst({ where: eq(users.id, userId), columns: { email: true } });
      const profile = await this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId), columns: { displayName: true } });
      if (!user?.email || !profile) return;
      await this.emailService.send(
        user.email,
        'event_cancellation',
        {
          displayName: profile.displayName,
          eventTitle: event.title,
          eventDate: new Date(event.dateStart).toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric',
          }),
        },
        { jobId: `event_cancel:${userId}:${eventId}` },
      );
    } catch (err) {
      this.logger.error(`cancellation_email_error userId=${userId} err=${(err as Error).message}`);
    }
  }

  private async notifyFirstWaitlisted(eventId: string) {
    try {
      const event = await this.getEventById(eventId);
      if (!event.maxCapacity) return;

      // Kapasite açıldı mı kontrol et
      const [memberCountRow] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(eventAttendances)
        .where(eq(eventAttendances.eventId, eventId));
      const [pubCountRow] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(eventPublicRegistrations)
        .where(eq(eventPublicRegistrations.eventId, eventId));
      const total = Number(memberCountRow?.count ?? 0) + Number(pubCountRow?.count ?? 0);
      if (total >= event.maxCapacity) return;

      // İlk bildirimsiz waitlist kaydını bul (user ile)
      const [first] = await this.db
        .select()
        .from(eventWaitlist)
        .where(and(eq(eventWaitlist.eventId, eventId), sql`notified_at IS NULL`, sql`user_id IS NOT NULL`))
        .orderBy(asc(eventWaitlist.createdAt))
        .limit(1);

      if (!first || !first.userId) return;

      const user = await this.db.query.users.findFirst({ where: eq(users.id, first.userId), columns: { email: true } });
      const profile = await this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, first.userId), columns: { displayName: true } });
      if (!user?.email || !profile) return;

      const eventDate = new Date(event.dateStart).toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      await this.emailService.send(
        user.email,
        'event_waitlist_available',
        { displayName: profile.displayName, eventTitle: event.title, eventDate },
        { jobId: `event_waitlist_notify:${first.id}` },
      );

      await this.db
        .update(eventWaitlist)
        .set({ notifiedAt: new Date() })
        .where(eq(eventWaitlist.id, first.id));

      this.logger.log(`waitlist_notified userId=${first.userId} eventId=${eventId}`);
    } catch (err) {
      this.logger.error(`waitlist_notify_error eventId=${eventId} err=${(err as Error).message}`);
    }
  }

  async getMyRsvps(userId: string) {
    const rows = await this.db
      .select({ eventId: eventAttendances.eventId })
      .from(eventAttendances)
      .where(eq(eventAttendances.userId, userId));
    return rows.map((r) => r.eventId);
  }

  async listEventAttendees(eventId: string) {
    const memberRows = await this.db
      .select({
        id: eventAttendances.id,
        userId: eventAttendances.userId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
        joinedAt: eventAttendances.firstJoinedAt,
        ticketCode: eventAttendances.ticketCode,
        ticketTier: eventAttendances.ticketTier,
        checkedIn: eventAttendances.checkedIn,
        checkedInAt: eventAttendances.checkedInAt,
        registrationType: sql<string>`'member'`,
      })
      .from(eventAttendances)
      .innerJoin(userProfiles, eq(userProfiles.userId, eventAttendances.userId))
      .where(eq(eventAttendances.eventId, eventId))
      .orderBy(asc(eventAttendances.firstJoinedAt));

    const pubRows = await this.db
      .select({
        id: eventPublicRegistrations.id,
        userId: sql<string | null>`NULL::uuid`,
        displayName: eventPublicRegistrations.displayName,
        avatarUrl: sql<string | null>`NULL::text`,
        profession: sql<string | null>`NULL::text`,
        joinedAt: eventPublicRegistrations.createdAt,
        ticketCode: eventPublicRegistrations.ticketCode,
        ticketTier: eventPublicRegistrations.ticketTier,
        checkedIn: eventPublicRegistrations.checkedIn,
        checkedInAt: eventPublicRegistrations.checkedInAt,
        registrationType: sql<string>`'public'`,
      })
      .from(eventPublicRegistrations)
      .where(eq(eventPublicRegistrations.eventId, eventId))
      .orderBy(asc(eventPublicRegistrations.createdAt));

    const attendees = [...memberRows, ...pubRows].sort(
      (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
    );
    return { count: attendees.length, attendees };
  }

  async checkinAttendance(attendanceId: string, registrationType: 'member' | 'public') {
    if (registrationType === 'member') {
      const [row] = await this.db
        .select({ checkedIn: eventAttendances.checkedIn })
        .from(eventAttendances)
        .where(eq(eventAttendances.id, attendanceId))
        .limit(1);
      if (!row) throw new NotFoundException('Katılım kaydı bulunamadı');
      const newState = !row.checkedIn;
      const [updated] = await this.db
        .update(eventAttendances)
        .set({ checkedIn: newState, checkedInAt: newState ? new Date() : null })
        .where(eq(eventAttendances.id, attendanceId))
        .returning({ checkedIn: eventAttendances.checkedIn, checkedInAt: eventAttendances.checkedInAt });
      return updated!;
    } else {
      const [row] = await this.db
        .select({ checkedIn: eventPublicRegistrations.checkedIn })
        .from(eventPublicRegistrations)
        .where(eq(eventPublicRegistrations.id, attendanceId))
        .limit(1);
      if (!row) throw new NotFoundException('Katılım kaydı bulunamadı');
      const newState = !row.checkedIn;
      const [updated] = await this.db
        .update(eventPublicRegistrations)
        .set({ checkedIn: newState, checkedInAt: newState ? new Date() : null })
        .where(eq(eventPublicRegistrations.id, attendanceId))
        .returning({ checkedIn: eventPublicRegistrations.checkedIn, checkedInAt: eventPublicRegistrations.checkedInAt });
      return updated!;
    }
  }

  async checkinByTicketCode(ticketCode: string) {
    // Önce üye kaydına bak
    const [memberRow] = await this.db
      .select({ id: eventAttendances.id, checkedIn: eventAttendances.checkedIn, displayName: userProfiles.displayName })
      .from(eventAttendances)
      .innerJoin(userProfiles, eq(userProfiles.userId, eventAttendances.userId))
      .where(eq(eventAttendances.ticketCode, ticketCode))
      .limit(1);

    if (memberRow) {
      const [updated] = await this.db
        .update(eventAttendances)
        .set({ checkedIn: true, checkedInAt: new Date() })
        .where(eq(eventAttendances.id, memberRow.id))
        .returning({ checkedIn: eventAttendances.checkedIn });
      return { success: true, displayName: memberRow.displayName, alreadyCheckedIn: memberRow.checkedIn, registrationType: 'member' as const, ...updated };
    }

    // Anonim kayıt
    const [pubRow] = await this.db
      .select({ id: eventPublicRegistrations.id, checkedIn: eventPublicRegistrations.checkedIn, displayName: eventPublicRegistrations.displayName })
      .from(eventPublicRegistrations)
      .where(eq(eventPublicRegistrations.ticketCode, ticketCode))
      .limit(1);

    if (pubRow) {
      const [updated] = await this.db
        .update(eventPublicRegistrations)
        .set({ checkedIn: true, checkedInAt: new Date() })
        .where(eq(eventPublicRegistrations.id, pubRow.id))
        .returning({ checkedIn: eventPublicRegistrations.checkedIn });
      return { success: true, displayName: pubRow.displayName, alreadyCheckedIn: pubRow.checkedIn, registrationType: 'public' as const, ...updated };
    }

    throw new NotFoundException('Bilet kodu bulunamadı.');
  }

  // ─── Event Analytics ──────────────────────────────────────────────────────────

  async getEventStats(eventId: string) {
    const event = await this.getEventById(eventId);

    const [memberCountRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(eventAttendances)
      .where(eq(eventAttendances.eventId, eventId));

    const [publicCountRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(eventPublicRegistrations)
      .where(eq(eventPublicRegistrations.eventId, eventId));

    const memberCount = Number(memberCountRow?.count ?? 0);
    const publicCount = Number(publicCountRow?.count ?? 0);
    const totalRegistrations = memberCount + publicCount;
    const fillRate = event.maxCapacity ? Math.round((totalRegistrations / event.maxCapacity) * 100) : null;

    // Son 7 günlük kayıt trendi
    const trend = await this.db
      .select({
        day: sql<string>`DATE(first_joined_at AT TIME ZONE 'Europe/Istanbul')`,
        count: sql<number>`COUNT(*)`,
      })
      .from(eventAttendances)
      .where(and(
        eq(eventAttendances.eventId, eventId),
        sql`first_joined_at > NOW() - INTERVAL '30 days'`,
      ))
      .groupBy(sql`DATE(first_joined_at AT TIME ZONE 'Europe/Istanbul')`)
      .orderBy(sql`DATE(first_joined_at AT TIME ZONE 'Europe/Istanbul')`);

    const [checkedInCountRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(eventAttendances)
      .where(and(eq(eventAttendances.eventId, eventId), eq(eventAttendances.checkedIn, true)));
    const [pubCheckedInCountRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(eventPublicRegistrations)
      .where(and(eq(eventPublicRegistrations.eventId, eventId), eq(eventPublicRegistrations.checkedIn, true)));
    const checkedInCount = Number(checkedInCountRow?.count ?? 0) + Number(pubCheckedInCountRow?.count ?? 0);

    const [waitlistCountRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(eventWaitlist)
      .where(eq(eventWaitlist.eventId, eventId));
    const waitlistCount = Number(waitlistCountRow?.count ?? 0);

    return {
      viewCount: event.viewCount,
      memberRegistrations: memberCount,
      publicRegistrations: publicCount,
      totalRegistrations,
      checkedInCount,
      waitlistCount,
      maxCapacity: event.maxCapacity,
      fillRate,
      registrationTrend: trend,
    };
  }

  // ─── Discussion (Mutfak bağlantısı) ──────────────────────────────────────────

  async getDiscussion(postId: string) {
    const [post] = await this.db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        createdAt: posts.createdAt,
        authorName: userProfiles.displayName,
        authorAvatar: userProfiles.avatarUrl,
      })
      .from(posts)
      .leftJoin(userProfiles, eq(userProfiles.userId, posts.authorId))
      .where(and(eq(posts.id, postId), ne(posts.status, 'deleted')))
      .limit(1);

    if (!post) return null;

    const commentRows = await this.db
      .select({
        id: comments.id,
        body: comments.body,
        createdAt: comments.createdAt,
        authorName: userProfiles.displayName,
        authorAvatar: userProfiles.avatarUrl,
        isDeleted: comments.isDeleted,
      })
      .from(comments)
      .leftJoin(userProfiles, eq(userProfiles.userId, comments.authorId))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt))
      .limit(50);

    return { post, commentCount: commentRows.filter(c => !c.isDeleted).length, comments: commentRows.filter(c => !c.isDeleted) };
  }

  // ─── Waitlist ─────────────────────────────────────────────────────────────────

  async listWaitlist(eventId: string) {
    const rows = await this.db
      .select({
        id: eventWaitlist.id,
        userId: eventWaitlist.userId,
        email: eventWaitlist.email,
        displayName: eventWaitlist.displayName,
        notifiedAt: eventWaitlist.notifiedAt,
        createdAt: eventWaitlist.createdAt,
      })
      .from(eventWaitlist)
      .where(eq(eventWaitlist.eventId, eventId))
      .orderBy(asc(eventWaitlist.createdAt));
    return { count: rows.length, waitlist: rows };
  }

  async getWaitlistPosition(userId: string, eventId: string) {
    const [row] = await this.db
      .select({ createdAt: eventWaitlist.createdAt })
      .from(eventWaitlist)
      .where(and(eq(eventWaitlist.eventId, eventId), eq(eventWaitlist.userId, userId)))
      .limit(1);
    if (!row) return { inWaitlist: false, position: null };

    const [posRow] = await this.db
      .select({ pos: sql<number>`COUNT(*)` })
      .from(eventWaitlist)
      .where(and(
        eq(eventWaitlist.eventId, eventId),
        sql`created_at <= ${row.createdAt}`,
      ));
    return { inWaitlist: true, position: Number(posRow?.pos ?? 1) };
  }

  async leaveWaitlist(userId: string, eventId: string) {
    await this.db
      .delete(eventWaitlist)
      .where(and(eq(eventWaitlist.eventId, eventId), eq(eventWaitlist.userId, userId)));
    return { removed: true };
  }

  // ─── Discussion Room (Mutfak) ─────────────────────────────────────────────────

  async createDiscussionRoom(eventId: string, adminUserId: string) {
    this.logger.log(`createDiscussionRoom start eventId=${eventId} adminUserId=${adminUserId}`);
    try {
      const event = await this.getEventById(eventId);

      if (event.mutfakPostId) {
        return { postId: event.mutfakPostId, alreadyExists: true };
      }

      // Admin kullanıcısı users tablosunda var mı kontrol et
      const [adminUser] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, adminUserId))
        .limit(1);

      if (!adminUser) {
        throw new BadRequestException(`Admin kullanıcı users tablosunda bulunamadı (id=${adminUserId}). Lütfen tekrar giriş yapın.`);
      }

      const [post] = await this.db
        .insert(posts)
        .values({
          authorId: adminUserId,
          type: 'announcement',
          category: 'haritailesi_duyurulari',
          title: `${event.title} — Tartışma Odası`,
          body: `Bu tartışma odası **${event.title}** etkinliğine bağlıdır.\n\nEtkinlikle ilgili sorularınızı, fikirlerinizi ve deneyimlerinizi buradan paylaşabilirsiniz.`,
          status: 'published',
          isPinned: false,
          isPublic: false,
        })
        .returning({ id: posts.id });

      const postId = post!.id;
      this.logger.log(`createDiscussionRoom post created postId=${postId}`);

      await this.db
        .update(events)
        .set({ mutfakPostId: postId })
        .where(eq(events.id, eventId));

      return { postId, alreadyExists: false };
    } catch (err) {
      this.logger.error(`createDiscussionRoom error: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
  }

  // ─── Event Sponsors ───────────────────────────────────────────────────────────

  private readonly TIER_ORDER: Record<string, number> = { platin: 1, altin: 2, gumus: 3, bronz: 4 };

  async listEventSponsors(eventId: string, activeOnly = true) {
    const rows = await this.db
      .select()
      .from(eventSponsors)
      .where(
        activeOnly
          ? and(eq(eventSponsors.eventId, eventId), eq(eventSponsors.isActive, true))
          : eq(eventSponsors.eventId, eventId),
      )
      .orderBy(asc(eventSponsors.sortOrder), asc(eventSponsors.companyName));

    // Tier sıralaması: altın > gümüş > bronz > paydaş
    return rows.sort(
      (a, b) => (this.TIER_ORDER[a.tier] ?? 99) - (this.TIER_ORDER[b.tier] ?? 99),
    );
  }

  async createSponsor(eventId: string, dto: {
    companyName: string; logoKey?: string; websiteUrl?: string;
    tier?: string; description?: string; sortOrder?: number;
  }) {
    const [row] = await this.db.insert(eventSponsors).values({
      eventId,
      companyName: dto.companyName,
      logoKey: dto.logoKey ?? null,
      websiteUrl: dto.websiteUrl ?? null,
      tier: dto.tier ?? 'bronz',
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
    }).returning();
    return row!;
  }

  async updateSponsor(id: string, dto: Partial<{
    companyName: string; logoKey: string | null; websiteUrl: string | null;
    tier: string; description: string | null; sortOrder: number; isActive: boolean;
  }>) {
    const [row] = await this.db.update(eventSponsors).set(dto).where(eq(eventSponsors.id, id)).returning();
    if (!row) throw new NotFoundException('Sponsor bulunamadı.');
    return row;
  }

  async deleteSponsor(id: string) {
    await this.db.delete(eventSponsors).where(eq(eventSponsors.id, id));
  }

  // ─── Event Speakers ───────────────────────────────────────────────────────────

  async listEventSpeakers(eventId: string) {
    return this.db
      .select()
      .from(eventSpeakers)
      .where(eq(eventSpeakers.eventId, eventId))
      .orderBy(asc(eventSpeakers.sortOrder), asc(eventSpeakers.createdAt));
  }

  async createSpeaker(eventId: string, dto: {
    name: string; title?: string; affiliation?: string;
    bio?: string; avatarUrl?: string; linkedinUrl?: string; sortOrder?: number;
  }) {
    const [row] = await this.db.insert(eventSpeakers).values({
      eventId, name: dto.name,
      title: dto.title ?? null, affiliation: dto.affiliation ?? null,
      bio: dto.bio ?? null, avatarUrl: dto.avatarUrl ?? null,
      linkedinUrl: dto.linkedinUrl ?? null, sortOrder: dto.sortOrder ?? 0,
    }).returning();
    return row!;
  }

  async updateSpeaker(id: string, dto: Partial<{
    name: string; title: string | null; affiliation: string | null;
    bio: string | null; avatarUrl: string | null; linkedinUrl: string | null; sortOrder: number;
  }>) {
    const [row] = await this.db.update(eventSpeakers).set(dto).where(eq(eventSpeakers.id, id)).returning();
    if (!row) throw new NotFoundException('Konuşmacı bulunamadı.');
    return row;
  }

  async deleteSpeaker(id: string) {
    await this.db.delete(eventSpeakers).where(eq(eventSpeakers.id, id));
  }

  // ─── Event Sessions ───────────────────────────────────────────────────────────

  async listEventSessions(eventId: string) {
    return this.db
      .select({
        id: eventSessions.id,
        eventId: eventSessions.eventId,
        title: eventSessions.title,
        description: eventSessions.description,
        sessionType: eventSessions.sessionType,
        hall: eventSessions.hall,
        startTime: eventSessions.startTime,
        endTime: eventSessions.endTime,
        sortOrder: eventSessions.sortOrder,
        createdAt: eventSessions.createdAt,
        speakerId: eventSessions.speakerId,
        speakerName: eventSpeakers.name,
        speakerTitle: eventSpeakers.title,
        speakerAffiliation: eventSpeakers.affiliation,
        speakerAvatarUrl: eventSpeakers.avatarUrl,
      })
      .from(eventSessions)
      .leftJoin(eventSpeakers, eq(eventSpeakers.id, eventSessions.speakerId))
      .where(eq(eventSessions.eventId, eventId))
      .orderBy(asc(eventSessions.sortOrder), asc(eventSessions.startTime));
  }

  async createSession(eventId: string, dto: {
    title: string; description?: string; sessionType?: string; hall?: string;
    startTime?: Date | null; endTime?: Date | null; speakerId?: string | null; sortOrder?: number;
  }) {
    const [row] = await this.db.insert(eventSessions).values({
      eventId, title: dto.title,
      description: dto.description ?? null,
      sessionType: dto.sessionType ?? 'talk',
      hall: dto.hall ?? null,
      startTime: dto.startTime ?? null, endTime: dto.endTime ?? null,
      speakerId: dto.speakerId ?? null, sortOrder: dto.sortOrder ?? 0,
    }).returning();
    return row!;
  }

  async updateSession(id: string, dto: Partial<{
    title: string; description: string | null; sessionType: string; hall: string | null;
    startTime: Date | null; endTime: Date | null; speakerId: string | null; sortOrder: number;
  }>) {
    const [row] = await this.db.update(eventSessions).set(dto).where(eq(eventSessions.id, id)).returning();
    if (!row) throw new NotFoundException('Oturum bulunamadı.');
    return row;
  }

  async deleteSession(id: string) {
    await this.db.delete(eventSessions).where(eq(eventSessions.id, id));
  }

  // ─── Session Wishlist (Favorites) ─────────────────────────────────────────────

  async toggleSessionFavorite(userId: string, sessionId: string) {
    const existing = await this.db.query.eventSessionFavorites.findFirst({
      where: and(eq(eventSessionFavorites.userId, userId), eq(eventSessionFavorites.sessionId, sessionId)),
    });

    if (existing) {
      await this.db.delete(eventSessionFavorites).where(eq(eventSessionFavorites.id, existing.id));
      return { favorited: false };
    } else {
      await this.db.insert(eventSessionFavorites).values({ userId, sessionId });
      return { favorited: true };
    }
  }

  async getMySessionFavorites(userId: string, eventId: string) {
    const rows = await this.db
      .select({ sessionId: eventSessionFavorites.sessionId })
      .from(eventSessionFavorites)
      .innerJoin(eventSessions, eq(eventSessions.id, eventSessionFavorites.sessionId))
      .where(and(
        eq(eventSessionFavorites.userId, userId),
        eq(eventSessions.eventId, eventId),
      ));
    return rows.map(r => r.sessionId);
  }

  async getSessionFavoriteCount(sessionId: string) {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(eventSessionFavorites)
      .where(eq(eventSessionFavorites.sessionId, sessionId));
    return Number(row?.count ?? 0);
  }

  // ─── Event Registration Questions ─────────────────────────────────────────────

  async listRegistrationQuestions(eventId: string) {
    return this.db
      .select()
      .from(eventRegistrationQuestions)
      .where(eq(eventRegistrationQuestions.eventId, eventId))
      .orderBy(asc(eventRegistrationQuestions.sortOrder));
  }

  async createRegistrationQuestion(eventId: string, dto: {
    question: string; questionType?: string; options?: string[]; isRequired?: boolean; sortOrder?: number;
  }) {
    const [row] = await this.db.insert(eventRegistrationQuestions).values({
      eventId, question: dto.question,
      questionType: dto.questionType ?? 'text',
      options: dto.options ?? null,
      isRequired: dto.isRequired ?? false,
      sortOrder: dto.sortOrder ?? 0,
    }).returning();
    return row!;
  }

  async deleteRegistrationQuestion(id: string) {
    await this.db.delete(eventRegistrationQuestions).where(eq(eventRegistrationQuestions.id, id));
  }

  async saveRegistrationAnswers(attendanceId: string, answers: Array<{ questionId: string; answer: string }>) {
    if (!answers.length) return;
    await this.db.delete(eventRegistrationAnswers).where(eq(eventRegistrationAnswers.attendanceId, attendanceId));
    await this.db.insert(eventRegistrationAnswers).values(
      answers.map(a => ({ attendanceId, questionId: a.questionId, answer: a.answer }))
    );
  }

  async listRegistrationAnswers(eventId: string) {
    return this.db
      .select({
        attendanceId: eventRegistrationAnswers.attendanceId,
        userId: eventAttendances.userId,
        displayName: userProfiles.displayName,
        question: eventRegistrationQuestions.question,
        answer: eventRegistrationAnswers.answer,
      })
      .from(eventRegistrationAnswers)
      .innerJoin(eventAttendances, eq(eventAttendances.id, eventRegistrationAnswers.attendanceId))
      .innerJoin(userProfiles, eq(userProfiles.userId, eventAttendances.userId))
      .innerJoin(eventRegistrationQuestions, eq(eventRegistrationQuestions.id, eventRegistrationAnswers.questionId))
      .where(eq(eventAttendances.eventId, eventId))
      .orderBy(asc(userProfiles.displayName));
  }

  // ─── Event Invitation ─────────────────────────────────────────────────────────

  async sendEventInvitations(eventId: string, opts: { segment?: 'all' | 'active'; channel?: 'email' | 'whatsapp' | 'both' } = {}) {
    const channel = opts.channel ?? 'email';
    const event = await this.db.query.events.findFirst({ where: eq(events.id, eventId) });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı.');

    const allUsers = await this.db
      .select({
        userId: users.id,
        email: users.email,
        displayName: userProfiles.displayName,
        phone: userProfiles.phone,
        whatsappConsent: userProfiles.whatsappConsent,
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(isNotNull(users.email));

    const eventDate = new Date(event.dateStart).toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const eventUrl = `${SAHNE_URL}/etkinlikler/${event.slug}`;

    let emailSent = 0;
    let whatsappSent = 0;

    for (const u of allUsers) {
      // ── E-posta ────────────────────────────────────────────────────────────────
      if ((channel === 'email' || channel === 'both') && u.email) {
        await this.emailService.send(
          u.email,
          'event_invitation',
          {
            displayName: u.displayName ?? 'Değerli Üye',
            eventTitle: event.title,
            eventDate,
            eventUrl,
            ...(event.description ? { eventDescription: event.description } : {}),
            ...(event.location ? { eventLocation: event.location } : {}),
            ...(event.registrationUrl ? { registrationUrl: event.registrationUrl } : {}),
            ...(event.meetingUrl ? { meetingUrl: event.meetingUrl } : {}),
          },
          { jobId: `event_invite_email:${event.id}:${u.userId}` },
        );
        emailSent++;
      }

      // ── WhatsApp ───────────────────────────────────────────────────────────────
      if ((channel === 'whatsapp' || channel === 'both') && u.phone && u.whatsappConsent) {
        const msg = [
          `📅 *${event.title}*`,
          ``,
          `Sizi bu etkinliğe davet ediyoruz!`,
          ``,
          `🗓 ${eventDate}`,
          event.location ? `📍 ${event.location}` : `🖥 Online`,
          ...(event.description ? [``, event.description] : []),
          ``,
          `Detaylar ve kayıt için: ${eventUrl}`,
        ].join('\n');
        await this.whatsappService.sendText(u.phone, msg);
        whatsappSent++;
      }
    }

    return {
      emailSent,
      whatsappSent,
      total: channel === 'email' ? emailSent : channel === 'whatsapp' ? whatsappSent : Math.max(emailSent, whatsappSent),
      eventTitle: event.title,
    };
  }

  // ─── Projects ─────────────────────────────────────────────────────────────────

  async listProjects(opts: { status?: string; publishedOnly?: boolean; type?: string } = {}) {
    const conditions = [];
    if (opts.publishedOnly) conditions.push(eq(projects.isPublished, true));
    if (opts.status) conditions.push(eq(projects.status, opts.status as 'active' | 'completed' | 'archived'));
    if (opts.type) conditions.push(eq(projects.type, opts.type));

    return this.db
      .select()
      .from(projects)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(projects.createdAt));
  }

  async getProject(slug: string, publishedOnly = true) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(
        publishedOnly
          ? and(eq(projects.slug, slug), eq(projects.isPublished, true))
          : eq(projects.slug, slug),
      )
      .limit(1);
    if (!project) throw new NotFoundException(`Proje bulunamadı: ${slug}`);
    if (publishedOnly) {
      void this.db
        .update(projects)
        .set({ viewCount: sql`${projects.viewCount} + 1` })
        .where(eq(projects.slug, slug))
        .catch(() => {});
    }
    return project;
  }

  async getProjectById(id: string) {
    const [project] = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) throw new NotFoundException('Proje bulunamadı');
    return project;
  }

  async createProject(dto: CreateProjectDto, createdById: string) {
    const [created] = await this.db
      .insert(projects)
      .values({
        slug: dto.slug,
        title: dto.title,
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        status: dto.status,
        ...(dto.coverImageKey !== undefined ? { coverImageKey: dto.coverImageKey } : {}),
        isPublished: dto.isPublished,
        type: dto.type ?? 'sahne',
        ...(dto.authorName !== undefined ? { authorName: dto.authorName } : {}),
        ...(dto.authorInitials !== undefined ? { authorInitials: dto.authorInitials } : {}),
        ...(dto.authorAvatarColor !== undefined ? { authorAvatarColor: dto.authorAvatarColor } : {}),
        ...(dto.authorTag !== undefined ? { authorTag: dto.authorTag } : {}),
        ...(dto.authorTagColor !== undefined ? { authorTagColor: dto.authorTagColor } : {}),
        ...(dto.accentGradient !== undefined ? { accentGradient: dto.accentGradient } : {}),
        ...(dto.linkedinUrl !== undefined ? { linkedinUrl: dto.linkedinUrl } : {}),
        ...(dto.linkedinViewCount !== undefined ? { linkedinViewCount: dto.linkedinViewCount } : {}),
        ...(dto.hashtags !== undefined ? { hashtags: dto.hashtags } : {}),
        ...(dto.externalLinks !== undefined ? { externalLinks: dto.externalLinks } : {}),
        ...(dto.imageKeys !== undefined ? { imageKeys: dto.imageKeys } : {}),
        ...(dto.problem !== undefined ? { problem: dto.problem } : {}),
        ...(dto.solution !== undefined ? { solution: dto.solution } : {}),
        ...(dto.features !== undefined ? { features: dto.features } : {}),
        ...(dto.gains !== undefined ? { gains: dto.gains } : {}),
        ...(dto.innovationScore !== undefined ? { innovationScore: dto.innovationScore } : {}),
        ...(dto.maturityLevel !== undefined ? { maturityLevel: dto.maturityLevel } : {}),
        ...(dto.impactDomains !== undefined ? { impactDomains: dto.impactDomains } : {}),
        ...(dto.targetAudience !== undefined ? { targetAudience: dto.targetAudience } : {}),
        ...(dto.projectType !== undefined ? { projectType: dto.projectType } : {}),
        ...(dto.editorialNote !== undefined ? { editorialNote: dto.editorialNote } : {}),
        ...(dto.editorialScore !== undefined ? { editorialScore: dto.editorialScore } : {}),
        ...(dto.editorialStrengths !== undefined ? { editorialStrengths: dto.editorialStrengths } : {}),
        ...(dto.university !== undefined ? { university: dto.university } : {}),
        ...(dto.graduationType !== undefined ? { graduationType: dto.graduationType } : {}),
        ...(dto.graduationYear !== undefined ? { graduationYear: dto.graduationYear } : {}),
        ...(dto.projectCategory !== undefined ? { projectCategory: dto.projectCategory } : {}),
        createdBy: createdById,
      })
      .returning();
    return created;
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    const [updated] = await this.db
      .update(projects)
      .set({
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.coverImageKey !== undefined ? { coverImageKey: dto.coverImageKey } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.authorName !== undefined ? { authorName: dto.authorName } : {}),
        ...(dto.authorInitials !== undefined ? { authorInitials: dto.authorInitials } : {}),
        ...(dto.authorAvatarColor !== undefined ? { authorAvatarColor: dto.authorAvatarColor } : {}),
        ...(dto.authorTag !== undefined ? { authorTag: dto.authorTag } : {}),
        ...(dto.authorTagColor !== undefined ? { authorTagColor: dto.authorTagColor } : {}),
        ...(dto.accentGradient !== undefined ? { accentGradient: dto.accentGradient } : {}),
        ...(dto.linkedinUrl !== undefined ? { linkedinUrl: dto.linkedinUrl } : {}),
        ...(dto.linkedinViewCount !== undefined ? { linkedinViewCount: dto.linkedinViewCount } : {}),
        ...(dto.hashtags !== undefined ? { hashtags: dto.hashtags } : {}),
        ...(dto.externalLinks !== undefined ? { externalLinks: dto.externalLinks } : {}),
        ...(dto.imageKeys !== undefined ? { imageKeys: dto.imageKeys } : {}),
        ...(dto.problem !== undefined ? { problem: dto.problem } : {}),
        ...(dto.solution !== undefined ? { solution: dto.solution } : {}),
        ...(dto.features !== undefined ? { features: dto.features } : {}),
        ...(dto.gains !== undefined ? { gains: dto.gains } : {}),
        ...(dto.innovationScore !== undefined ? { innovationScore: dto.innovationScore } : {}),
        ...(dto.maturityLevel !== undefined ? { maturityLevel: dto.maturityLevel } : {}),
        ...(dto.impactDomains !== undefined ? { impactDomains: dto.impactDomains } : {}),
        ...(dto.targetAudience !== undefined ? { targetAudience: dto.targetAudience } : {}),
        ...(dto.projectType !== undefined ? { projectType: dto.projectType } : {}),
        ...(dto.editorialNote !== undefined ? { editorialNote: dto.editorialNote } : {}),
        ...(dto.editorialScore !== undefined ? { editorialScore: dto.editorialScore } : {}),
        ...(dto.editorialStrengths !== undefined ? { editorialStrengths: dto.editorialStrengths } : {}),
        ...(dto.linkedinPostUrl !== undefined ? { linkedinPostUrl: dto.linkedinPostUrl } : {}),
        ...(dto.university !== undefined ? { university: dto.university } : {}),
        ...(dto.graduationType !== undefined ? { graduationType: dto.graduationType } : {}),
        ...(dto.graduationYear !== undefined ? { graduationYear: dto.graduationYear } : {}),
        ...(dto.projectCategory !== undefined ? { projectCategory: dto.projectCategory } : {}),
        ...(dto.awardCohortMonth !== undefined ? { awardCohortMonth: dto.awardCohortMonth } : {}),
        ...(dto.awardRank !== undefined ? { awardRank: dto.awardRank } : {}),
        ...(dto.finalist !== undefined ? { finalist: dto.finalist } : {}),
        ...(dto.winner !== undefined ? { winner: dto.winner } : {}),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Proje bulunamadı');
    return updated;
  }

  async deleteProject(id: string) {
    const [deleted] = await this.db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });
    if (!deleted) throw new NotFoundException('Proje bulunamadı');
    return { deleted: true };
  }

  async generateKunye(id: string): Promise<Record<string, unknown>> {
    const project = await this.getProjectById(id);
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) throw new BadRequestException('ANTHROPIC_API_KEY tanımlı değil');

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey });

    const prompt = `Sen Haritailesi platformunun editörüsün. Haritailesi, Türkiye'deki harita ve mühendislik topluluğunun profesyonel üretim platformudur.

Aşağıdaki proje bilgilerine dayanarak proje künyesini oluştur:

Başlık: ${project.title}
Özet: ${project.summary ?? 'Yok'}
Yazar: ${project.authorName ?? 'Bilinmiyor'}
Alan: ${project.authorTag ?? 'Bilinmiyor'}
Etiketler: ${(project.hashtags ?? []).join(', ')}
İçerik: ${project.body ? project.body.replace(/<[^>]+>/g, '').slice(0, 800) : 'Yok'}

Aşağıdaki JSON formatında yanıt ver, SADECE JSON döndür, başka hiçbir şey yazma:

{
  "problem": "Projenin çözdüğü sorunu 1-2 cümleyle açıkla",
  "solution": "Çözüm yöntemini 1-2 cümleyle açıkla",
  "features": ["özellik1", "özellik2", "özellik3", "özellik4", "özellik5"],
  "gains": {
    "time": true/false,
    "cost": true/false,
    "quality": true/false,
    "safety": true/false
  },
  "innovationScore": {
    "local": true/false,
    "national": true/false,
    "sector": true/false,
    "academic": true/false
  },
  "maturityLevel": "idea|prototype|testing|active|commercial",
  "impactDomains": ["alan1", "alan2"],
  "targetAudience": ["hedef1", "hedef2", "hedef3"],
  "projectType": ["tür1", "tür2"],
  "editorialNote": "Haritailesi editörü olarak 2-3 cümlelik profesyonel değerlendirme"
}

Seçenekler için kılavuz:
- maturityLevel: "idea" (Fikir), "prototype" (Prototip), "testing" (Test Aşaması), "active" (Aktif Kullanım), "commercial" (Ticari Ürün)
- impactDomains seçenekleri: Kadastro, Altyapı, CBS, Fotogrametri, Uzaktan Algılama, Yapı Denetim, Deformasyon, Madencilik, Akıllı Şehirler
- Türkçe yaz, profesyonel ve özlü ol`;

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const firstBlock = message.content[0];
    const text = firstBlock && firstBlock.type === 'text' ? (firstBlock as { type: 'text'; text: string }).text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new BadRequestException('AI yanıtı JSON içermiyor');

    return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  }

  // ─── Search ───────────────────────────────────────────────────────────────────

  async search(q: string) {
    const term = `%${q}%`;
    const [matchedEvents, matchedProjects] = await Promise.all([
      this.db
        .select({
          id: events.id,
          slug: events.slug,
          title: events.title,
          description: events.description,
          dateStart: events.dateStart,
          type: events.type,
        })
        .from(events)
        .where(
          and(
            eq(events.isPublished, true),
            or(ilike(events.title, term), ilike(events.description, term), ilike(events.location, term)),
          ),
        )
        .orderBy(desc(events.dateStart))
        .limit(5),
      this.db
        .select({
          id: projects.id,
          slug: projects.slug,
          title: projects.title,
          summary: projects.summary,
          status: projects.status,
        })
        .from(projects)
        .where(
          and(
            eq(projects.isPublished, true),
            or(ilike(projects.title, term), ilike(projects.summary, term)),
          ),
        )
        .orderBy(desc(projects.createdAt))
        .limit(5),
    ]);

    return { events: matchedEvents, projects: matchedProjects };
  }

  // ─── Trainings ────────────────────────────────────────────────────────────────

  async getTrainingById(id: string) {
    const [row] = await this.db.select().from(trainings).where(eq(trainings.id, id)).limit(1);
    if (!row) throw new NotFoundException('Kurs bulunamadı');
    return row;
  }

  async getUserProfile(userId: string) {
    return this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
      columns: { displayName: true, phone: true },
    });
  }

  async listTrainings(publishedOnly = true) {
    const rows = await this.db
      .select()
      .from(trainings)
      .where(publishedOnly ? eq(trainings.isPublished, true) : undefined)
      .orderBy(desc(trainings.createdAt));

    const withCounts = await Promise.all(rows.map(async (t) => {
      const [lessonCount] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(courseLessons)
        .where(and(eq(courseLessons.trainingId, t.id), eq(courseLessons.isPublished, true)));
      return { ...t, lessonCount: Number(lessonCount?.count ?? 0) };
    }));
    return withCounts;
  }

  async listTrainingsAdmin() {
    const rows = await this.db.select().from(trainings).orderBy(desc(trainings.createdAt));

    return Promise.all(rows.map(async (t) => {
      const [lessonRow] = await this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(courseLessons)
        .where(and(eq(courseLessons.trainingId, t.id), eq(courseLessons.isPublished, true)));

      const enrollStats = await this.db
        .select({
          total:    sql<number>`COUNT(*)::int`,
          ongoing:  sql<number>`COUNT(CASE WHEN progress_pct > 0 AND completed_at IS NULL THEN 1 END)::int`,
          finished: sql<number>`COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END)::int`,
        })
        .from(courseEnrollments)
        .where(eq(courseEnrollments.trainingId, t.id));

      const stat = enrollStats[0] ?? { total: 0, ongoing: 0, finished: 0 };
      const invited = Number(stat.total) - Number(stat.ongoing) - Number(stat.finished);

      return {
        ...t,
        lessonCount: Number(lessonRow?.count ?? 0),
        enrollStats: {
          total:    Number(stat.total),
          invited:  Math.max(0, invited),
          ongoing:  Number(stat.ongoing),
          finished: Number(stat.finished),
        },
      };
    }));
  }

  async getTraining(slug: string, publishedOnly = true) {
    const [row] = await this.db
      .select()
      .from(trainings)
      .where(
        publishedOnly
          ? and(eq(trainings.slug, slug), eq(trainings.isPublished, true))
          : eq(trainings.slug, slug),
      )
      .limit(1);
    if (!row) throw new NotFoundException(`Eğitim bulunamadı: ${slug}`);
    if (publishedOnly) {
      void this.db
        .update(trainings)
        .set({ viewCount: sql`${trainings.viewCount} + 1` })
        .where(eq(trainings.slug, slug))
        .catch(() => {});
    }
    return row;
  }

  async getTrainingDetail(slug: string, publishedOnly = true) {
    const training = await this.getTraining(slug, publishedOnly);

    // Bölümler + dersler
    const sections = await this.db
      .select()
      .from(courseSections)
      .where(eq(courseSections.trainingId, training.id))
      .orderBy(asc(courseSections.sortOrder));

    const lessons = await this.db
      .select()
      .from(courseLessons)
      .where(and(
        eq(courseLessons.trainingId, training.id),
        publishedOnly ? eq(courseLessons.isPublished, true) : undefined,
      ))
      .orderBy(asc(courseLessons.sortOrder));

    // Ortalama puan ve yorum sayısı
    const [reviewStats] = await this.db
      .select({
        avgRating: sql<number>`ROUND(AVG(rating)::numeric, 1)`,
        reviewCount: sql<number>`COUNT(*)`,
      })
      .from(courseReviews)
      .where(and(eq(courseReviews.trainingId, training.id), eq(courseReviews.isPublished, true)));

    // Quiz ID'lerini lesson'a eşleştir
    const quizRows = await this.db
      .select({ id: courseQuizzes.id, lessonId: courseQuizzes.lessonId })
      .from(courseQuizzes)
      .where(eq(courseQuizzes.trainingId, training.id));
    const quizByLessonId: Record<string, string> = {};
    for (const q of quizRows) {
      if (q.lessonId) quizByLessonId[q.lessonId] = q.id;
    }

    const sectionsWithLessons = sections.map(s => ({
      ...s,
      lessons: lessons
        .filter(l => l.sectionId === s.id)
        .map(l => ({
          id: l.id, slug: l.slug, title: l.title, contentType: l.contentType,
          durationMinutes: l.durationMinutes, isFree: l.isFree, sortOrder: l.sortOrder,
          createdAt: l.createdAt,
          ...(quizByLessonId[l.id] ? { quizId: quizByLessonId[l.id] } : {}),
        })),
    }));

    const totalMinutes = lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);

    return {
      ...training,
      sections: sectionsWithLessons,
      totalLessons: lessons.length,
      totalMinutes,
      avgRating: reviewStats?.avgRating ?? null,
      reviewCount: Number(reviewStats?.reviewCount ?? 0),
    };
  }

  async createTraining(dto: Record<string, unknown>) {
    const [row] = await this.db.insert(trainings).values({
      slug: dto['slug'] as string,
      title: dto['title'] as string,
      ...(dto['instructor'] ? { instructor: dto['instructor'] as string } : {}),
      ...(dto['instructorTitle'] ? { instructorTitle: dto['instructorTitle'] as string } : {}),
      ...(dto['instructorBio'] ? { instructorBio: dto['instructorBio'] as string } : {}),
      ...(dto['instructorAvatarKey'] ? { instructorAvatarKey: dto['instructorAvatarKey'] as string } : {}),
      ...(dto['format'] ? { format: dto['format'] as string } : {}),
      ...(dto['level'] ? { level: dto['level'] as string } : {}),
      ...(dto['duration'] ? { duration: dto['duration'] as string } : {}),
      ...(dto['price'] ? { price: dto['price'] as string } : {}),
      ...(dto['memberPrice'] ? { memberPrice: dto['memberPrice'] as string } : {}),
      ...(dto['description'] ? { description: dto['description'] as string } : {}),
      ...(dto['body'] ? { body: dto['body'] as string } : {}),
      ...(dto['coverImageKey'] ? { coverImageKey: dto['coverImageKey'] as string } : {}),
      ...(dto['accessLevel'] ? { accessLevel: dto['accessLevel'] as string } : {}),
      ...(dto['certificateThreshold'] ? { certificateThreshold: Number(dto['certificateThreshold']) } : {}),
      tags: (dto['tags'] as string[]) ?? [],
      prerequisites: (dto['prerequisites'] as string[]) ?? [],
      isPublished: (dto['isPublished'] as boolean) ?? false,
      ...(dto['registrationUrl'] ? { registrationUrl: dto['registrationUrl'] as string } : {}),
      ...(dto['startDate'] ? { startDate: new Date(dto['startDate'] as string) } : {}),
      ...(dto['source'] ? { source: dto['source'] as string } : {}),
    }).returning();
    return row;
  }

  async updateTraining(id: string, dto: Record<string, unknown>) {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    const fields = ['slug','title','instructor','instructorTitle','instructorBio','instructorAvatarKey',
      'format','level','duration','price','memberPrice','description','body','coverImageKey',
      'accessLevel','certificateThreshold','tags','prerequisites','isPublished','registrationUrl','source'];
    for (const f of fields) {
      if (dto[f] !== undefined) set[f] = dto[f];
    }
    if (dto['startDate'] !== undefined) set['startDate'] = dto['startDate'] ? new Date(dto['startDate'] as string) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [row] = await this.db.update(trainings).set(set as any).where(eq(trainings.id, id)).returning();
    if (!row) throw new NotFoundException('Eğitim bulunamadı');
    return row;
  }

  async deleteTraining(id: string) {
    await this.db.delete(trainings).where(eq(trainings.id, id));
    return { deleted: true };
  }

  // ─── Kurs Bölümleri ───────────────────────────────────────────────────────────

  async listSections(trainingId: string) {
    const sections = await this.db
      .select()
      .from(courseSections)
      .where(eq(courseSections.trainingId, trainingId))
      .orderBy(asc(courseSections.sortOrder));

    const lessons = await this.db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.trainingId, trainingId))
      .orderBy(asc(courseLessons.sortOrder));

    return sections.map(s => ({
      ...s,
      lessons: lessons.filter(l => l.sectionId === s.id),
    }));
  }

  async createSection(trainingId: string, dto: { title: string; description?: string; sortOrder?: number }) {
    const [row] = await this.db.insert(courseSections).values({
      trainingId, title: dto.title,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
    }).returning();
    return row!;
  }

  async updateSection(id: string, dto: { title?: string; description?: string; sortOrder?: number }) {
    const [row] = await this.db.update(courseSections).set(dto).where(eq(courseSections.id, id)).returning();
    if (!row) throw new NotFoundException('Bölüm bulunamadı');
    return row;
  }

  async deleteSection(id: string) {
    await this.db.delete(courseSections).where(eq(courseSections.id, id));
    return { deleted: true };
  }

  // ─── Kurs Dersleri ────────────────────────────────────────────────────────────

  async createLesson(sectionId: string, dto: {
    slug: string; title: string; description?: string; contentType?: string;
    videoUrl?: string; videoEmbed?: string; body?: string; pdfKey?: string;
    durationMinutes?: number; sortOrder?: number; isFree?: boolean;
  }) {
    const section = await this.db.query.courseSections.findFirst({ where: eq(courseSections.id, sectionId) });
    if (!section) throw new NotFoundException('Bölüm bulunamadı');
    const [row] = await this.db.insert(courseLessons).values({
      sectionId,
      trainingId: section.trainingId,
      slug: dto.slug,
      title: dto.title,
      description: dto.description ?? null,
      contentType: dto.contentType ?? 'video',
      videoUrl: dto.videoUrl ?? null,
      videoEmbed: dto.videoEmbed ?? null,
      body: dto.body ?? null,
      pdfKey: dto.pdfKey ?? null,
      durationMinutes: dto.durationMinutes ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isFree: dto.isFree ?? false,
    }).returning();
    return row!;
  }

  async updateLesson(id: string, dto: Partial<{
    slug: string; title: string; description: string | null; contentType: string;
    videoUrl: string | null; videoEmbed: string | null; body: string | null; pdfKey: string | null;
    durationMinutes: number | null; sortOrder: number; isFree: boolean; isPublished: boolean;
  }>) {
    const [row] = await this.db.update(courseLessons).set(dto).where(eq(courseLessons.id, id)).returning();
    if (!row) throw new NotFoundException('Ders bulunamadı');
    return row;
  }

  async deleteLesson(id: string) {
    await this.db.delete(courseLessons).where(eq(courseLessons.id, id));
    return { deleted: true };
  }

  async getLessonContent(trainingSlug: string, lessonSlug: string, userId?: string, membershipTier?: string) {
    const training = await this.getTraining(trainingSlug, true);

    // Üyelik seviyesi erişim kontrolü
    if (training.accessLevel === 'premium') {
      const premiumTiers = ['corporate_member', 'individual_member'];
      if (!userId || !membershipTier || !premiumTiers.includes(membershipTier)) {
        throw new ForbiddenException('Bu kurs premium üyelere özeldir.');
      }
    } else if (training.accessLevel === 'member' && !userId) {
      throw new ForbiddenException('Bu kursa erişmek için üye girişi yapmanız gerekiyor.');
    }

    const [lesson] = await this.db
      .select()
      .from(courseLessons)
      .where(and(
        eq(courseLessons.trainingId, training.id),
        eq(courseLessons.slug, lessonSlug),
        eq(courseLessons.isPublished, true),
      ))
      .limit(1);
    if (!lesson) throw new NotFoundException('Ders bulunamadı');

    // Ücretsiz ders veya giriş yapmış kullanıcı → içerik ver
    if (!lesson.isFree && !userId) {
      throw new ForbiddenException('Bu derse erişmek için üye girişi yapmanız gerekiyor.');
    }

    // Giriş yapmış kullanıcı için kayıt kontrolü
    if (userId) {
      const [enrollment] = await this.db
        .select({ id: courseEnrollments.id })
        .from(courseEnrollments)
        .where(and(eq(courseEnrollments.trainingId, training.id), eq(courseEnrollments.userId, userId)))
        .limit(1);
      if (!enrollment && !lesson.isFree) {
        throw new ForbiddenException('Bu kursa kayıtlı değilsiniz.');
      }
      if (enrollment) {
        void this.db.update(courseEnrollments)
          .set({ lastAccessedAt: new Date() })
          .where(eq(courseEnrollments.id, enrollment.id))
          .catch(() => {});
      }
    }

    // Görüntülenme sayısını artır
    void this.db.update(courseLessons)
      .set({ viewCount: sql`${courseLessons.viewCount} + 1` })
      .where(eq(courseLessons.id, lesson.id))
      .catch(() => {});

    return lesson;
  }

  // ─── Enrollment ───────────────────────────────────────────────────────────────

  async enrollCourse(userId: string, trainingId: string) {
    const training = await this.db.query.trainings.findFirst({ where: eq(trainings.id, trainingId) });
    if (!training) throw new NotFoundException('Kurs bulunamadı');
    if (!training.isPublished) throw new BadRequestException('Kurs henüz yayınlanmamış.');

    const existing = await this.db.query.courseEnrollments.findFirst({
      where: and(eq(courseEnrollments.trainingId, trainingId), eq(courseEnrollments.userId, userId)),
    });
    if (existing) return { enrolled: true, alreadyEnrolled: true, enrollmentId: existing.id };

    const [enrollment] = await this.db.insert(courseEnrollments).values({
      trainingId, userId,
    }).returning();

    void this.db.update(trainings)
      .set({ enrollmentCount: sql`${trainings.enrollmentCount} + 1` })
      .where(eq(trainings.id, trainingId))
      .catch(() => {});

    void this.checkFirstEnrollmentBadge(userId).catch(() => {});

    return { enrolled: true, alreadyEnrolled: false, enrollmentId: enrollment!.id };
  }

  async inviteUserToCourse(trainingId: string, email: string) {
    const training = await this.db.query.trainings.findFirst({ where: eq(trainings.id, trainingId) });
    if (!training) throw new NotFoundException('Kurs bulunamadı');

    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw new NotFoundException(`${email} adresli kullanıcı bulunamadı`);

    const profile = await this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, user.id), columns: { displayName: true } });
    const displayName = profile?.displayName ?? 'Değerli Üye';
    const courseUrl = `${process.env['MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org'}/egitim/${training.slug}`;

    await this.emailService.send(
      email,
      'course_payment_confirmed', // reuse confirmed template
      { displayName, trainingTitle: training.title, courseUrl },
      { jobId: `course_invite:${user.id}:${trainingId}` },
    );
    return { invited: true, email, displayName };
  }

  async unenrollCourse(userId: string, trainingId: string) {
    await this.db.delete(courseEnrollments)
      .where(and(eq(courseEnrollments.trainingId, trainingId), eq(courseEnrollments.userId, userId)));
    void this.db.update(trainings)
      .set({ enrollmentCount: sql`GREATEST(0, ${trainings.enrollmentCount} - 1)` })
      .where(eq(trainings.id, trainingId))
      .catch(() => {});
    return { enrolled: false };
  }

  async getMyEnrollments(userId: string) {
    const rows = await this.db
      .select({
        trainingId: courseEnrollments.trainingId,
        enrolledAt: courseEnrollments.enrolledAt,
        progressPct: courseEnrollments.progressPct,
        completedAt: courseEnrollments.completedAt,
        lastAccessedAt: courseEnrollments.lastAccessedAt,
        slug: trainings.slug,
        title: trainings.title,
        coverImageKey: trainings.coverImageKey,
        level: trainings.level,
        format: trainings.format,
      })
      .from(courseEnrollments)
      .innerJoin(trainings, eq(trainings.id, courseEnrollments.trainingId))
      .where(eq(courseEnrollments.userId, userId))
      .orderBy(desc(courseEnrollments.lastAccessedAt));
    return rows;
  }

  async getEnrollmentStatus(userId: string, trainingId: string) {
    const [row] = await this.db
      .select()
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.trainingId, trainingId), eq(courseEnrollments.userId, userId)))
      .limit(1);
    return row ?? null;
  }

  // ─── Ders İlerlemesi ──────────────────────────────────────────────────────────

  async markLessonComplete(userId: string, lessonId: string) {
    const [lesson] = await this.db
      .select({ trainingId: courseLessons.trainingId, xpReward: courseLessons.xpReward })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundException('Ders bulunamadı');

    const inserted = await this.db.insert(lessonProgress).values({ lessonId, userId })
      .onConflictDoNothing().returning({ id: lessonProgress.id });
    const xpGained = inserted.length > 0 ? (lesson.xpReward ?? 10) : 0;

    // Önceki rank
    const prevXpData = xpGained > 0 ? await this.getMyXp(userId) : null;
    const prevRankLabel = prevXpData?.current.label;

    await this.recalcProgress(userId, lesson.trainingId);
    const xpData = await this.getMyXp(userId);
    const rankUp = xpGained > 0 && prevRankLabel !== undefined && prevRankLabel !== xpData.current.label;
    return { completed: true, xpGained, rankUp, ...xpData };
  }

  async unmarkLessonComplete(userId: string, lessonId: string) {
    const [lesson] = await this.db
      .select({ trainingId: courseLessons.trainingId })
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundException('Ders bulunamadı');
    await this.db.delete(lessonProgress)
      .where(and(eq(lessonProgress.lessonId, lessonId), eq(lessonProgress.userId, userId)));
    await this.recalcProgress(userId, lesson.trainingId);
    return { completed: false };
  }

  private async recalcProgress(userId: string, trainingId: string) {
    const [totalRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(courseLessons)
      .where(and(eq(courseLessons.trainingId, trainingId), eq(courseLessons.isPublished, true)));
    const total = Number(totalRow?.count ?? 0);
    if (total === 0) return;

    const [doneRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(lessonProgress)
      .innerJoin(courseLessons, eq(courseLessons.id, lessonProgress.lessonId))
      .where(and(eq(courseLessons.trainingId, trainingId), eq(lessonProgress.userId, userId)));
    const done = Number(doneRow?.count ?? 0);
    const pct = Math.round((done / total) * 100);

    await this.db.update(courseEnrollments)
      .set({
        progressPct: pct,
        ...(pct === 100 ? { completedAt: new Date() } : {}),
      })
      .where(and(eq(courseEnrollments.trainingId, trainingId), eq(courseEnrollments.userId, userId)));

    if (pct === 100) {
      void this.checkCompletionBadges(userId).catch(() => {});

      // Tamamlama e-postası (ilk kez tamamlanıyorsa)
      void (async () => {
        try {
          const [training] = await this.db.select({ title: trainings.title, slug: trainings.slug }).from(trainings).where(eq(trainings.id, trainingId)).limit(1);
          const [userRow] = await this.db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
          const profile = await this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId), columns: { displayName: true } });
          if (userRow && training) {
            const courseUrl = `${SAHNE_URL}/egitim/${training.slug}`;
            await this.emailService.sendCourseCompleted(userRow.email, profile?.displayName ?? 'Değerli Üye', training.title, courseUrl);
          }
        } catch {}
      })();
    }
  }

  async getMyLessonProgress(userId: string, trainingId: string) {
    const rows = await this.db
      .select({ lessonId: lessonProgress.lessonId })
      .from(lessonProgress)
      .innerJoin(courseLessons, eq(courseLessons.id, lessonProgress.lessonId))
      .where(and(eq(courseLessons.trainingId, trainingId), eq(lessonProgress.userId, userId)));
    return rows.map(r => r.lessonId);
  }

  // ─── Kurs Yorumları ───────────────────────────────────────────────────────────

  async listReviews(trainingId: string) {
    return this.db
      .select({
        id: courseReviews.id,
        rating: courseReviews.rating,
        comment: courseReviews.comment,
        createdAt: courseReviews.createdAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(courseReviews)
      .innerJoin(userProfiles, eq(userProfiles.userId, courseReviews.userId))
      .where(and(eq(courseReviews.trainingId, trainingId), eq(courseReviews.isPublished, true)))
      .orderBy(desc(courseReviews.createdAt))
      .limit(50);
  }

  async addReview(userId: string, trainingId: string, dto: { rating: number; comment?: string }) {
    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Puan 1-5 arasında olmalı.');
    const [row] = await this.db.insert(courseReviews).values({
      trainingId, userId, rating: dto.rating, comment: dto.comment ?? null,
    }).onConflictDoUpdate({
      target: [courseReviews.trainingId, courseReviews.userId],
      set: { rating: dto.rating, comment: dto.comment ?? null, createdAt: new Date() },
    }).returning();
    return row!;
  }

  async deleteReview(id: string) {
    await this.db.delete(courseReviews).where(eq(courseReviews.id, id));
    return { deleted: true };
  }

  // ─── Quiz ─────────────────────────────────────────────────────────────────────

  async listQuizzes(trainingId: string) {
    const quizzes = await this.db
      .select()
      .from(courseQuizzes)
      .where(eq(courseQuizzes.trainingId, trainingId));

    const withQuestions = await Promise.all(quizzes.map(async (q) => {
      const questions = await this.db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, q.id))
        .orderBy(asc(quizQuestions.sortOrder));
      return { ...q, questions };
    }));
    return withQuestions;
  }

  async getQuiz(quizId: string, forUser = false, userId?: string) {
    const [quiz] = await this.db.select().from(courseQuizzes).where(eq(courseQuizzes.id, quizId)).limit(1);
    if (!quiz) throw new NotFoundException('Quiz bulunamadı');

    let questions = await this.db.select().from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.sortOrder));

    // Rastgele soru seçimi
    if (quiz.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }
    if (quiz.questionPoolSize && quiz.questionPoolSize < questions.length) {
      questions = questions.slice(0, quiz.questionPoolSize);
    }

    // Kullanıcı için doğru cevapları gizle
    const sanitized = forUser
      ? questions.map(({ correctAnswers: _ca, ...rest }) => rest)
      : questions;

    // Attempt bilgisi
    let attemptInfo: { attemptCount: number; remaining: number | null } | undefined;
    if (forUser && userId) {
      const [cnt] = await this.db.select({ c: sql<number>`COUNT(*)::int` }).from(quizAttempts)
        .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.userId, userId)));
      const attemptCount = Number(cnt?.c ?? 0);
      attemptInfo = {
        attemptCount,
        remaining: quiz.maxAttempts > 0 ? Math.max(0, quiz.maxAttempts - attemptCount) : null,
      };
    }

    return { ...quiz, questions: sanitized, ...(attemptInfo ? { attemptInfo } : {}) };
  }

  async createQuiz(trainingId: string, dto: { title: string; passingScore?: number; lessonId?: string }) {
    const [row] = await this.db.insert(courseQuizzes).values({
      trainingId, title: dto.title,
      passingScore: dto.passingScore ?? 70,
      lessonId: dto.lessonId ?? null,
    }).returning();
    return row!;
  }

  async updateQuizSettings(quizId: string, dto: {
    maxAttempts?: number; randomizeQuestions?: boolean;
    questionPoolSize?: number | null; showCorrectAnswers?: boolean;
    timeLimitMinutes?: number | null; passingScore?: number; title?: string;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [row] = await this.db.update(courseQuizzes).set(dto as any).where(eq(courseQuizzes.id, quizId)).returning();
    if (!row) throw new NotFoundException('Quiz bulunamadı');
    return row;
  }

  async createQuestion(quizId: string, dto: {
    question: string; questionType?: string; options?: string[];
    correctAnswers: string[]; explanation?: string; sortOrder?: number;
  }) {
    const [row] = await this.db.insert(quizQuestions).values({
      quizId,
      question: dto.question,
      questionType: dto.questionType ?? 'single',
      options: dto.options ?? null,
      correctAnswers: dto.correctAnswers,
      explanation: dto.explanation ?? null,
      sortOrder: dto.sortOrder ?? 0,
    }).returning();
    return row!;
  }

  async updateQuestion(id: string, dto: Partial<{
    question: string; questionType: string; options: string[] | null;
    correctAnswers: string[]; explanation: string | null; sortOrder: number;
  }>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [row] = await this.db.update(quizQuestions).set(dto as any).where(eq(quizQuestions.id, id)).returning();
    if (!row) throw new NotFoundException('Soru bulunamadı');
    return row;
  }

  async deleteQuestion(id: string) {
    await this.db.delete(quizQuestions).where(eq(quizQuestions.id, id));
    return { deleted: true };
  }

  async submitQuiz(userId: string, quizId: string, answers: Record<string, string | string[]>) {
    const [quiz] = await this.db.select().from(courseQuizzes).where(eq(courseQuizzes.id, quizId)).limit(1);
    if (!quiz) throw new NotFoundException('Quiz bulunamadı');

    // Attempt limit kontrolü
    if (quiz.maxAttempts > 0) {
      const [cnt] = await this.db.select({ c: sql<number>`COUNT(*)::int` }).from(quizAttempts)
        .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.userId, userId)));
      if (Number(cnt?.c ?? 0) >= quiz.maxAttempts) {
        throw new ForbiddenException(`Bu quiz için maksimum deneme hakkınızı (${quiz.maxAttempts}) kullandınız.`);
      }
    }

    const questions = await this.db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));
    if (questions.length === 0) throw new BadRequestException('Bu quizin sorusu yok.');

    let correctCount = 0;
    const questionResults = questions.map(q => {
      const userAnswer = answers[q.id];
      const ua = userAnswer
        ? (Array.isArray(userAnswer) ? [...userAnswer].sort() : [userAnswer])
        : [];
      const correct = [...q.correctAnswers].sort();
      const isCorrect = ua.length > 0 && JSON.stringify(ua) === JSON.stringify(correct);
      if (isCorrect) correctCount++;
      return {
        id: q.id,
        question: q.question,
        isCorrect,
        userAnswer: userAnswer ?? null,
        ...(quiz.showCorrectAnswers ? { correctAnswers: q.correctAnswers, explanation: q.explanation } : {}),
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const [attempt] = await this.db.insert(quizAttempts).values({
      quizId, userId, score, passed, answers,
    }).returning();

    if (passed) {
      await this.issueCertificate(userId, quiz.trainingId, score);

      // Kurs tamamlama: enrollment'ı %100'e çek
      void this.db.update(courseEnrollments)
        .set({ progressPct: 100, completedAt: new Date() })
        .where(and(eq(courseEnrollments.trainingId, quiz.trainingId), eq(courseEnrollments.userId, userId)))
        .catch(() => {});
    }

    if (score >= 90) {
      void this.awardBadgeIfNew(userId, 'quiz-ace', { quizId, score }).catch(() => {});
    }

    // Attempt sayısını dönüşe ekle
    const [newCnt] = await this.db.select({ c: sql<number>`COUNT(*)::int` }).from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.userId, userId)));
    const attemptCount = Number(newCnt?.c ?? 1);
    const remaining = quiz.maxAttempts > 0 ? Math.max(0, quiz.maxAttempts - attemptCount) : null;

    return {
      score, passed, correctCount, total: questions.length,
      passingScore: quiz.passingScore, attemptId: attempt!.id,
      questionResults, attemptCount, remaining,
    };
  }

  async getMyQuizAttempts(userId: string, quizId: string) {
    return this.db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.userId, userId)))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getAllMyQuizAttempts(userId: string) {
    return this.db
      .select({
        quizId: quizAttempts.quizId,
        quizTitle: courseQuizzes.title,
        trainingTitle: trainings.title,
        trainingSlug: trainings.slug,
        score: quizAttempts.score,
        passed: quizAttempts.passed,
        completedAt: quizAttempts.completedAt,
      })
      .from(quizAttempts)
      .innerJoin(courseQuizzes, eq(courseQuizzes.id, quizAttempts.quizId))
      .innerJoin(trainings, eq(trainings.id, courseQuizzes.trainingId))
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(100);
  }

  // ─── Sertifika ────────────────────────────────────────────────────────────────

  async issueCertificate(userId: string, trainingId: string, quizScore?: number) {
    const existing = await this.db.query.courseCertificates.findFirst({
      where: and(eq(courseCertificates.trainingId, trainingId), eq(courseCertificates.userId, userId)),
    });
    if (existing) return existing;

    const certificateCode = `CERT-${randomUUID().split('-')[0]!.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const [cert] = await this.db.insert(courseCertificates).values({
      trainingId, userId, certificateCode, quizScore: quizScore ?? null,
    }).returning();
    this.logger.log(`certificate_issued userId=${userId} trainingId=${trainingId} code=${certificateCode}`);
    void this.awardBadgeIfNew(userId, 'certified', { trainingId }).catch(() => {});

    // Sertifika e-postası gönder
    void (async () => {
      try {
        const [training] = await this.db.select({ title: trainings.title, slug: trainings.slug }).from(trainings).where(eq(trainings.id, trainingId)).limit(1);
        const [userRow] = await this.db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
        const profile = await this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId), columns: { displayName: true } });
        if (userRow && training) {
          const certUrl = `${SAHNE_URL}/egitim/sertifika/${certificateCode}`;
          await this.emailService.sendCourseCertificateIssued(userRow.email, profile?.displayName ?? 'Değerli Üye', training.title, certificateCode, certUrl);
        }
      } catch {}
    })();

    return cert!;
  }

  async getCertificate(userId: string, trainingId: string) {
    return this.db.query.courseCertificates.findFirst({
      where: and(eq(courseCertificates.trainingId, trainingId), eq(courseCertificates.userId, userId)),
    }) ?? null;
  }

  async verifyCertificate(code: string) {
    const cert = await this.db.query.courseCertificates.findFirst({
      where: eq(courseCertificates.certificateCode, code),
    });
    if (!cert) throw new NotFoundException('Sertifika bulunamadı veya geçersiz.');

    const [training] = await this.db.select({ title: trainings.title, slug: trainings.slug }).from(trainings).where(eq(trainings.id, cert.trainingId)).limit(1);
    const profile = await this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, cert.userId), columns: { displayName: true } });

    return { ...cert, trainingTitle: training?.title ?? '', trainingSlug: training?.slug ?? '', holderName: profile?.displayName ?? '' };
  }

  async getMyCertificates(userId: string) {
    return this.db
      .select({
        id: courseCertificates.id,
        certificateCode: courseCertificates.certificateCode,
        issuedAt: courseCertificates.issuedAt,
        quizScore: courseCertificates.quizScore,
        trainingTitle: trainings.title,
        trainingSlug: trainings.slug,
      })
      .from(courseCertificates)
      .innerJoin(trainings, eq(trainings.id, courseCertificates.trainingId))
      .where(eq(courseCertificates.userId, userId))
      .orderBy(desc(courseCertificates.issuedAt));
  }

  // ─── Exam Resources ───────────────────────────────────────────────────────────

  async listExamResources(examKey?: string, resourceType?: string) {
    const conditions = [eq(examResources.isPublished, true)];
    if (examKey) conditions.push(eq(examResources.examKey, examKey));
    if (resourceType) conditions.push(eq(examResources.resourceType, resourceType));
    const rows = await this.db
      .select()
      .from(examResources)
      .where(and(...conditions))
      .orderBy(asc(examResources.sortOrder), asc(examResources.createdAt));
    if (examKey) {
      void this.db
        .update(examResources)
        .set({ viewCount: sql`${examResources.viewCount} + 1` })
        .where(and(eq(examResources.examKey, examKey), eq(examResources.isPublished, true)))
        .catch(() => {});
    }
    return rows;
  }

  async listAllExamResources(examKey?: string, resourceType?: string) {
    const conditions = [];
    if (examKey) conditions.push(eq(examResources.examKey, examKey));
    if (resourceType) conditions.push(eq(examResources.resourceType, resourceType));
    return this.db
      .select()
      .from(examResources)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(examResources.examKey), asc(examResources.sortOrder));
  }

  async createExamResource(dto: {
    examKey: string; resourceType: string; title: string;
    content?: string; resourceUrl?: string; eventDate?: string;
    isPublished?: boolean; sortOrder?: number;
  }) {
    const [row] = await this.db.insert(examResources).values({
      examKey: dto.examKey,
      resourceType: dto.resourceType,
      title: dto.title,
      ...(dto.content ? { content: dto.content } : {}),
      ...(dto.resourceUrl ? { resourceUrl: dto.resourceUrl } : {}),
      ...(dto.eventDate ? { eventDate: new Date(dto.eventDate) } : {}),
      isPublished: dto.isPublished ?? true,
      sortOrder: dto.sortOrder ?? 0,
    }).returning();
    return row;
  }

  async updateExamResource(id: string, dto: Partial<{
    examKey: string; resourceType: string; title: string;
    content: string; resourceUrl: string; eventDate: string;
    isPublished: boolean; sortOrder: number;
  }>) {
    const [row] = await this.db.update(examResources).set({
      ...(dto.examKey !== undefined ? { examKey: dto.examKey } : {}),
      ...(dto.resourceType !== undefined ? { resourceType: dto.resourceType } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.content !== undefined ? { content: dto.content } : {}),
      ...(dto.resourceUrl !== undefined ? { resourceUrl: dto.resourceUrl } : {}),
      ...(dto.eventDate !== undefined ? { eventDate: new Date(dto.eventDate) } : {}),
      ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      updatedAt: new Date(),
    }).where(eq(examResources.id, id)).returning();
    if (!row) throw new NotFoundException('Kaynak bulunamadı');
    return row;
  }

  async deleteExamResource(id: string) {
    await this.db.delete(examResources).where(eq(examResources.id, id));
    return { deleted: true };
  }

  // ─── Site Settings ────────────────────────────────────────────────────────────

  async getSetting(key: string): Promise<Record<string, unknown> | null> {
    const [row] = await this.db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);
    if (!row) return null;
    try {
      return JSON.parse(row.value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  // ─── Member City Distribution ─────────────────────────────────────────────────

  async getMemberCityStats(): Promise<{ city: string; count: number }[]> {
    const rows = await this.db
      .select({ city: userProfiles.city, count: count() })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(isNotNull(userProfiles.city), ne(userProfiles.city, '')))
      .groupBy(userProfiles.city)
      .orderBy(desc(count()));

    return rows
      .filter((r) => r.city !== null)
      .map((r) => ({ city: r.city!, count: Number(r.count) }));
  }

  async upsertSetting(key: string, value: Record<string, unknown>, updatedById: string) {
    const serialized = JSON.stringify(value);
    await this.db
      .insert(siteSettings)
      .values({ key, value: serialized, label: key, updatedBy: updatedById })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: serialized, updatedBy: updatedById, updatedAt: new Date() },
      });
    return { ok: true };
  }

  // ─── Talents ──────────────────────────────────────────────────────────────────

  async listTalents(opts: { approvedOnly?: boolean; category?: string } = {}) {
    const conditions = [];
    if (opts.approvedOnly) {
      conditions.push(eq(talents.status, 'approved'));
      conditions.push(eq(talents.isPublished, true));
    }
    if (opts.category) conditions.push(eq(talents.category, opts.category));

    return this.db
      .select()
      .from(talents)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(talents.createdAt));
  }

  async getTalent(id: string) {
    const [row] = await this.db.select().from(talents).where(eq(talents.id, id)).limit(1);
    if (!row) throw new NotFoundException('Yetenek bulunamadı');
    return row;
  }

  async createTalent(dto: CreateTalentDto, userId: string, membershipTier: string) {
    if (membershipTier === 'corporate_member') {
      throw new ForbiddenException('Kurumsal üyeler yetenek paylaşamaz.');
    }
    const [created] = await this.db
      .insert(talents)
      .values({
        userId,
        displayName: dto.displayName,
        category: dto.category,
        title: dto.title,
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.mediaUrl ? { mediaUrl: dto.mediaUrl } : {}),
        status: 'pending',
        isPublished: false,
      })
      .returning();
    return created;
  }

  async adminCreateTalent(dto: import('./dto/cms.dto').AdminCreateTalentDto) {
    const [created] = await this.db
      .insert(talents)
      .values({
        displayName: dto.displayName,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        mediaUrl: dto.mediaUrl,
        status: dto.status ?? 'approved',
        isPublished: dto.isPublished ?? false,
        adminNotes: dto.adminNotes,
      })
      .returning();
    return created;
  }

  async adminUpdateTalent(id: string, dto: AdminUpdateTalentDto) {
    const [updated] = await this.db
      .update(talents)
      .set({
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.mediaUrl !== undefined ? { mediaUrl: dto.mediaUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(talents.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Yetenek bulunamadı');
    return updated;
  }

  async deleteTalent(id: string) {
    const [deleted] = await this.db.delete(talents).where(eq(talents.id, id)).returning({ id: talents.id });
    if (!deleted) throw new NotFoundException('Yetenek bulunamadı');
    return { deleted: true };
  }

  // ─── Ders Q&A ─────────────────────────────────────────────────────────────────

  async getLessonQuestions(lessonId: string) {
    const rows = await this.db
      .select({
        id: lessonQuestions.id,
        question: lessonQuestions.question,
        answer: lessonQuestions.answer,
        answeredAt: lessonQuestions.answeredAt,
        createdAt: lessonQuestions.createdAt,
        askerName: userProfiles.displayName,
        askerAvatar: userProfiles.avatarUrl,
      })
      .from(lessonQuestions)
      .innerJoin(userProfiles, eq(userProfiles.userId, lessonQuestions.userId))
      .where(and(eq(lessonQuestions.lessonId, lessonId), eq(lessonQuestions.isPublished, true)))
      .orderBy(desc(lessonQuestions.createdAt))
      .limit(50);
    return rows;
  }

  async askLessonQuestion(userId: string, lessonId: string, question: string) {
    const [lesson] = await this.db.select({ trainingId: courseLessons.trainingId }).from(courseLessons).where(eq(courseLessons.id, lessonId)).limit(1);
    if (!lesson) throw new NotFoundException('Ders bulunamadı');
    const [row] = await this.db.insert(lessonQuestions).values({
      lessonId, trainingId: lesson.trainingId, userId, question,
    }).returning();
    return row!;
  }

  async answerLessonQuestion(questionId: string, answerText: string, answeredByUserId: string) {
    const [row] = await this.db.update(lessonQuestions)
      .set({ answer: answerText, answeredAt: new Date(), answeredByUserId })
      .where(eq(lessonQuestions.id, questionId))
      .returning();
    if (!row) throw new NotFoundException('Soru bulunamadı');
    return row;
  }

  async deleteLessonQuestion(questionId: string) {
    await this.db.delete(lessonQuestions).where(eq(lessonQuestions.id, questionId));
    return { deleted: true };
  }

  // ─── Kurs Duyuruları ──────────────────────────────────────────────────────────

  async getCourseAnnouncements(trainingId: string) {
    return this.db
      .select()
      .from(courseAnnouncements)
      .where(eq(courseAnnouncements.trainingId, trainingId))
      .orderBy(desc(courseAnnouncements.createdAt));
  }

  async createCourseAnnouncement(trainingId: string, title: string, body: string) {
    const [announcement] = await this.db.insert(courseAnnouncements).values({ trainingId, title, body }).returning();

    // Kayıtlı öğrencilere e-posta gönder
    void (async () => {
      try {
        const [training] = await this.db.select({ title: trainings.title, slug: trainings.slug }).from(trainings).where(eq(trainings.id, trainingId)).limit(1);
        if (!training) return;
        const enrolled = await this.db
          .select({ userId: courseEnrollments.userId })
          .from(courseEnrollments)
          .where(eq(courseEnrollments.trainingId, trainingId));
        const courseUrl = `${SAHNE_URL}/egitim/${training.slug}`;
        for (const { userId } of enrolled) {
          const [userRow] = await this.db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
          const profile = await this.db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId), columns: { displayName: true } });
          if (userRow) {
            await this.emailService.sendCourseAnnouncement(userRow.email, profile?.displayName ?? 'Değerli Üye', training.title, title, body, courseUrl).catch(() => {});
          }
        }
      } catch {}
    })();

    return announcement!;
  }

  async deleteCourseAnnouncement(id: string) {
    await this.db.delete(courseAnnouncements).where(eq(courseAnnouncements.id, id));
    return { deleted: true };
  }

  // ─── Kurs Ödemeleri ───────────────────────────────────────────────────────────

  async requestCoursePayment(userId: string, trainingId: string, paymentRef?: string) {
    const training = await this.db.query.trainings.findFirst({ where: eq(trainings.id, trainingId) });
    if (!training) throw new NotFoundException('Kurs bulunamadı');
    if (!training.price) throw new BadRequestException('Bu kurs ücretsizdir, kayıt olmak için enroll kullanın.');

    // Zaten kayıtlı mı?
    const existing = await this.db.query.courseEnrollments.findFirst({
      where: and(eq(courseEnrollments.trainingId, trainingId), eq(courseEnrollments.userId, userId)),
    });
    if (existing) return { alreadyEnrolled: true };

    // Bekleyen ödeme talebi var mı?
    const pendingPayment = await this.db.query.coursePayments.findFirst({
      where: and(eq(coursePayments.trainingId, trainingId), eq(coursePayments.userId, userId), eq(coursePayments.status, 'pending')),
    });
    if (pendingPayment) return { paymentId: pendingPayment.id, status: 'pending', alreadyRequested: true };

    const [payment] = await this.db.insert(coursePayments).values({
      trainingId, userId, amount: training.price, paymentRef: paymentRef ?? null, status: 'pending',
    }).returning();
    return { paymentId: payment!.id, status: 'pending', amount: training.price };
  }

  async getMyPayments(userId: string) {
    return this.db
      .select({
        id: coursePayments.id,
        amount: coursePayments.amount,
        status: coursePayments.status,
        paymentRef: coursePayments.paymentRef,
        adminNote: coursePayments.adminNote,
        createdAt: coursePayments.createdAt,
        confirmedAt: coursePayments.confirmedAt,
        trainingTitle: trainings.title,
        trainingSlug: trainings.slug,
      })
      .from(coursePayments)
      .innerJoin(trainings, eq(trainings.id, coursePayments.trainingId))
      .where(eq(coursePayments.userId, userId))
      .orderBy(desc(coursePayments.createdAt));
  }

  async listPendingPayments() {
    return this.db
      .select({
        id: coursePayments.id,
        amount: coursePayments.amount,
        status: coursePayments.status,
        paymentRef: coursePayments.paymentRef,
        adminNote: coursePayments.adminNote,
        createdAt: coursePayments.createdAt,
        trainingId: coursePayments.trainingId,
        trainingTitle: trainings.title,
        userId: coursePayments.userId,
        displayName: userProfiles.displayName,
        email: users.email,
      })
      .from(coursePayments)
      .innerJoin(trainings, eq(trainings.id, coursePayments.trainingId))
      .innerJoin(users, eq(users.id, coursePayments.userId))
      .leftJoin(userProfiles, eq(userProfiles.userId, coursePayments.userId))
      .orderBy(desc(coursePayments.createdAt));
  }

  async confirmPayment(paymentId: string, adminNote?: string) {
    const [payment] = await this.db.update(coursePayments)
      .set({ status: 'confirmed', adminNote: adminNote ?? null, confirmedAt: new Date() })
      .where(eq(coursePayments.id, paymentId))
      .returning();
    if (!payment) throw new NotFoundException('Ödeme bulunamadı');

    // Otomatik kayıt
    await this.enrollCourse(payment.userId, payment.trainingId).catch(() => {});

    // Email bildirimi (arka planda)
    void this.sendPaymentStatusEmail(payment.userId, payment.trainingId, 'confirmed', adminNote).catch(() => {});

    return { confirmed: true };
  }

  async rejectPayment(paymentId: string, adminNote?: string) {
    const [payment] = await this.db.update(coursePayments)
      .set({ status: 'rejected', adminNote: adminNote ?? null })
      .where(eq(coursePayments.id, paymentId))
      .returning();
    if (!payment) throw new NotFoundException('Ödeme bulunamadı');

    // Email bildirimi (arka planda)
    void this.sendPaymentStatusEmail(payment.userId, payment.trainingId, 'rejected', adminNote).catch(() => {});

    return { rejected: true };
  }

  private async sendPaymentStatusEmail(userId: string, trainingId: string, status: 'confirmed' | 'rejected', adminNote?: string) {
    const [user] = await this.db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    const [profile] = await this.db.select({ displayName: userProfiles.displayName }).from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    const [training] = await this.db.select({ title: trainings.title, slug: trainings.slug }).from(trainings).where(eq(trainings.id, trainingId)).limit(1);
    if (!user?.email || !training) return;

    const displayName = profile?.displayName ?? 'Değerli Üye';
    const courseUrl = `${process.env['MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org'}/egitim/${training.slug}`;

    if (status === 'confirmed') {
      await this.emailService.send(
        user.email,
        'course_payment_confirmed',
        { displayName, trainingTitle: training.title, courseUrl, ...(adminNote ? { adminNote } : {}) },
        { jobId: `course_pay_confirmed:${userId}:${trainingId}` },
      );
      this.logger.log(`course_payment_confirmed_email userId=${userId} trainingId=${trainingId}`);
    } else {
      await this.emailService.send(
        user.email,
        'course_payment_rejected',
        { displayName, trainingTitle: training.title, ...(adminNote ? { adminNote } : {}) },
        { jobId: `course_pay_rejected:${userId}:${trainingId}` },
      );
      this.logger.log(`course_payment_rejected_email userId=${userId} trainingId=${trainingId}`);
    }
  }

  // ─── Detaylı Ders Analitik ────────────────────────────────────────────────────

  async getLessonAnalytics(trainingId: string) {
    const sections = await this.db
      .select({
        sectionId: courseSections.id,
        sectionTitle: courseSections.title,
        sectionOrder: courseSections.sortOrder,
      })
      .from(courseSections)
      .where(eq(courseSections.trainingId, trainingId))
      .orderBy(asc(courseSections.sortOrder));

    const lessons = await this.db
      .select({
        id: courseLessons.id,
        title: courseLessons.title,
        sectionId: courseLessons.sectionId,
        contentType: courseLessons.contentType,
        viewCount: courseLessons.viewCount,
        durationMinutes: courseLessons.durationMinutes,
        sortOrder: courseLessons.sortOrder,
        completionCount: sql<number>`COUNT(${lessonProgress.id})::int`,
      })
      .from(courseLessons)
      .leftJoin(lessonProgress, eq(lessonProgress.lessonId, courseLessons.id))
      .where(eq(courseLessons.trainingId, trainingId))
      .groupBy(courseLessons.id)
      .orderBy(asc(courseLessons.sortOrder));

    const [enrollStat] = await this.db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.trainingId, trainingId));
    const totalEnrolled = Number(enrollStat?.total ?? 0);

    const sectionMap = new Map(sections.map(s => [s.sectionId, { ...s, lessons: [] as typeof lessons }]));
    for (const lesson of lessons) {
      const section = sectionMap.get(lesson.sectionId);
      if (section) {
        (section.lessons as typeof lessons).push({
          ...lesson,
          completionRate: totalEnrolled > 0 ? Math.round((Number(lesson.completionCount) / totalEnrolled) * 100) : 0,
        } as typeof lesson);
      }
    }

    return { totalEnrolled, sections: [...sectionMap.values()] };
  }

  // ─── Rozet Sistemi ────────────────────────────────────────────────────────────

  static readonly BADGE_DEFS = [
    { code: 'first-enrollment', name: 'İlk Adım', emoji: '🚀', description: 'İlk kursuna kaydoldun!' },
    { code: 'first-completion', name: 'Kurs Bitirici', emoji: '🎓', description: 'İlk kursunu tamamladın!' },
    { code: 'quiz-ace', name: 'Deha', emoji: '🧠', description: "Quiz'de %90 veya üstü aldın!" },
    { code: 'triple-crown', name: 'Üçlü Taç', emoji: '👑', description: '3 kurs tamamladın!' },
    { code: 'certified', name: 'Sertifika Sahibi', emoji: '🏆', description: 'İlk sertifikanı aldın!' },
  ] as const;

  private async awardBadgeIfNew(userId: string, badgeCode: string, metadata?: Record<string, unknown>) {
    await this.db.insert(userCourseBadges)
      .values({ userId, badgeCode, metadata: metadata ?? null })
      .onConflictDoNothing()
      .catch(() => {});
  }

  private async checkFirstEnrollmentBadge(userId: string) {
    const [row] = await this.db
      .select({ c: sql<number>`COUNT(*)` })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, userId));
    if (Number(row?.c) === 1) {
      await this.awardBadgeIfNew(userId, 'first-enrollment');
    }
  }

  private async checkCompletionBadges(userId: string) {
    const [row] = await this.db
      .select({ c: sql<number>`COUNT(*)` })
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.userId, userId), isNotNull(courseEnrollments.completedAt)));
    const n = Number(row?.c ?? 0);
    if (n >= 1) await this.awardBadgeIfNew(userId, 'first-completion');
    if (n >= 3) await this.awardBadgeIfNew(userId, 'triple-crown');
  }

  async getUserBadges(userId: string) {
    const rows = await this.db
      .select()
      .from(userCourseBadges)
      .where(eq(userCourseBadges.userId, userId))
      .orderBy(asc(userCourseBadges.awardedAt));

    return rows.map(r => {
      const def = CmsService.BADGE_DEFS.find(d => d.code === r.badgeCode);
      return {
        code: r.badgeCode,
        name: def?.name ?? r.badgeCode,
        emoji: def?.emoji ?? '🏅',
        description: def?.description ?? '',
        awardedAt: r.awardedAt,
        metadata: r.metadata,
      };
    });
  }

  // ─── XP & Rank ───────────────────────────────────────────────────────────────

  static readonly RANKS = [
    { label: 'Aday',        emoji: '🌱', minXp: 0    },
    { label: 'Başlangıç',   emoji: '📖', minXp: 50   },
    { label: 'Öğrenci',     emoji: '✏️', minXp: 150  },
    { label: 'Araştırmacı', emoji: '🔭', minXp: 350  },
    { label: 'Pratisyen',   emoji: '⚙️', minXp: 700  },
    { label: 'Uzman',       emoji: '🎯', minXp: 1200 },
    { label: 'Üstat',       emoji: '🏛️', minXp: 2000 },
  ] as const;

  static getRank(xp: number) {
    type R = { label: string; emoji: string; minXp: number };
    const ranks = CmsService.RANKS as unknown as R[];
    let current: R = ranks[0]!;
    for (const rank of ranks) { if (xp >= rank.minXp) current = rank; }
    const nextIdx = ranks.findIndex(r => r.label === current.label) + 1;
    const next: R | null = ranks[nextIdx] ?? null;
    const pct = next ? Math.min(100, Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100)) : 100;
    return { current, next, xp, pct };
  }

  async getPublicLearnerStats(userId: string) {
    const xpData = await this.getMyXp(userId);
    const [completedRow] = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.userId, userId), isNotNull(courseEnrollments.completedAt)));
    const [enrollRow] = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, userId));
    const badges = await this.getUserBadges(userId);
    return {
      xp: xpData.xp,
      rank: xpData.current,
      nextRank: xpData.next,
      pct: xpData.pct,
      completedCourses: Number(completedRow?.count ?? 0),
      totalEnrollments: Number(enrollRow?.count ?? 0),
      badgeCount: badges.length,
    };
  }

  async getMyXp(userId: string) {
    // Ders XP: her tamamlanan dersin xpReward değeri toplanır
    const lessonRows = await this.db
      .select({ xp: sql<number>`COALESCE(SUM(${courseLessons.xpReward}), 0)::int` })
      .from(lessonProgress)
      .innerJoin(courseLessons, eq(courseLessons.id, lessonProgress.lessonId))
      .where(eq(lessonProgress.userId, userId));
    const lessonXp = Number(lessonRows[0]?.xp ?? 0);

    // Quiz XP: passed quizzes — ace (≥90%) = 50, normal = 25
    const quizPasses = await this.db
      .select({ quizId: quizAttempts.quizId, best: sql<number>`MAX(${quizAttempts.score})::int` })
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.passed, true)))
      .groupBy(quizAttempts.quizId);
    const quizXp = quizPasses.reduce((s, q) => s + (Number(q.best) >= 90 ? 50 : 25), 0);

    const totalXp = lessonXp + quizXp;
    return { ...CmsService.getRank(totalXp), lessonXp, quizXp };
  }

  async getXpLeaderboard(limit = 20) {
    // Tüm kullanıcılar için XP hesapla: ders XP + quiz XP
    const lessonRows = await this.db
      .select({
        userId: lessonProgress.userId,
        lessonXp: sql<number>`COALESCE(SUM(${courseLessons.xpReward}), 0)::int`,
      })
      .from(lessonProgress)
      .innerJoin(courseLessons, eq(courseLessons.id, lessonProgress.lessonId))
      .groupBy(lessonProgress.userId);

    const quizRows = await this.db
      .select({
        userId: quizAttempts.userId,
        quizXp: sql<number>`COALESCE(SUM(CASE WHEN MAX(score) >= 90 THEN 50 ELSE 25 END), 0)::int`,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.passed, true))
      .groupBy(quizAttempts.userId, quizAttempts.quizId);

    // Kullanıcı başına toplam XP hesapla
    const lessonMap = new Map(lessonRows.map(r => [r.userId, Number(r.lessonXp)]));
    const quizMap = new Map<string, number>();
    for (const r of quizRows) {
      quizMap.set(r.userId, (quizMap.get(r.userId) ?? 0) + Number(r.quizXp));
    }
    const allUserIds = [...new Set([...lessonMap.keys(), ...quizMap.keys()])];
    const xpByUser = allUserIds.map(userId => ({
      userId,
      totalXp: (lessonMap.get(userId) ?? 0) + (quizMap.get(userId) ?? 0),
    })).sort((a, b) => b.totalXp - a.totalXp).slice(0, limit);

    if (xpByUser.length === 0) return [];

    const profiles = await this.db
      .select({ userId: userProfiles.userId, displayName: userProfiles.displayName, avatarUrl: userProfiles.avatarUrl })
      .from(userProfiles)
      .where(sql`${userProfiles.userId} = ANY(${xpByUser.map(u => u.userId)})`);
    const profileMap = new Map(profiles.map(p => [p.userId, p]));

    return xpByUser.map((u, i) => {
      const rank = CmsService.getRank(u.totalXp);
      const profile = profileMap.get(u.userId);
      return {
        position: i + 1,
        userId: u.userId,
        displayName: profile?.displayName ?? 'Üye',
        avatarUrl: profile?.avatarUrl ?? null,
        totalXp: u.totalXp,
        rank: rank.current,
      };
    });
  }

  // ─── Leaderboard ──────────────────────────────────────────────────────────────

  async getTrainingLeaderboard(limit = 10) {
    const rows = await this.db
      .select({
        userId: courseEnrollments.userId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        completedCount: sql<number>`COUNT(CASE WHEN ${courseEnrollments.completedAt} IS NOT NULL THEN 1 END)::int`,
        totalEnrollments: sql<number>`COUNT(*)::int`,
        avgProgress: sql<number>`ROUND(AVG(${courseEnrollments.progressPct}))::int`,
      })
      .from(courseEnrollments)
      .innerJoin(userProfiles, eq(userProfiles.userId, courseEnrollments.userId))
      .groupBy(courseEnrollments.userId, userProfiles.displayName, userProfiles.avatarUrl)
      .orderBy(
        desc(sql`COUNT(CASE WHEN ${courseEnrollments.completedAt} IS NOT NULL THEN 1 END)`),
        desc(sql`AVG(${courseEnrollments.progressPct})`),
      )
      .limit(limit);

    return rows.map((r, i) => ({ rank: i + 1, ...r }));
  }

  // ─── Admin Training Analytics ─────────────────────────────────────────────────

  async getTrainingAnalytics(since?: Date) {
    const enrollWhere = since ? sql`${courseEnrollments.enrolledAt} >= ${since}` : undefined;
    const quizWhere   = since ? sql`${quizAttempts.completedAt} >= ${since}` : undefined;
    const certWhere   = since ? sql`${courseCertificates.issuedAt} >= ${since}` : undefined;

    const [enrollStat] = await this.db
      .select({
        total: sql<number>`COUNT(*)::int`,
        completed: sql<number>`COUNT(${courseEnrollments.completedAt})::int`,
        avgProgress: sql<number>`ROUND(AVG(${courseEnrollments.progressPct}))::int`,
      })
      .from(courseEnrollments)
      .where(enrollWhere);

    const [quizStat] = await this.db
      .select({
        total: sql<number>`COUNT(*)::int`,
        passed: sql<number>`COUNT(CASE WHEN ${quizAttempts.passed} THEN 1 END)::int`,
        avgScore: sql<number>`ROUND(AVG(${quizAttempts.score}))::int`,
      })
      .from(quizAttempts)
      .where(quizWhere);

    const [certStat] = await this.db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(courseCertificates)
      .where(certWhere);

    const topCourses = await this.db
      .select({
        id: trainings.id,
        title: trainings.title,
        slug: trainings.slug,
        enrollmentCount: trainings.enrollmentCount,
        level: trainings.level,
        format: trainings.format,
      })
      .from(trainings)
      .where(eq(trainings.isPublished, true))
      .orderBy(desc(trainings.enrollmentCount))
      .limit(5);

    const totalEnrollments = Number(enrollStat?.total ?? 0);
    const completedCount = Number(enrollStat?.completed ?? 0);
    const totalAttempts = Number(quizStat?.total ?? 0);
    const passedCount = Number(quizStat?.passed ?? 0);

    return {
      totalEnrollments,
      completedCount,
      completionRate: totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0,
      avgProgress: Number(enrollStat?.avgProgress ?? 0),
      quizAttempts: totalAttempts,
      quizPassRate: totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0,
      avgQuizScore: Number(quizStat?.avgScore ?? 0),
      totalCertificates: Number(certStat?.total ?? 0),
      topCourses,
    };
  }

  // ─── Project Interactions (like / favorite / comments) ───────────────────────

  async toggleProjectLike(userId: string, slug: string) {
    const [project] = await this.db.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublished, true))).limit(1);
    if (!project) throw new NotFoundException('Proje bulunamadı');

    const [existing] = await this.db.select().from(projectLikes)
      .where(and(eq(projectLikes.projectId, project.id), eq(projectLikes.userId, userId))).limit(1);

    if (existing) {
      await this.db.delete(projectLikes)
        .where(and(eq(projectLikes.projectId, project.id), eq(projectLikes.userId, userId)));
      return { liked: false };
    }
    await this.db.insert(projectLikes).values({ projectId: project.id, userId });
    return { liked: true };
  }

  async toggleProjectFavorite(userId: string, slug: string) {
    const [project] = await this.db.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublished, true))).limit(1);
    if (!project) throw new NotFoundException('Proje bulunamadı');

    const [existing] = await this.db.select().from(projectFavorites)
      .where(and(eq(projectFavorites.projectId, project.id), eq(projectFavorites.userId, userId))).limit(1);

    if (existing) {
      await this.db.delete(projectFavorites)
        .where(and(eq(projectFavorites.projectId, project.id), eq(projectFavorites.userId, userId)));
      return { favorited: false };
    }
    await this.db.insert(projectFavorites).values({ projectId: project.id, userId });
    return { favorited: true };
  }

  async getProjectInteractions(slug: string, userId?: string) {
    const [project] = await this.db.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublished, true))).limit(1);
    if (!project) throw new NotFoundException('Proje bulunamadı');

    const [likeCount] = await this.db.select({ count: count() }).from(projectLikes)
      .where(eq(projectLikes.projectId, project.id));
    const [favCount] = await this.db.select({ count: count() }).from(projectFavorites)
      .where(eq(projectFavorites.projectId, project.id));
    const [commentCount] = await this.db.select({ count: count() }).from(projectComments)
      .where(and(eq(projectComments.projectId, project.id), eq(projectComments.emailVerified, true)));

    let liked = false;
    let favorited = false;
    if (userId) {
      const [l] = await this.db.select({ id: projectLikes.id }).from(projectLikes)
        .where(and(eq(projectLikes.projectId, project.id), eq(projectLikes.userId, userId))).limit(1);
      const [f] = await this.db.select({ id: projectFavorites.id }).from(projectFavorites)
        .where(and(eq(projectFavorites.projectId, project.id), eq(projectFavorites.userId, userId))).limit(1);
      liked = !!l;
      favorited = !!f;
    }

    return {
      likeCount: Number(likeCount?.count ?? 0),
      favoriteCount: Number(favCount?.count ?? 0),
      commentCount: Number(commentCount?.count ?? 0),
      liked,
      favorited,
    };
  }

  async listProjectComments(slug: string) {
    const [project] = await this.db.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublished, true))).limit(1);
    if (!project) throw new NotFoundException('Proje bulunamadı');

    return this.db.select({
      id: projectComments.id,
      firstName: projectComments.firstName,
      lastName: projectComments.lastName,
      body: projectComments.body,
      createdAt: projectComments.createdAt,
    }).from(projectComments)
      .where(and(eq(projectComments.projectId, project.id), eq(projectComments.emailVerified, true)))
      .orderBy(desc(projectComments.createdAt));
  }

  async submitProjectComment(slug: string, dto: { firstName: string; lastName: string; email: string; body: string }) {
    const [project] = await this.db.select({ id: projects.id, title: projects.title }).from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.isPublished, true))).limit(1);
    if (!project) throw new NotFoundException('Proje bulunamadı');

    const token = randomUUID();
    await this.db.insert(projectComments).values({
      projectId: project.id,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.toLowerCase().trim(),
      body: dto.body.trim(),
      verificationToken: token,
    });

    const verifyUrl = `${SAHNE_URL}/api/comments/verify?token=${token}`;
    await this.emailService.send(
      dto.email,
      'comment_verify',
      { firstName: dto.firstName, projectTitle: project.title, verifyUrl },
    ).catch(() => {});

    return { message: 'Doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol edin.' };
  }

  async verifyProjectComment(token: string) {
    const [comment] = await this.db.select().from(projectComments)
      .where(eq(projectComments.verificationToken, token)).limit(1);
    if (!comment) throw new NotFoundException('Geçersiz veya süresi dolmuş token.');
    if (comment.emailVerified) return { message: 'Yorum zaten doğrulanmış.' };

    await this.db.update(projectComments)
      .set({ emailVerified: true, verifiedAt: new Date() })
      .where(eq(projectComments.id, comment.id));

    return { message: 'Yorumunuz başarıyla doğrulandı ve yayınlandı.' };
  }

  async bulkUpdateLinkedinViews(items: Array<{
    id: string;
    linkedinViewCount: number;
    linkedinClickCount?: number;
    linkedinLikeCount?: number;
    linkedinCommentCount?: number;
    linkedinPostUrl?: string;
  }>) {
    let updated = 0;
    for (const item of items) {
      await this.db.update(projects)
        .set({
          linkedinViewCount: item.linkedinViewCount,
          ...(item.linkedinClickCount !== undefined && { linkedinClickCount: item.linkedinClickCount }),
          ...(item.linkedinLikeCount !== undefined && { linkedinLikeCount: item.linkedinLikeCount }),
          ...(item.linkedinCommentCount !== undefined && { linkedinCommentCount: item.linkedinCommentCount }),
          ...(item.linkedinPostUrl !== undefined && { linkedinPostUrl: item.linkedinPostUrl }),
        })
        .where(eq(projects.id, item.id));
      updated++;
    }
    return { updated };
  }
}
