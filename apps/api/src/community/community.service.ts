import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { eq, desc, and, count, avg, asc, or, ilike, inArray, type SQL, sql } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { feedbackReports, feedbackStatusHistory, mentorApplications, users, userProfiles, ticketEmbeddings } from '@haritailesi/database';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { REDIS_TOKEN } from '../redis/redis.constants';
import type Redis from 'ioredis';
import { randomInt } from 'crypto';
import { randomUUID } from 'crypto';

type FeedbackStatus =
  | 'open' | 'reviewing' | 'awaiting_info' | 'in_progress' | 'mentoring'
  | 'expert_review' | 'partner_referred' | 'offer_pending' | 'education_suggested' | 'gpt_responded'
  | 'suggested' | 'resolved' | 'archived';

// ─── Smart Routing ────────────────────────────────────────────────────────────

function detectRoutingActions(dto: {
  subject: string;
  body: string;
  urgency?: string | undefined;
  userType?: string | undefined;
  subCategory?: string | undefined;
}): string[] {
  const actions: string[] = [];
  const catMatch = dto.subject.match(/^\[([^\]]+)\]/);
  const category = (catMatch?.[1] ?? '').toLowerCase();
  const t = dto.body.toLowerCase();
  const userType = dto.userType?.toLowerCase() ?? '';

  // Eğitim & kariyer → Haritakademi öner
  if (/egitim|kariyer|sertifika|kurs|yeterlilik/.test(category) ||
      /eğitim|kariyer|sertifika|kurs|yeterlilik/.test(t)) {
    actions.push('haritakademi');
  }

  // İstihdam / staj → Haritakariyer öner
  if (/istihdam|staj|is_arayanlar|ilan/.test(category) ||
      /iş arıyorum|staj arıyorum|istihdam|iş ilanı/.test(t)) {
    actions.push('haritakariyer');
  }

  // Kurumsal → Vitrin CRM notu
  if (/kurumsal|partner|firma|şirket/.test(category) ||
      userType === 'kurumsal' || userType === 'firma_sahibi') {
    actions.push('vitrin_crm');
  }

  // Öğrenci / yeni mezun + eğitim → Mesleğin Gelecekleri
  if (['ogrenci', 'yeni_mezun'].includes(userType) &&
      (/egitim|kariyer|kariyer|program/.test(category) || /eğitim|program|burs/.test(t))) {
    actions.push('meslegin_gelecekleri');
  }

  // Mevzuat → hukuki uyarı notu
  if (/mevzuat|hukuk|yönetmelik|kanun/.test(category) || /mevzuat|hukuk|yasal|kanun/.test(t)) {
    actions.push('legal_disclaimer');
  }

  // Teknik → teknik ekip
  if (/teknik|bug|hata|sistem|yazılım/.test(category) || /teknik sorun|hata|çalışmıyor|yazılım/.test(t)) {
    actions.push('teknik_ekip');
  }

  // İndirim / fiyat → partner referans potansiyeli
  if (/indirim|fiyat|teklif|sponsor/.test(category) || /indirim|teklif|fiyatlandırma|sponsor/.test(t)) {
    actions.push('partner_referral');
  }

  return actions;
}

function generateAiSummary(dto: {
  subject: string;
  body: string;
  urgency?: string | undefined;
  userType?: string | undefined;
  expectation?: string | undefined;
  subCategory?: string | undefined;
}, routingActions: string[]): string {
  const lines: string[] = [];

  const catMatch = dto.subject.match(/^\[([^\]]+)\]/);
  const category = catMatch?.[1] ?? 'Genel';

  lines.push(`Kategori: ${category}${dto.subCategory ? ` › ${dto.subCategory}` : ''}`);
  if (dto.userType) {
    const userTypeLabel: Record<string, string> = {
      ogrenci: 'Öğrenci', yeni_mezun: 'Yeni Mezun', calisan: 'Çalışan',
      yonetici: 'Yönetici', firma_sahibi: 'Firma Sahibi', kurumsal: 'Kurumsal',
    };
    lines.push(`Kullanıcı tipi: ${userTypeLabel[dto.userType] ?? dto.userType}`);
  }

  const urgencyLabel: Record<string, string> = {
    kritik: 'KRİTİK — bugün', yuksek: 'Yüksek — bu hafta',
    normal: 'Normal', dusuk: 'Düşük',
  };
  lines.push(`Aciliyet: ${urgencyLabel[dto.urgency ?? 'normal'] ?? dto.urgency ?? 'Normal'}`);
  if (dto.expectation) lines.push(`Beklenti: ${dto.expectation}`);

  const bodyPreview = dto.body.slice(0, 200).replace(/\s+/g, ' ').trim();
  lines.push(`Özet: ${bodyPreview}${dto.body.length > 200 ? '…' : ''}`);

  const keywords: string[] = [];
  const t = dto.body.toLowerCase();
  if (/mentör|koçluk|rehberlik/.test(t)) keywords.push('mentörlük');
  if (/iş arıyorum|staj|istihdam/.test(t)) keywords.push('iş/staj');
  if (/mevzuat|hukuk|yönetmelik/.test(t)) keywords.push('mevzuat');
  if (/eğitim|sertifika|kariyer/.test(t)) keywords.push('eğitim/kariyer');
  if (/indirim|teklif|fiyat/.test(t)) keywords.push('fiyatlandırma');
  if (/acil|bugün|hemen|kritik/.test(t)) keywords.push('acil');
  if (keywords.length) lines.push(`Anahtar kavramlar: ${keywords.join(', ')}`);

  // Yönlendirme önerileri
  if (routingActions.length > 0) {
    const actionLabels: Record<string, string> = {
      haritakademi: '📚 Haritakademi eğitimi önerilebilir',
      haritakariyer: '💼 Haritakariyer ilanı önerilebilir',
      vitrin_crm: '🏢 Kurumsal: Vitrin CRM\'e kaydet',
      meslegin_gelecekleri: '🎓 Mesleğin Gelecekleri programı önerilebilir',
      legal_disclaimer: '⚖️ Mevzuat notu: Hukuki sorumluluk reddi ekle',
      teknik_ekip: '🔧 Teknik ekibe ilet',
      partner_referral: '🤝 Partner referans potansiyeli',
    };
    lines.push(`\nÖnerilen aksiyonlar: ${routingActions.map(a => actionLabels[a] ?? a).join(' · ')}`);
  }

  return lines.join('\n');
}

