import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, gt, gte, lte, sql, desc } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  availabilitySlots,
  interviewRequests,
  applications,
  userProfiles,
  mentorshipRequests,
} from '@haritailesi/database';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../auth/auth.types';
import type { CreateSlotDto, CreateInterviewRequestDto, ConfirmInterviewDto } from './dto/scheduling.dto';

const TOKEN_TTL_DAYS = 7;

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Admin: Slot Oluştur ─────────────────────────────────────────────────────

  async createSlot(dto: CreateSlotDto, actor: RequestUser) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (endAt <= startAt) {
      throw new BadRequestException('Bitiş zamanı başlangıçtan sonra olmalı.');
    }

    const [slot] = await this.db
      .insert(availabilitySlots)
      .values({
        adminId: actor.id,
        startAt,
        endAt,
        slotType: dto.slotType ?? 'membership',
        capacity: dto.capacity ?? 1,
        notes: dto.notes ?? null,
      })
      .returning();

    return slot;
  }

  // ─── Admin: Slot Listele ─────────────────────────────────────────────────────

  async listSlots(params: {
    slotType?: 'membership' | 'mentorship';
    onlyAvailable?: boolean;
    from?: string;
    to?: string;
    adminId?: string;
  }) {
    const conditions: ReturnType<typeof eq>[] = [];

    if (params.slotType) conditions.push(eq(availabilitySlots.slotType, params.slotType));
    if (params.adminId) conditions.push(eq(availabilitySlots.adminId, params.adminId));
    if (params.from) conditions.push(gte(availabilitySlots.startAt, new Date(params.from)));
    if (params.to) conditions.push(lte(availabilitySlots.startAt, new Date(params.to)));
    if (params.onlyAvailable) {
      conditions.push(sql`${availabilitySlots.bookedCount} < ${availabilitySlots.capacity}`);
    }

    return this.db.query.availabilitySlots.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [availabilitySlots.startAt],
      with: {
        admin: {
          columns: { id: true },
          with: { profile: { columns: { displayName: true } } },
        },
      },
    });
  }

  // ─── Admin: Slot Sil ─────────────────────────────────────────────────────────

  async deleteSlot(id: string, actor: RequestUser): Promise<void> {
    const slot = await this.db.query.availabilitySlots.findFirst({
      where: eq(availabilitySlots.id, id),
    });
    if (!slot) throw new NotFoundException('Slot bulunamadı.');
    if (slot.bookedCount > 0) {
      throw new BadRequestException('Rezerve edilmiş slot silinemez. Önce görüşme talebini iptal edin.');
    }
    if (slot.adminId !== actor.id) {
      throw new ForbiddenException('Yalnızca kendi slotlarınızı silebilirsiniz.');
    }
    await this.db.delete(availabilitySlots).where(eq(availabilitySlots.id, id));
  }

  // ─── Admin: Başvuru için Görüşme Talebi Oluştur ──────────────────────────────

  async createInterviewRequest(
    applicationId: string,
    dto: CreateInterviewRequestDto,
    actor: RequestUser,
  ) {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    if (!['interview_needed', 'under_review'].includes(app.state)) {
      throw new BadRequestException('Bu aşamada görüşme talebi oluşturulamaz.');
    }

    // Slot seçilmişse doğrula; seçilmemişse Calendly modu (aday seçer)
    let slot: typeof availabilitySlots.$inferSelect | undefined;
    if (dto.slotId) {
      slot = await this.db.query.availabilitySlots.findFirst({
        where: eq(availabilitySlots.id, dto.slotId),
      });
      if (!slot) throw new NotFoundException('Slot bulunamadı.');
      if (slot.bookedCount >= slot.capacity) throw new BadRequestException('Seçilen slot dolu.');
      if (slot.slotType !== 'membership') throw new BadRequestException('Üyelik görüşmesi için membership slotu seçin.');
    }

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + TOKEN_TTL_DAYS);

    const [request] = await this.db
      .insert(interviewRequests)
      .values({
        slotId: slot?.id ?? null,
        applicationId,
        referenceType: 'membership',
        meetUrl: dto.meetUrl ?? null,
        tokenExpiresAt,
        createdByAdminId: actor.id,
      })
      .returning();

    if (!request) throw new Error('Interview request oluşturulamadı.');

    // Slot varsa rezerve et
    if (slot) {
      await this.db
        .update(availabilitySlots)
        .set({ bookedCount: slot.bookedCount + 1 })
        .where(eq(availabilitySlots.id, slot.id));
    }

    const adminProfile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, actor.id),
      columns: { displayName: true },
    });

    const webUrl = process.env['SAHNE_URL'] ?? process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';
    const applicantName = this.extractNameFromApplication(app.formData as Record<string, unknown>);
    const adminName = adminProfile?.displayName ?? 'Haritailesi Ekibi';

    if (slot) {
      // Önerilen saat modu — aday onaylar veya erteler
      const confirmUrl = `${webUrl}/gorusme-onayla?token=${request.confirmToken}`;
      const cancelUrl = `${webUrl}/gorusme-onayla?token=${request.confirmToken}&action=reschedule`;
      await this.emailService.sendInterviewInvitation(
        app.applicantEmail, applicantName, adminName, confirmUrl, cancelUrl,
      );
      this.logger.log(`interview_request_created id=${request.id} app=${applicationId} slot=${slot.id}`);
      return { ...request, confirmUrl };
    } else {
      // Calendly modu — aday kendi saatini seçer
      const slotPickerUrl = `${webUrl}/gorusme-takvim?token=${request.confirmToken}`;
      await this.emailService.send(app.applicantEmail, 'application_interview_invitation', {
        displayName: applicantName,
        adminName,
        slotPickerUrl,
        confirmUrl: '',
        cancelUrl: '',
      });
      this.logger.log(`interview_request_created (calendly) id=${request.id} app=${applicationId}`);
      return { ...request, slotPickerUrl };
    }
  }

  // ─── Public: Token için müsait slotları listele (Calendly modu) ───────────────

  async getAvailableSlotsForToken(token: string) {
    const req = await this.db.query.interviewRequests.findFirst({
      where: eq(interviewRequests.confirmToken, token),
      with: { application: { columns: { formData: true } } },
    });
    if (!req) throw new NotFoundException('Geçersiz veya süresi dolmuş bağlantı.');
    if (new Date() > req.tokenExpiresAt) throw new BadRequestException('Bu bağlantının süresi dolmuş.');
    if (req.state !== 'pending') throw new BadRequestException('Bu davet zaten kullanıldı.');

    const slots = await this.db.query.availabilitySlots.findMany({
      where: and(
        eq(availabilitySlots.slotType, 'membership'),
        gt(availabilitySlots.startAt, new Date()),
      ),
      orderBy: [availabilitySlots.startAt],
    });

    const available = slots.filter(s => s.bookedCount < s.capacity);
    const applicantName = this.extractNameFromApplication(
      req.application?.formData as Record<string, unknown> ?? {},
    );
    return { applicantName, slots: available, meetUrl: req.meetUrl ?? null };
  }

  // ─── Aday: Token ile Onay / Yeniden Zamanlama ────────────────────────────────

  async getRequestByToken(token: string) {
    const req = await this.db.query.interviewRequests.findFirst({
      where: eq(interviewRequests.confirmToken, token),
      with: {
        slot: true,
        application: { columns: { applicantEmail: true, formData: true, state: true } },
      },
    });
    if (!req) throw new NotFoundException('Geçersiz veya süresi dolmuş bağlantı.');
    if (new Date() > req.tokenExpiresAt) {
      throw new BadRequestException('Bu bağlantının süresi dolmuş. Lütfen destek@haritailesi.org ile iletişime geçin.');
    }
    return req;
  }

  async confirmOrReschedule(token: string, dto: ConfirmInterviewDto) {
    const req = await this.getRequestByToken(token);

    if (req.state !== 'pending') {
      throw new BadRequestException('Bu görüşme talebi zaten işleme alındı.');
    }

    const app = req.application!;
    const applicantName = this.extractNameFromApplication(app.formData as Record<string, unknown>);

    if (dto.action === 'pick_slot') {
      if (!dto.slotId) throw new BadRequestException('Slot seçimi zorunlu.');
      const pickedSlot = await this.db.query.availabilitySlots.findFirst({
        where: eq(availabilitySlots.id, dto.slotId),
      });
      if (!pickedSlot) throw new NotFoundException('Seçilen slot bulunamadı.');
      if (pickedSlot.bookedCount >= pickedSlot.capacity) throw new BadRequestException('Bu slot dolu, lütfen başka bir zaman seçin.');

      // Slotu rezerve et ve talebi güncelle
      await this.db.update(availabilitySlots)
        .set({ bookedCount: pickedSlot.bookedCount + 1 })
        .where(eq(availabilitySlots.id, pickedSlot.id));

      await this.db.update(interviewRequests)
        .set({ slotId: pickedSlot.id, state: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() })
        .where(eq(interviewRequests.id, req.id));

      await this.db.update(applications)
        .set({ state: 'interview_scheduled', updatedAt: new Date() })
        .where(eq(applications.id, req.applicationId!));

      const scheduledAt = this.formatDateTime(pickedSlot.startAt);
      const chosenMeetUrl = dto.meetingPreference ?? req.meetUrl ?? '';
      await this.emailService.sendInterviewConfirmed(
        app.applicantEmail, applicantName, scheduledAt, chosenMeetUrl,
      );

      if (req.createdByAdminId) {
        await this.notificationsService.create(req.createdByAdminId, {
          type: 'application_state_changed',
          title: 'Görüşme Zamanı Seçildi',
          body: `${applicantName} görüşme zamanını seçti: ${scheduledAt}`,
          data: { applicationId: req.applicationId ?? '', interviewRequestId: req.id },
        });
      }

      this.logger.log(`interview_slot_picked id=${req.id} slot=${pickedSlot.id} app=${req.applicationId}`);
      return { status: 'confirmed', scheduledAt, meetUrl: chosenMeetUrl };
    }

    if (dto.action === 'confirm') {
      await this.db
        .update(interviewRequests)
        .set({ state: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() })
        .where(eq(interviewRequests.id, req.id));

      // Application state → interview_scheduled
      await this.db
        .update(applications)
        .set({ state: 'interview_scheduled', updatedAt: new Date() })
        .where(eq(applications.id, req.applicationId!));

      const scheduledAt = this.formatDateTime(req.slot!.startAt);

      await this.emailService.sendInterviewConfirmed(
        app.applicantEmail,
        applicantName,
        scheduledAt,
        req.meetUrl ?? '',
      );

      // Admin'e push bildirim
      if (req.createdByAdminId) {
        await this.notificationsService.create(req.createdByAdminId, {
          type: 'application_state_changed',
          title: 'Görüşme Onaylandı',
          body: `${applicantName} görüşme zamanını onayladı.`,
          data: { applicationId: req.applicationId ?? '', interviewRequestId: req.id },
        });
      }

      this.logger.log(`interview_confirmed id=${req.id} app=${req.applicationId}`);
      return { status: 'confirmed', scheduledAt, meetUrl: req.meetUrl };
    }

    // Reschedule
    await this.db
      .update(interviewRequests)
      .set({
        state: 'rescheduled',
        rescheduleNote: dto.rescheduleNote ?? null,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(interviewRequests.id, req.id));

    // Slot kapasitesini geri al (varsa)
    const slot = req.slotId ? await this.db.query.availabilitySlots.findFirst({
      where: eq(availabilitySlots.id, req.slotId),
    }) : null;
    if (slot && slot.bookedCount > 0) {
      await this.db
        .update(availabilitySlots)
        .set({ bookedCount: slot.bookedCount - 1 })
        .where(eq(availabilitySlots.id, slot.id));
    }

    // Application state → interview_needed
    await this.db
      .update(applications)
      .set({ state: 'interview_needed', updatedAt: new Date() })
      .where(eq(applications.id, req.applicationId!));

    // Admin'e bildir
    if (req.createdByAdminId) {
      const adminUrl = process.env['ADMIN_URL'] ?? 'https://admin.haritailesi.org';
      await this.emailService.sendInterviewRescheduled(
        '', // admin email'i burada admin user'dan çekilmeli — sonraki adımda notification yeterli
        applicantName,
        dto.rescheduleNote ?? '',
        `${adminUrl}/basvurular`,
      );

      await this.notificationsService.create(req.createdByAdminId, {
        type: 'application_state_changed',
        title: 'Yeniden Zamanlama İsteği',
        body: `${applicantName} farklı bir görüşme zamanı istiyor.`,
        data: { applicationId: req.applicationId ?? '', interviewRequestId: req.id },
      });
    }

    this.logger.log(`interview_reschedule_requested id=${req.id} app=${req.applicationId}`);
    return { status: 'reschedule_requested' };
  }

  // ─── Başvuruya ait aktif görüşme talebini getir ──────────────────────────────

  async getInterviewRequestByApplication(applicationId: string) {
    return this.db.query.interviewRequests.findFirst({
      where: eq(interviewRequests.applicationId, applicationId),
      with: { slot: true },
      orderBy: [desc(interviewRequests.createdAt)],
    });
  }

  // ─── Mentörlük: Mentor kendi slotlarını yönetir ──────────────────────────────

  async getMentorSlots(mentorUserId: string) {
    return this.db.query.availabilitySlots.findMany({
      where: and(
        eq(availabilitySlots.adminId, mentorUserId),
        eq(availabilitySlots.slotType, 'mentorship'),
        gt(availabilitySlots.startAt, new Date()),
      ),
      orderBy: [availabilitySlots.startAt],
    });
  }

  async createMentorSlot(dto: CreateSlotDto, mentor: RequestUser) {
    return this.createSlot({ ...dto, slotType: 'mentorship' }, mentor);
  }

  async deleteMentorSlot(slotId: string, mentor: RequestUser): Promise<void> {
    return this.deleteSlot(slotId, mentor);
  }

  // ─── Mentörlük: Mentee bir slot seçip seans planlar ─────────────────────────

  async bookMentorshipSlot(
    mentorshipRequestId: string,
    slotId: string,
    meetUrl: string | undefined,
    booker: RequestUser,
  ) {
    const mr = await this.db.query.mentorshipRequests.findFirst({
      where: eq(mentorshipRequests.id, mentorshipRequestId),
      with: {
        mentee: { columns: { id: true, email: true } },
        mentor: {
          columns: { id: true, email: true },
          with: { profile: { columns: { displayName: true } } },
        },
      },
    });
    if (!mr) throw new NotFoundException('Mentorluk talebi bulunamadı.');
    if (mr.menteeId !== booker.id) {
      throw new ForbiddenException('Bu talebi yalnızca mentee planlayabilir.');
    }
    if (mr.status !== 'accepted') {
      throw new BadRequestException('Kabul edilmiş bir mentorluk talebi gereklidir.');
    }

    const slot = await this.db.query.availabilitySlots.findFirst({
      where: eq(availabilitySlots.id, slotId),
    });
    if (!slot) throw new NotFoundException('Slot bulunamadı.');
    if (slot.bookedCount >= slot.capacity) throw new BadRequestException('Slot dolu.');
    if (slot.slotType !== 'mentorship') throw new BadRequestException('Mentorship slotu gereklidir.');

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + TOKEN_TTL_DAYS);

    const [ireq] = await this.db
      .insert(interviewRequests)
      .values({
        slotId: slot.id,
        mentorshipRequestId,
        referenceType: 'mentorship',
        meetUrl: meetUrl ?? null,
        tokenExpiresAt,
        createdByAdminId: null,
      })
      .returning();

    if (!ireq) throw new Error('Interview request oluşturulamadı.');

    await this.db
      .update(availabilitySlots)
      .set({ bookedCount: slot.bookedCount + 1 })
      .where(eq(availabilitySlots.id, slot.id));

    // mentorshipRequests.scheduledAt güncelle
    await this.db
      .update(mentorshipRequests)
      .set({ scheduledAt: slot.startAt, updatedAt: new Date() })
      .where(eq(mentorshipRequests.id, mentorshipRequestId));

    // Mentor'a email gönder
    const menteeProfile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, booker.id),
      columns: { displayName: true },
    });
    const scheduledAt = this.formatDateTime(slot.startAt);

    if (mr.mentor?.email) {
      await this.emailService.sendMentorshipReminder(
        mr.mentor.email,
        mr.mentor.profile?.displayName ?? 'Mentör',
        menteeProfile?.displayName ?? 'Mentee',
        scheduledAt,
        mr.topic,
        `mentorship-booked-${ireq.id}`,
        0,
      );
    }

    this.logger.log(`mentorship_slot_booked mentorshipId=${mentorshipRequestId} slot=${slot.id} ireq=${ireq.id}`);
    return { interviewRequestId: ireq.id, scheduledAt, meetUrl: ireq.meetUrl };
  }

  // ─── Mentörlük: Belirli mentörün müsait slotlarını al (mentee görür) ─────────

  async getAvailableMentorshipSlots(mentorUserId: string) {
    return this.db.query.availabilitySlots.findMany({
      where: and(
        eq(availabilitySlots.adminId, mentorUserId),
        eq(availabilitySlots.slotType, 'mentorship'),
        gt(availabilitySlots.startAt, new Date()),
        sql`${availabilitySlots.bookedCount} < ${availabilitySlots.capacity}`,
      ),
      orderBy: [availabilitySlots.startAt],
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private extractNameFromApplication(formData: Record<string, unknown>): string {
    const name = formData['adSoyad'] ?? formData['ad_soyad'] ?? formData['displayName'];
    return typeof name === 'string' ? name : 'Başvuran';
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