// ─── Async AI Summary (Claude API) ───────────────────────────────────────────

async function generateAiSummaryWithClaude(dto: {
  subject: string;
  body: string;
  urgency?: string | undefined;
  userType?: string | undefined;
  expectation?: string | undefined;
  subCategory?: string | undefined;
}, routingActions: string[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const actionLabels: Record<string, string> = {
      haritakademi: 'Haritakademi eğitim öner',
      haritakariyer: 'Haritakariyer ilan öner',
      vitrin_crm: 'Kurumsal CRM kaydı',
      meslegin_gelecekleri: 'Mesleğin Gelecekleri programı öner',
      legal_disclaimer: 'Hukuki sorumluluk reddi ekle',
      teknik_ekip: 'Teknik ekibe ilet',
      partner_referral: 'Partner referansı değerlendir',
    };

    const prompt = `Sen Haritailesi Vakfı destek merkezinin AI asistanısın. Aşağıdaki destek talebini analiz et ve admin için kısa bir özet hazırla.

Konu: ${dto.subject}
İçerik: ${dto.body.slice(0, 600)}
Aciliyet: ${dto.urgency ?? 'normal'}
Kullanıcı tipi: ${dto.userType ?? 'belirtilmemiş'}
Beklenti: ${dto.expectation ?? 'belirtilmemiş'}
Alt kategori: ${dto.subCategory ?? 'yok'}
Otomatik tespit edilen aksiyonlar: ${routingActions.map(a => actionLabels[a] ?? a).join(', ') || 'standart destek'}

5 satırı geçmeden şunları Türkçe özetle:
1. Kullanıcının gerçek ihtiyacı (tek cümle)
2. Öncelik değerlendirmesi ve neden
3. Önerilen ilk adım
Admin için kısa ve net yaz, madde madde yap.`;

    const message = await Promise.race([
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 9000)),
    ]);

    const block = message.content[0];
    return block?.type === 'text' ? block.text : null;
  } catch {
    return null;
  }
}

const STATUS_LABELS_TR: Record<string, string> = {
  open: 'Yeni', reviewing: 'İncelemede', awaiting_info: 'Bilgi Bekleniyor',
  in_progress: 'Ekibimizde', mentoring: 'Mentöre Yönlendirildi', expert_review: 'Uzman İncelemesinde',
  partner_referred: 'Partnere Yönlendirildi', offer_pending: 'Teklif Bekleniyor',
  education_suggested: 'Eğitim Önerildi', gpt_responded: 'GPT Yanıt Verdi',
  suggested: 'Öneri Verildi', resolved: 'Çözüldü', archived: 'Arşivlendi',
};

@Injectable()
export class CommunityService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly whatsappService: WhatsappService,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
  ) {}

  // ─── OTP Doğrulama ───────────────────────────────────────────────────────────

  async sendOtp(contact: string, type: 'email' | 'phone'): Promise<void> {
    const key = `feedback_otp:${type}:${contact.toLowerCase().trim()}`;
    const existing = await this.redis.get(key);
    if (existing) {
      const data = JSON.parse(existing) as { code: string; attempts: number; sentAt: number };
      if (Date.now() - data.sentAt < 60_000) {
        throw new BadRequestException('Lütfen 1 dakika bekleyip tekrar deneyin.');
      }
    }

    const code = String(randomInt(100000, 999999));
    await this.redis.setex(key, 300, JSON.stringify({ code, attempts: 0, sentAt: Date.now() }));

    if (type === 'email') {
      await this.emailService.send(contact, 'otp_verification', { code });
    } else {
      await this.whatsappService.sendText(
        contact,
        `Haritailesi Pusula doğrulama kodunuz: *${code}*\n\nBu kod 5 dakika geçerlidir.`,
      );
    }
  }

  async verifyOtp(contact: string, type: 'email' | 'phone', code: string): Promise<string> {
    const key = `feedback_otp:${type}:${contact.toLowerCase().trim()}`;
    const raw = await this.redis.get(key);
    if (!raw) throw new BadRequestException('Kod süresi dolmuş veya geçersiz. Yeni kod isteyin.');

    const data = JSON.parse(raw) as { code: string; attempts: number; sentAt: number };
    if (data.attempts >= 5) {
      await this.redis.del(key);
      throw new BadRequestException('Çok fazla hatalı deneme. Yeni kod isteyin.');
    }
    if (data.code !== code.trim()) {
      data.attempts += 1;
      await this.redis.setex(key, 300, JSON.stringify(data));
      throw new BadRequestException(`Hatalı kod. ${5 - data.attempts} hakkınız kaldı.`);
    }

    await this.redis.del(key);
    const token = randomUUID();
    await this.redis.setex(`feedback_otp_ok:${token}`, 600, JSON.stringify({ contact, type }));
    return token;
  }

  async consumeOtpToken(token: string): Promise<{ contact: string; type: string } | null> {
    if (!token) return null;
    const raw = await this.redis.get(`feedback_otp_ok:${token}`);
    if (!raw) return null;
    await this.redis.del(`feedback_otp_ok:${token}`);
    return JSON.parse(raw) as { contact: string; type: string };
  }

  // ─── Feedback ────────────────────────────────────────────────────────────────

  async createFeedback(dto: {
    userId?: string | undefined;
    email?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    isAnonymous?: boolean;
    verificationToken?: string | undefined;
    subject: string;
    body: string;
    type: 'talep' | 'gorus' | 'hikaye' | 'reklam';
    source: 'sahne' | 'mutfak' | 'web' | 'isbirligi';
    urgency?: string | undefined;
    subCategory?: string | undefined;
    expectation?: string | undefined;
    userType?: string | undefined;
    attachmentUrls?: string[] | undefined;
  }) {
    if (!dto.userId && dto.source !== 'isbirligi') {
      if (!dto.verificationToken) {
        throw new BadRequestException('Gönderim için iletişim bilgisi doğrulaması gereklidir.');
      }
      const verified = await this.consumeOtpToken(dto.verificationToken);
      if (!verified) {
        throw new BadRequestException('Doğrulama süresi dolmuş. Lütfen tekrar doğrulayın.');
      }
    }
    const routingActions = detectRoutingActions({
      subject: dto.subject,
      body: dto.body,
      urgency: dto.urgency,
      userType: dto.userType,
      subCategory: dto.subCategory,
    });

    const aiSummary = generateAiSummary({
      subject: dto.subject,
      body: dto.body,
      urgency: dto.urgency,
      userType: dto.userType,
      expectation: dto.expectation,
      subCategory: dto.subCategory,
    }, routingActions);

    const [row] = await this.db
      .insert(feedbackReports)
      .values({
        userId: dto.userId ?? null,
        email: dto.email ?? null,
        name: dto.name ?? null,
        phone: dto.phone ?? null,
        isAnonymous: dto.isAnonymous ?? false,
        subject: dto.subject,
        body: dto.body,
        type: dto.type,
        source: (dto.source === 'isbirligi' ? 'web' : dto.source) as 'sahne' | 'mutfak' | 'web',
        urgency: dto.urgency ?? null,
        subCategory: dto.subCategory ?? null,
        expectation: dto.expectation ?? null,
        userType: dto.userType ?? null,
        attachmentUrls: dto.attachmentUrls?.length ? JSON.stringify(dto.attachmentUrls) : null,
        aiSummary,
        routingActions: routingActions.length ? routingActions.join(',') : null,
      })
      .returning({ id: feedbackReports.id, ticketNo: feedbackReports.ticketNo });

    const email = dto.email;
    if (email) {
      void this.emailService.sendFeedbackConfirmation(email, dto.subject, row!.ticketNo);
    }

    if (dto.source === 'isbirligi') {
      const adminEmail = process.env['ADMIN_EMAIL'] ?? 'admin@haritailesi.org';
      const adminUrl = `${process.env['ADMIN_URL'] ?? 'https://admin.haritailesi.org'}/gorusler`;
      void this.emailService.send(adminEmail, 'admin_broadcast', {
        subject: `[Öne Çık] Yeni işbirliği talebi — #${row!.ticketNo}`,
        body: [
          `Ticket #${row!.ticketNo} oluşturuldu.`,
          ``,
          `Konu: ${dto.subject}`,
          `Gönderen: ${dto.name ?? '—'} <${dto.email ?? '—'}>`,
          `Telefon: ${dto.phone ?? '—'}`,
          `Kategori: ${dto.subCategory ?? '—'}`,
          ``,
          dto.body,
          ``,
          `Pusula'da görüntüle: ${adminUrl}`,
        ].join('\n'),
      });
    }

    // Async AI enhancement (non-blocking)
    void this.enhanceWithClaude(row!.id, dto, routingActions);

    return { id: row!.id, ticketNo: row!.ticketNo };
  }

  private async enhanceWithClaude(
    feedbackId: string,
    dto: Parameters<CommunityService['createFeedback']>[0],
    routingActions: string[],
  ) {
    const claudeSummary = await generateAiSummaryWithClaude(dto, routingActions);
    if (claudeSummary) {
      await this.db
        .update(feedbackReports)
        .set({ aiSummary: claudeSummary })
        .where(eq(feedbackReports.id, feedbackId));
    }
  }

  async listFeedback(params: {
    status?: string | undefined;
    source?: string | undefined;
    type?: string | undefined;
    urgency?: string | undefined;
    userType?: string | undefined;
    assignedTo?: string | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
  }) {
    const limit = Math.min(params.limit ?? 30, 100);
    const conditions: SQL[] = [];
    if (params.status) conditions.push(eq(feedbackReports.status, params.status as FeedbackStatus));
    if (params.source) conditions.push(eq(feedbackReports.source, params.source as 'sahne' | 'mutfak' | 'web'));
    if (params.type) conditions.push(eq(feedbackReports.type, params.type as 'talep' | 'gorus' | 'hikaye' | 'reklam'));
    if (params.urgency) conditions.push(eq(feedbackReports.urgency!, params.urgency));
    if (params.userType) conditions.push(eq(feedbackReports.userType!, params.userType));
    if (params.assignedTo) conditions.push(eq(feedbackReports.assignedTo!, params.assignedTo));
    if (params.cursor) {
      const { sql } = await import('drizzle-orm');
      conditions.push(sql`${feedbackReports.createdAt} < (SELECT created_at FROM feedback_reports WHERE id = ${params.cursor})`);
    }

    const rows = await this.db
      .select({
        id: feedbackReports.id,
        ticketNo: feedbackReports.ticketNo,
        subject: feedbackReports.subject,
        body: feedbackReports.body,
        type: feedbackReports.type,
        source: feedbackReports.source,
        status: feedbackReports.status,
        email: feedbackReports.email,
        name: feedbackReports.name,
        adminNotes: feedbackReports.adminNotes,
        adminReply: feedbackReports.adminReply,
        urgency: feedbackReports.urgency,
        subCategory: feedbackReports.subCategory,
        expectation: feedbackReports.expectation,
        userType: feedbackReports.userType,
        assignedTo: feedbackReports.assignedTo,
        attachmentUrls: feedbackReports.attachmentUrls,
        satisfactionScore: feedbackReports.satisfactionScore,
        aiSummary: feedbackReports.aiSummary,
        routingActions: feedbackReports.routingActions,
        userId: feedbackReports.userId,
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

  async updateFeedbackStatus(
    id: string,
    status: FeedbackStatus,
    adminNotes?: string,
    adminReply?: string,
    assignedTo?: string,
    changedBy?: string,
  ) {
    // Fetch current state for audit log
    const [current] = await this.db
      .select({ status: feedbackReports.status, userId: feedbackReports.userId })
      .from(feedbackReports)
      .where(eq(feedbackReports.id, id))
      .limit(1);

    const isResolved = status === 'resolved' || status === 'archived';
    const [row] = await this.db
      .update(feedbackReports)
      .set({
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(adminReply !== undefined ? { adminReply } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
        resolvedAt: isResolved ? new Date() : null,
      })
      .where(eq(feedbackReports.id, id))
      .returning({
        id: feedbackReports.id,
        ticketNo: feedbackReports.ticketNo,
        email: feedbackReports.email,
        subject: feedbackReports.subject,
        userId: feedbackReports.userId,
      });

    // Insert audit log entry
    if (current) {
      void this.db.insert(feedbackStatusHistory).values({
        feedbackId: id,
        fromStatus: current.status,
        toStatus: status,
        changedBy: changedBy ?? 'admin',
        adminNotes: adminNotes ?? null,
      });
    }

    // In-app notification for authenticated user
    const userId = row?.userId ?? current?.userId;
    if (userId) {
      const ticketNo = row?.ticketNo;
      const statusLabel = STATUS_LABELS_TR[status] ?? status;
      void this.notificationsService.create(userId, {
        type: 'ticket_status',
        title: 'Destek talebiniz güncellendi',
        body: `${ticketNo ? `HDM-${new Date().getFullYear()}-${String(ticketNo).padStart(4, '0')} ` : ''}talebiniz "${statusLabel}" durumuna geçti.`,
        data: { ticketId: id, status, ...(ticketNo ? { ticketNo: String(ticketNo) } : {}) },
      });
    }

    if (row?.email) {
      if (status === 'reviewing') {
        void this.emailService.sendFeedbackReviewing(row.email, row.subject, row.ticketNo);
      } else if (status === 'in_progress') {
        void this.emailService.sendFeedbackInProgress(row.email, row.subject, row.ticketNo);
      } else if (status === 'awaiting_info') {
        void this.emailService.sendFeedbackAwaitingInfo(row.email, row.subject, row.ticketNo, adminReply);
      } else if (status === 'mentoring') {
        void this.emailService.sendFeedbackMentoring(row.email, row.subject, row.ticketNo);
      } else if (status === 'partner_referred') {
        void this.emailService.sendFeedbackPartnerReferred(row.email, row.subject, row.ticketNo);
      } else if (status === 'education_suggested') {
        void this.emailService.sendFeedbackEducationSuggested(row.email, row.subject, row.ticketNo);
      } else if (status === 'resolved') {
        const webUrl = process.env['WEB_URL'] ?? 'https://haritailesi.org';
        const satisfactionUrl = `${webUrl}/destek/takip?no=${row.ticketNo}&rate=${row.id}`;
        void this.emailService.sendFeedbackResolved(row.email, row.subject, row.ticketNo, adminReply);
        void this.emailService.sendFeedbackSatisfactionRequest(row.email, row.subject, row.ticketNo, satisfactionUrl);
      }
    }

    // Ticket çözülünce embedding hesapla (öğrenme için)
    if (isResolved) {
      void this.computeAndStoreEmbedding(id);
    }

    return row;
  }

  async getFeedbackStatusHistory(feedbackId: string) {
    return this.db
      .select()
      .from(feedbackStatusHistory)
      .where(eq(feedbackStatusHistory.feedbackId, feedbackId))
      .orderBy(asc(feedbackStatusHistory.createdAt));
  }

  async lookupFeedbackByTicketNo(ticketNo: number) {
    const { sql } = await import('drizzle-orm');
    const [row] = await this.db
      .select({
        id: feedbackReports.id,
        ticketNo: feedbackReports.ticketNo,
        subject: feedbackReports.subject,
        status: feedbackReports.status,
        urgency: feedbackReports.urgency,
        subCategory: feedbackReports.subCategory,
        adminReply: feedbackReports.adminReply,
        satisfactionScore: feedbackReports.satisfactionScore,
        createdAt: feedbackReports.createdAt,
        resolvedAt: feedbackReports.resolvedAt,
      })
      .from(feedbackReports)
      .where(sql`${feedbackReports.ticketNo} = ${ticketNo}`)
      .limit(1);

    if (!row) return null;
    return row;
  }

  async addPartnerNote(feedbackId: string, note: string, partnerEmail: string) {
    const [current] = await this.db
      .select({ assignedTo: feedbackReports.assignedTo, status: feedbackReports.status })
      .from(feedbackReports)
      .where(eq(feedbackReports.id, feedbackId))
      .limit(1);

    if (!current || current.assignedTo !== partnerEmail) {
      throw new Error('Bu talebe erişim yetkiniz yok');
    }

    const [row] = await this.db
      .update(feedbackReports)
      .set({ adminReply: note })
      .where(eq(feedbackReports.id, feedbackId))
      .returning({ id: feedbackReports.id });

    void this.db.insert(feedbackStatusHistory).values({
      feedbackId,
      fromStatus: current.status,
      toStatus: current.status,
      changedBy: partnerEmail,
      adminNotes: `Partner notu: ${note.slice(0, 100)}`,
    });

    return row;
  }

  async submitSatisfaction(id: string, score: number) {
    if (score < 1 || score > 5) throw new Error('Score must be 1-5');
    const [row] = await this.db
      .update(feedbackReports)
      .set({ satisfactionScore: score })
      .where(eq(feedbackReports.id, id))
      .returning({ id: feedbackReports.id });
    return row;
  }

  async getFeedbackStats() {
    const [total] = await this.db.select({ count: count() }).from(feedbackReports);

    const byStatus = await this.db
      .select({ status: feedbackReports.status, count: count() })
      .from(feedbackReports)
      .groupBy(feedbackReports.status);

    const byCategory = await this.db
      .select({ subject: feedbackReports.subject, count: count() })
      .from(feedbackReports)
      .groupBy(feedbackReports.subject)
      .limit(20);

    const bySource = await this.db
      .select({ source: feedbackReports.source, count: count() })
      .from(feedbackReports)
      .groupBy(feedbackReports.source);

    const byUrgency = await this.db
      .select({ urgency: feedbackReports.urgency, count: count() })
      .from(feedbackReports)
      .groupBy(feedbackReports.urgency);

    const byUserType = await this.db
      .select({ userType: feedbackReports.userType, count: count() })
      .from(feedbackReports)
      .groupBy(feedbackReports.userType);

    const [avgSatisfaction] = await this.db
      .select({ avg: avg(feedbackReports.satisfactionScore) })
      .from(feedbackReports)
      .where(eq(feedbackReports.status, 'resolved'));

    const byExpectation = await this.db
      .select({ expectation: feedbackReports.expectation, count: count() })
      .from(feedbackReports)
      .groupBy(feedbackReports.expectation)
      .limit(15);

    return {
      total: total?.count ?? 0,
      byStatus,
      bySource,
      byUrgency,
      byUserType,
      byExpectation,
      avgSatisfaction: avgSatisfaction?.avg ? Number(avgSatisfaction.avg).toFixed(1) : null,
      topCategories: byCategory.map(r => {
        const m = r.subject.match(/^\[([^\]]+)\]/);
        return { category: m?.[1] ?? r.subject.slice(0, 30), count: r.count };
      }),
    };
  }

  async findSimilarResolved(params: {
    q?: string;
    subCategory?: string;
    category?: string;
    limit?: number;
  }) {
    const limit = Math.min(params.limit ?? 8, 20);
    const conditions: SQL[] = [
      inArray(feedbackReports.status, ['resolved', 'archived']),
    ];

    // Category match from subject prefix [Kategori]
    if (params.category) {
      conditions.push(ilike(feedbackReports.subject, `[${params.category}]%`));
    }
    if (params.subCategory) {
      conditions.push(eq(feedbackReports.subCategory, params.subCategory));
    }

    // Keyword search across subject + body + adminNotes
    if (params.q && params.q.trim().length >= 2) {
      const terms = params.q.trim().split(/\s+/).filter(t => t.length >= 2).slice(0, 5);
      if (terms.length > 0) {
        const keywordConds = terms.map(term =>
          or(
            ilike(feedbackReports.subject, `%${term}%`),
            ilike(feedbackReports.body, `%${term}%`),
            ilike(feedbackReports.adminNotes, `%${term}%`),
          ) as SQL,
        );
        conditions.push(or(...keywordConds) as SQL);
      }
    }

    const rows = await this.db
      .select({
        id: feedbackReports.id,
        ticketNo: feedbackReports.ticketNo,
        subject: feedbackReports.subject,
        body: feedbackReports.body,
        subCategory: feedbackReports.subCategory,
        adminNotes: feedbackReports.adminNotes,
        adminReply: feedbackReports.adminReply,
        satisfactionScore: feedbackReports.satisfactionScore,
        source: feedbackReports.source,
        resolvedAt: feedbackReports.resolvedAt,
        createdAt: feedbackReports.createdAt,
      })
      .from(feedbackReports)
      .where(and(...conditions))
      .orderBy(desc(feedbackReports.resolvedAt))
      .limit(limit);

    return rows;
  }

  async generateReplyDraft(feedbackId: string): Promise<{ draft: string }> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new BadRequestException('AI yapılandırması eksik.');

    const [ticket] = await this.db
      .select({
        id: feedbackReports.id,
        subject: feedbackReports.subject,
        body: feedbackReports.body,
        urgency: feedbackReports.urgency,
        aiSummary: feedbackReports.aiSummary,
        adminNotes: feedbackReports.adminNotes,
        subCategory: feedbackReports.subCategory,
      })
      .from(feedbackReports)
      .where(eq(feedbackReports.id, feedbackId))
      .limit(1);

    if (!ticket) throw new BadRequestException('Ticket bulunamadı.');

    const similar = await this.findSimilarResolved({
      q: ticket.subject.replace(/^\[([^\]]+)\]\s*/, '').split(' ').slice(0, 3).join(' '),
      limit: 3,
    });

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const similarContext = similar
      .filter(s => s.adminReply)
      .map((s, i) => `Örnek ${i + 1} — Konu: ${s.subject.slice(0, 60)}\nVerilen yanıt: ${s.adminReply!.slice(0, 200)}`)
      .join('\n\n');

    const prompt = `Sen Haritailesi Vakfı destek merkezi ekibi adına kullanıcıya yanıt yazıyorsun.

Talep:
Konu: ${ticket.subject}
İçerik: ${ticket.body.slice(0, 500)}
Aciliyet: ${ticket.urgency ?? 'normal'}
${ticket.aiSummary ? `AI Özet: ${ticket.aiSummary.slice(0, 300)}` : ''}
${ticket.adminNotes ? `İç Not: ${ticket.adminNotes.slice(0, 200)}` : ''}
${similarContext ? `\nBenzer çözümlenen talepler (referans):\n${similarContext}` : ''}

Lütfen bu talebe Türkçe, samimi ve profesyonel bir yanıt taslağı yaz:
- Merhaba ile başla
- Kullanıcının sorununun anlaşıldığını göster
- Somut bir yönlendirme veya çözüm adımı öner
- Haritailesi ekibinin ne yapacağını belirt
- İmza: Haritailesi Destek Ekibi
- Markdown formatı kullanma
- 2-4 paragraf`;

    try {
      const message = await Promise.race([
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);
      const block = message.content[0];
      return { draft: block?.type === 'text' ? block.text : '' };
    } catch {
      throw new BadRequestException('AI yanıt taslağı oluşturulamadı.');
    }
  }

  async listMyFeedback(userId: string) {
    return this.db
      .select({
        id: feedbackReports.id,
        ticketNo: feedbackReports.ticketNo,
        subject: feedbackReports.subject,
        type: feedbackReports.type,
        status: feedbackReports.status,
        urgency: feedbackReports.urgency,
        subCategory: feedbackReports.subCategory,
        satisfactionScore: feedbackReports.satisfactionScore,
        adminReply: feedbackReports.adminReply,
        createdAt: feedbackReports.createdAt,
        resolvedAt: feedbackReports.resolvedAt,
      })
      .from(feedbackReports)
      .where(eq(feedbackReports.userId, userId))
      .orderBy(desc(feedbackReports.createdAt))
      .limit(50);
  }

  // ─── Mentor / Mentee Applications ───────────────────────────────────────────

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

  // ─── Voyage AI Embedding Pipeline ───────────────────────────────────────────

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += (a[i] ?? 0) * (b[i] ?? 0);
      normA += (a[i] ?? 0) ** 2;
      normB += (b[i] ?? 0) ** 2;
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async computeEmbedding(text: string): Promise<number[] | null> {
    const apiKey = process.env.VOYAGE_API_KEY;
    if (!apiKey) return null;
    try {
      const res = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'voyage-multilingual-2', input: [text.slice(0, 2000)], input_type: 'document' }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return null;
      const data = await res.json() as { data: Array<{ embedding: number[] }> };
      return data.data[0]?.embedding ?? null;
    } catch {
      return null;
    }
  }

  async computeAndStoreEmbedding(ticketId: string): Promise<void> {
    try {
      const [ticket] = await this.db
        .select({ subject: feedbackReports.subject, body: feedbackReports.body })
        .from(feedbackReports).where(eq(feedbackReports.id, ticketId)).limit(1);
      if (!ticket) return;

      const catMatch = ticket.subject.match(/^\[([^\]]+)\]/);
      if (!catMatch?.[1]) return;
      const category = catMatch[1];

      const embedding = await this.computeEmbedding(`${ticket.subject}\n${ticket.body.slice(0, 500)}`);
      if (!embedding) return;

      await this.db.insert(ticketEmbeddings).values({
        ticketId,
        category,
        embedding: JSON.stringify(embedding),
      }).onConflictDoNothing();

      // Embedding cache'ini geçersiz kıl
      await this.redis.del('ticket_embeddings_cache');
    } catch {
      // fire-and-forget, hata yoksay
    }
  }

  async findSimilarByEmbedding(queryEmbedding: number[], limit = 3): Promise<string[]> {
    try {
      // 1 saatlik Redis cache
      const cacheKey = 'ticket_embeddings_cache';
      const cached = await this.redis.get(cacheKey);
      let store: Array<{ category: string; embedding: number[] }>;

      if (cached) {
        store = JSON.parse(cached) as typeof store;
      } else {
        const rows = await this.db
          .select({ category: ticketEmbeddings.category, embedding: ticketEmbeddings.embedding })
          .from(ticketEmbeddings)
          .orderBy(desc(ticketEmbeddings.createdAt))
          .limit(500);

        store = rows.map(r => ({
          category: r.category,
          embedding: JSON.parse(r.embedding) as number[],
        }));

        await this.redis.set(cacheKey, JSON.stringify(store), 'EX', 3600);
      }

      return store
        .map(e => ({ category: e.category, sim: this.cosineSimilarity(queryEmbedding, e.embedding) }))
        .sort((a, b) => b.sim - a.sim)
        .slice(0, limit)
        .filter(e => e.sim > 0.72)
        .map(e => e.category);
    } catch {
      return [];
    }
  }

  // ─── Category Intelligence ───────────────────────────────────────────────────

  async classifyIntent(
    text: string,
    regexSignals?: { topCategory: string; topScore: number; scoreDiff: number },
  ): Promise<{
    categoryId: string;
    confidence: number;
    reasoning: string;
    clarifyingQuestion?: string;
    clarifyOptions?: string[];
  }> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { categoryId: 'oneri', confidence: 0, reasoning: 'AI yapılandırması yok' };

    const validIds = ['teknik','mesleki-cozum','egitim','uyelik','mevzuat','sektor','oneri','mentorluk','kariyer-danismanligi','is-staj','indirim','kurumsal','tanitim'];

    const categoryList = `teknik: Platform, araç veya sistem sorunu (giriş hatası, çalışmıyor, bug)
mesleki-cozum: Saha/ölçüm için araç, yöntem veya uygulama arayışı
egitim: Eğitim, sertifika, kurs veya mesleki gelişim
uyelik: Üyelik, başvuru, ödeme veya avantajlar
mevzuat: Mesleki mevzuat, yasal düzenleme, hukuki yönlendirme
sektor: Harita/CBS/geomatik alanında genel sektörel soru
oneri: Platform veya vakıf için öneri, geri bildirim
mentorluk: Deneyimli meslektaştan birebir rehberlik
kariyer-danismanligi: İş yeri sorunları, kariyer kararları
is-staj: İş ilanı, staj, proje fırsatı
indirim: İndirimli fiyat veya özel teklif
kurumsal: Kurumsal iş birliği, danışmanlık
tanitim: Etkinlik/firma/ürün tanıtımı, sponsorluk`;

    const fewShot = `Örnek doğru sınıflandırmalar:
• "Sahada RTK ile koordinat kayması yaşıyorum, hangi yazılım?" → mesleki-cozum (0.95)
• "Sahada bir işlemi yapamıyorum, yardımcı olabilir misiniz?" → mesleki-cozum (0.88)
• "ArcGIS'te bir işlemi yapamıyorum, biri eğitim verebilir mi?" → egitim (0.87)
• "QGIS'te katman birleştirmeyi yapamıyorum, nasıl yapılır?" → mesleki-cozum (0.90)
• "NetCad'e giriş yapamıyorum, şifrem çalışmıyor" → teknik (0.97)
• "Türkiye'de drone haritacılığının geleceği nasıl?" → sektor (0.88)
• "TKGM yönetmeliğinde parsel tescili için ne gerekiyor?" → mevzuat (0.91)
• "İşyerinde mobbing yaşıyorum, ne yapmalıyım?" → kariyer-danismanligi (0.90)
• "GIS sertifikası almak istiyorum, hangi kurs?" → egitim (0.93)
• "Webinarımı Haritailesi'nde duyurmak istiyorum" → tanitim (0.92)
• "Staj arıyorum, CBS biliyorum" → is-staj (0.94)
• "Belediyemiz için CBS eğitimi almak istiyoruz" → kurumsal (0.91)
• "Mentör arıyorum, kariyerimi planlayamıyorum" → mentorluk (0.89)`;

    let similarContext = '';
    try {
      const queryEmbedding = await this.computeEmbedding(text.slice(0, 600));
      if (queryEmbedding) {
        const similars = await this.findSimilarByEmbedding(queryEmbedding, 3);
        if (similars.length >= 2) {
          similarContext = `\nAnlamsal benzer çözümlü talepler: ${similars.join(', ')} → güçlü ipucu.`;
        } else if (similars.length === 1) {
          similarContext = `\nEn yakın benzer talep: ${similars[0]} kategorisindeydi.`;
        }
      }
      if (!similarContext) {
        const kw = text.toLowerCase().replace(/[^\wğüşöçıİĞÜŞÖÇ\s]/g, '').split(/\s+/).filter(w => w.length >= 4).slice(0, 5).join(' ');
        const sim = await this.findSimilarResolved({ q: kw, limit: 3 });
        const cats = sim.filter(s => s.subject.startsWith('[')).map(s => s.subject.match(/^\[([^\]]+)\]/)?.[1] ?? '').filter(Boolean);
        if (cats.length >= 2) similarContext = `\nGeçmiş benzer talepler: ${cats.join(', ')}.`;
      }
    } catch { /* devam et */ }

    let biasContext = '';
    try {
      const biasRaw = await this.redis.get('category_bias');
      if (biasRaw) {
        const bias = JSON.parse(biasRaw) as Record<string, number>;
        const top = Object.entries(bias).sort((a, b) => b[1] - a[1]).slice(0, 3)
          .map(([k, v]) => `${k}(%${Math.round(v * 100)})`).join(', ');
        if (top) biasContext = `\nKullanıcı düzeltme örüntüleri: ${top}.`;
      }
    } catch { /* devam et */ }

    const regexContext = regexSignals
      ? regexSignals.topCategory === 'belirsiz' || regexSignals.topScore === 0
        ? '\nRegex analizi: Anlamlı anahtar kelime bulunamadı. Bağlamdan bağımsız karar ver.'
        : `\nRegex analizi: "${regexSignals.topCategory}" (skor:${regexSignals.topScore}, fark:${regexSignals.scoreDiff}).${regexSignals.topScore >= 4 ? ' Güçlü sinyal, dikkate al.' : ' Zayıf sinyal, bağlamı önceliklendir.'}`
      : '';

    const systemPrompt = `Sen Haritailesi Vakfı destek merkezi kategorilendirme motorusun. Türkiye'deki harita mühendisleri, jeodezi uzmanları ve geomatik profesyonellerine hizmet veriyorsun.

Kategoriler:
${categoryList}

${fewShot}
${similarContext}${biasContext}${regexContext}

YALNIZCA şu JSON formatında yanıt ver:
{
  "categoryId": "kategori-id",
  "confidence": 0.0-1.0,
  "reasoning": "max 12 kelime Türkçe açıklama",
  "clarifyingQuestion": "soru (SADECE confidence 0.62-0.82 arasında, aksi halde bu alanı EKLEME)",
  "clarifyOptions": ["seçenek A", "seçenek B"]
}

Kurallar:
- "oneri" YALNIZCA kullanıcı açıkça öneri/geri bildirim/görüş paylaşmak istediğinde kullan. Belirsiz veya yardım isteyen mesajlarda "oneri" KULLANMA.
- Kullanıcı bir şeyi "yapamıyorum" diyorsa → mesleki-cozum veya teknik, asla oneri değil.
- confidence >= 0.83 → clarifyingQuestion EKLEME
- confidence < 0.62 → clarifyingQuestion EKLEME
- Sadece 0.62-0.82 arasında clarifyingQuestion + 2 clarifyOptions ekle
- Yalnızca JSON döndür`;

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });
      const msg = await Promise.race([
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 220,
          system: systemPrompt,
          messages: [{ role: 'user', content: text.slice(0, 500) }],
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 9000)),
      ]);

      const block = msg.content[0];
      if (!block || block.type !== 'text') return { categoryId: 'oneri', confidence: 0, reasoning: 'AI yanıt vermedi' };
      const match = block.text.match(/\{[\s\S]*?\}/);
      if (!match) return { categoryId: 'oneri', confidence: 0, reasoning: 'JSON parse hatası' };

      const json = JSON.parse(match[0]) as {
        categoryId?: string;
        confidence?: number;
        reasoning?: string;
        clarifyingQuestion?: string;
        clarifyOptions?: string[];
      };

      const catId = validIds.includes(json.categoryId ?? '') ? (json.categoryId ?? 'oneri') : 'oneri';
      const confidence = Math.max(0, Math.min(1, json.confidence ?? 0));
      const reasoning = json.reasoning ?? '';

      if (json.clarifyingQuestion && Array.isArray(json.clarifyOptions) && json.clarifyOptions.length >= 2) {
        return { categoryId: catId, confidence, reasoning, clarifyingQuestion: json.clarifyingQuestion, clarifyOptions: json.clarifyOptions };
      }
      return { categoryId: catId, confidence, reasoning };
    } catch {
      return { categoryId: 'oneri', confidence: 0, reasoning: 'AI yanıt veremedi' };
    }
  }

  async getCategoryBias(): Promise<Record<string, number>> {
    try {
      const raw = await this.redis.get('category_direct_bias');
      return raw ? (JSON.parse(raw) as Record<string, number>) : {};
    } catch {
      return {};
    }
  }

  async logCategoryCorrection(text: string, detected: string, corrected: string): Promise<void> {
    try {
      const entry = JSON.stringify({ detected, corrected, ts: Date.now(), textLen: text.length });
      await this.redis.lpush('category_corrections', entry);
      await this.redis.ltrim('category_corrections', 0, 999);
      // 20+ yeni sinyal birikince bias'ı hemen yeniden hesapla
      await this.maybeRecomputeBias();
    } catch {
      // fire-and-forget
    }
  }

  async logCategoryConfirm(text: string, categoryId: string): Promise<void> {
    try {
      const entry = JSON.stringify({ categoryId, ts: Date.now(), textLen: text.length });
      await this.redis.lpush('category_confirms', entry);
      await this.redis.ltrim('category_confirms', 0, 999);
      await this.maybeRecomputeBias();
    } catch {
      // fire-and-forget
    }
  }

  private async maybeRecomputeBias(): Promise<void> {
    try {
      // Her 20 yeni sinyalde bir bias'ı anında yeniden hesapla
      const sinceKey = 'bias_last_count';
      const corrCount = await this.redis.llen('category_corrections');
      const confCount = await this.redis.llen('category_confirms');
      const total = corrCount + confCount;
      const lastStr = await this.redis.get(sinceKey);
      const last = lastStr ? parseInt(lastStr, 10) : 0;
      if (total - last >= 20) {
        await this.redis.set(sinceKey, String(total));
        void this.recomputeDirectBias(); // non-blocking
      }
    } catch {
      // devam et
    }
  }

  async recomputeDirectBias(): Promise<void> {
    try {
      const corrRaw = await this.redis.lrange('category_corrections', 0, -1);
      const confRaw = await this.redis.lrange('category_confirms', 0, -1);

      const delta: Record<string, number> = {};
      const bump = (cat: string, n: number) => { delta[cat] = (delta[cat] ?? 0) + n; };

      // Düzeltmeler: güçlü sinyal
      for (const item of corrRaw) {
        try {
          const e = JSON.parse(item) as { detected: string; corrected: string };
          bump(e.detected, -1.5);
          bump(e.corrected, +1.5);
        } catch { /* skip */ }
      }
      // Onaylar: zayıf pozitif sinyal
      for (const item of confRaw) {
        try {
          const e = JSON.parse(item) as { categoryId: string };
          bump(e.categoryId, +0.4);
        } catch { /* skip */ }
      }

      const total = Math.max(corrRaw.length + confRaw.length, 1);
      const normalized: Record<string, number> = {};
      for (const [cat, v] of Object.entries(delta)) {
        // Normalize: [-2, +2] aralığına kıs
        normalized[cat] = Math.max(-2, Math.min(2, Math.round((v / total) * 10 * 100) / 100));
      }

      await this.redis.set('category_direct_bias', JSON.stringify(normalized), 'EX', 60 * 60 * 24 * 8);
    } catch {
      // fire-and-forget
    }
  }

  // ─── HaritailesiGPT Chat ────────────────────────────────────────────────────

  async gptChat(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{
    type: 'answer' | 'routing' | 'clarify';
    content: string;
    category?: string;
    subCategory?: string;
    suggestedSubject?: string;
  }> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        type: 'answer',
        content: 'Şu anda yapay zeka desteği aktif değil. Lütfen formu kullanarak talebinizi iletin.',
      };
    }

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const systemPrompt = `Sen Haritailesi Vakfı'nın "HaritailesiGPT" adlı destek asistanısın.
Haritailesi, Türkiye'deki harita mühendisleri, jeodezi uzmanları ve geomatik profesyonellerinin vakfıdır.

Kullanıcıların mesleki sorularını, kariyer ihtiyaçlarını, teknik sorularını ve destek taleplerini yönetiyorsun.

Yanıt formatın her zaman JSON olmalı, şu yapıda:
{
  "type": "answer" | "routing" | "clarify",
  "content": "Kullanıcıya gösterilecek Türkçe metin",
  "category": "teknik|egitim|uyelik|mevzuat|oneri|sektor|mentorluk|is-staj|indirim|kurumsal" (yalnızca routing'de),
  "subCategory": "isteğe bağlı alt kategori" (yalnızca routing'de),
  "suggestedSubject": "önerilen konu başlığı" (yalnızca routing'de)
}

Kurallar:
- "answer": Soruyu kendi başına yanıtlayabiliyorsan. Genel bilgi sorularında, kısa tanımlamalarda kullan.
- "routing": Kullanıcının bir destek talebi oluşturması gerekiyorsa. "category" alanını doldur.
- "clarify": Daha fazla bilgiye ihtiyacın varsa kullan.

Önemli:
- Hukuki danışmanlık verme, sadece yönlendir.
- Çok uzun yanıtlardan kaçın, max 3 paragraf.
- Her zaman sıcak ve profesyonel bir dil kullan.
- Yanıtın yalnızca JSON olmalı, başka metin ekleme.`;

      const messages = [
        ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user' as const, content: message },
      ];

      const response = await Promise.race([
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          system: systemPrompt,
          messages,
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000)),
      ]);

      const block = response.content[0];
      if (!block || block.type !== 'text') throw new Error('No text response');

      const raw = block.text.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');

      const parsed = JSON.parse(jsonMatch[0]) as {
        type: 'answer' | 'routing' | 'clarify';
        content: string;
        category?: string;
        subCategory?: string;
        suggestedSubject?: string;
      };

      return {
        type: parsed.type ?? 'answer',
        content: parsed.content ?? 'Yanıt alınamadı.',
        ...(parsed.category ? { category: parsed.category } : {}),
        ...(parsed.subCategory ? { subCategory: parsed.subCategory } : {}),
        ...(parsed.suggestedSubject ? { suggestedSubject: parsed.suggestedSubject } : {}),
      };
    } catch {
      return {
        type: 'answer',
        content: 'Şu anda yanıt veremiyorum. Lütfen formu kullanarak talebinizi iletin.',
      };
    }
  }
}
