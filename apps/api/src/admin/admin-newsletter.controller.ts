import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, BadRequestException, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RequirePermission } from '../rbac/rbac.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Perm } from '../rbac/permissions';
import { InjectDb } from '../database/inject-db.decorator';
import { StorageService } from '../storage/storage.service';
import type { Database } from '@haritailesi/database';
import {
  newsletters, events, trainings, userProfiles, jobListings, competitions,
  communityQuestions, projects, talents, surveys, storeProducts, siteSettings,
  newsletterSubscriberProfiles, newsletterTags, newsletterGrowthSnapshots,
} from '@haritailesi/database';
import { eq, desc, and, or, gte, lte, isNotNull, lt, asc } from 'drizzle-orm';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import type { Response } from 'express';

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Controller('admin/newsletter')
export class AdminNewsletterController {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly config: ConfigService,
    private readonly whatsapp: WhatsappService,
    private readonly storage: StorageService,
  ) {}

  private get brevoKey() { return this.config.get<string>('BREVO_API_KEY') ?? ''; }
  private get brevoListId() { return this.config.get<string>('BREVO_NEWSLETTER_LIST_ID') ?? ''; }
  private get senderEmail() { return this.config.get<string>('BREVO_SENDER_EMAIL') ?? 'iletisim@haritailesi.org'; }
  private get senderName() { return this.config.get<string>('BREVO_SENDER_NAME') ?? 'Haritailesi'; }

  // ── Görsel Yükleme (newsletter için kalıcı proxy URL) ──────────────────────

  @Post('upload-image')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  @UseInterceptors(FileInterceptor('file'))
  async uploadNewsletterImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı');
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) throw new BadRequestException('Sadece resim yüklenebilir (jpeg/png/webp/gif)');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Max 5MB');
    const { key } = await this.storage.upload(file.buffer, {
      folder: 'newsletter',
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    });
    const encodedKey = Buffer.from(key).toString('base64url');
    const apiBase = this.config.get<string>('API_BASE_URL') ?? 'http://localhost:3000';
    return { key, url: `${apiBase}/api/v1/admin/newsletter/image/${encodedKey}` };
  }

  @Get('image/:key')
  @Public()
  async proxyImage(@Param('key') encodedKey: string, @Res() res: Response) {
    try {
      const key = Buffer.from(encodedKey, 'base64url').toString();
      const url = await this.storage.getSignedUrl(key, 3600);
      res.redirect(url);
    } catch {
      res.status(404).send('Görsel bulunamadı');
    }
  }

  // ── Aboneler ──────────────────────────────────────────────────────────────

  @Get('subscribers')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async getSubscribers(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = Math.min(parseInt(limit ?? '50', 10), 100);
    const off = parseInt(offset ?? '0', 10);
    const url = new URL('https://api.brevo.com/v3/contacts');
    url.searchParams.set('limit', String(lim));
    url.searchParams.set('offset', String(off));
    if (this.brevoListId) url.searchParams.set('listIds', this.brevoListId);
    const res = await fetch(url.toString(), { headers: { 'api-key': this.brevoKey } });
    if (!res.ok) return { contacts: [], count: 0 };
    return res.json();
  }

  // ── Aylık İçerik Özeti ────────────────────────────────────────────────────

  @Get('monthly-content')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async getMonthlyContent(@Query('month') month?: string) {
    const m = month ?? new Date().toISOString().slice(0, 7);
    const [yr, mo] = m.split('-').map(Number);
    const start = new Date(yr!, mo! - 1, 1);
    const end = new Date(yr!, mo!, 0, 23, 59, 59, 999);

    const queryNames = ['events','trainings','jobs','competitions','qa','projects','talents','surveys','products'];
    const results = await Promise.allSettled([
      // Etkinlikler — o ayki tarih aralığı
      this.db.select({
        id: events.id, slug: events.slug, title: events.title,
        type: events.type, dateStart: events.dateStart, location: events.location,
        isPublished: events.isPublished,
      }).from(events)
        .where(and(gte(events.dateStart, start), lte(events.dateStart, end)))
        .orderBy(events.dateStart),

      // Eğitimler — o ayki tarih aralığı
      this.db.select({
        id: trainings.id, slug: trainings.slug, title: trainings.title,
        instructor: trainings.instructor, level: trainings.level, format: trainings.format,
        isPublished: trainings.isPublished, startDate: trainings.startDate,
      }).from(trainings)
        .where(and(isNotNull(trainings.startDate), gte(trainings.startDate, start), lte(trainings.startDate, end))),

      // İlan Panosu — o ayki yayınlananlar
      this.db.select({
        id: jobListings.id, title: jobListings.title, company: jobListings.company,
        location: jobListings.location, type: jobListings.type, publishedAt: jobListings.publishedAt,
      }).from(jobListings)
        .where(and(
          eq(jobListings.status, 'published'),
          isNotNull(jobListings.publishedAt),
          gte(jobListings.publishedAt, start),
          lte(jobListings.publishedAt, end),
        )),

      // Yarışmalar — son başvuru o ayda
      this.db.select({
        id: competitions.id, slug: competitions.slug, title: competitions.title,
        deadline: competitions.deadline,
      }).from(competitions)
        .where(and(isNotNull(competitions.deadline), gte(competitions.deadline, start), lte(competitions.deadline, end))),

      // Soru & Cevap — Sahne'de yayınlananlar (tarih filtresi yok, en güncel 20)
      this.db.select({
        id: communityQuestions.id, questionText: communityQuestions.questionText,
        category: communityQuestions.category, createdAt: communityQuestions.createdAt,
        isFeatured: communityQuestions.isFeatured,
      }).from(communityQuestions)
        .where(eq(communityQuestions.isSahnePublished, true))
        .orderBy(desc(communityQuestions.createdAt)).limit(20),

      // Projeler — aktif & yayınlananlar (tarih filtresi yok, en güncel 20)
      this.db.select({
        id: projects.id, slug: projects.slug, title: projects.title,
        authorName: projects.authorName, authorTag: projects.authorTag,
        status: projects.status, isPublished: projects.isPublished,
      }).from(projects)
        .where(eq(projects.isPublished, true))
        .orderBy(desc(projects.createdAt)).limit(20),

      // Yetenekler — yayınlananlar (tarih filtresi yok, en güncel 20)
      this.db.select({
        id: talents.id, title: talents.title, category: talents.category,
        displayName: talents.displayName, isPublished: talents.isPublished,
      }).from(talents)
        .where(eq(talents.isPublished, true))
        .orderBy(desc(talents.createdAt)).limit(20),

      // Anketler — aktif olanlar
      this.db.select({
        id: surveys.id, title: surveys.title, description: surveys.description,
        status: surveys.status, responseCount: surveys.responseCount,
      }).from(surveys)
        .where(eq(surveys.status, 'active'))
        .orderBy(desc(surveys.createdAt)).limit(10),

      // Mağaza — aktif ürünler (son 20)
      this.db.select({
        id: storeProducts.id, slug: storeProducts.slug, title: storeProducts.title,
        type: storeProducts.type, price: storeProducts.price,
      }).from(storeProducts)
        .where(eq(storeProducts.status, 'active'))
        .orderBy(storeProducts.sortOrder).limit(20),
    ]);

    results.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`[newsletter/monthly-content] ${queryNames[i]} sorgusu başarısız:`, r.reason);
    });

    const [evR, trR, jobR, compR, qaR, projR, talR, survR, prodR] = results;
    const monthEvents   = evR.status   === 'fulfilled' ? evR.value   : [];
    const monthTrainings = trR.status  === 'fulfilled' ? trR.value   : [];
    const monthJobs      = jobR.status === 'fulfilled' ? jobR.value  : [];
    const monthComps     = compR.status=== 'fulfilled' ? compR.value : [];
    const monthQa        = qaR.status  === 'fulfilled' ? qaR.value   : [];
    const monthProjects  = projR.status=== 'fulfilled' ? projR.value : [];
    const monthTalents   = talR.status === 'fulfilled' ? talR.value  : [];
    const monthSurveys   = survR.status=== 'fulfilled' ? survR.value : [];
    const monthProducts  = prodR.status=== 'fulfilled' ? prodR.value : [];

    // Meslekte Yeni İdoller — siteSettings'den JSON olarak
    let monthIdols: Array<{ id: string; name: string; title: string; organization: string; description?: string; mediaUrl?: string }> = [];
    try {
      const idolRow = await this.db.select({ value: siteSettings.value })
        .from(siteSettings).where(eq(siteSettings.key, 'meslekte_yeni_idoller')).limit(1);
      const parsed = idolRow[0]?.value ? JSON.parse(idolRow[0].value) as { idols?: typeof monthIdols } : null;
      monthIdols = parsed?.idols ?? [];
      monthIdols = monthIdols.map((idol, i) => ({ ...idol, id: idol.id ?? String(i) }));
    } catch (e) { console.error('[newsletter/monthly-content] siteSettings sorgusu başarısız:', e); }

    return {
      month: m,
      events: monthEvents,
      trainings: monthTrainings,
      jobs: monthJobs,
      competitions: monthComps,
      qa: monthQa,
      projects: monthProjects,
      talents: monthTalents,
      surveys: monthSurveys,
      products: monthProducts,
      idols: monthIdols,
    };
  }

  // ── Abone Yönetimi ───────────────────────────────────────────────────────

  @Patch('subscribers/:email/status')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async updateSubscriberStatus(
    @Param('email') email: string,
    @Body() body: { emailBlacklisted: boolean },
  ) {
    const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
      body: JSON.stringify({ emailBlacklisted: body.emailBlacklisted }),
    });
    return { ok: res.ok };
  }

  @Delete('subscribers/:email')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async removeSubscriber(@Param('email') email: string) {
    const listId = this.brevoListId;
    if (!listId) {
      // Liste ID yoksa kişiyi tamamen sil
      const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'api-key': this.brevoKey },
      });
      return { ok: res.ok };
    }
    // Liste ID varsa sadece listeden çıkar
    const res = await fetch(`https://api.brevo.com/v3/lists/${listId}/contacts/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
      body: JSON.stringify({ emails: [email] }),
    });
    return { ok: res.ok };
  }

  // ── Bülten CRUD ───────────────────────────────────────────────────────────

  @Get('newsletters')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async list() {
    return this.db.select().from(newsletters).orderBy(desc(newsletters.createdAt)).limit(100);
  }

  @Get('newsletters/:id')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async getOne(@Param('id') id: string) {
    const [n] = await this.db.select().from(newsletters).where(eq(newsletters.id, id));
    return n ?? null;
  }

  @Post('newsletters')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async create(@Body() body: {
    title: string; month: string; subject: string;
    htmlBody?: string; selectedContent?: Record<string, unknown>;
    channels?: string[]; whatsappTemplateName?: string; whatsappLanguage?: string;
    scheduledAt?: string;
  }) {
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined;
    const [n] = await this.db.insert(newsletters).values({
      title: body.title, month: body.month, subject: body.subject,
      htmlBody: body.htmlBody, selectedContent: body.selectedContent as never,
      channels: body.channels ?? ['email'],
      whatsappTemplateName: body.whatsappTemplateName,
      whatsappLanguage: body.whatsappLanguage ?? 'tr',
      scheduledAt,
      status: scheduledAt ? 'scheduled' : 'draft',
    }).returning();
    return n;
  }

  @Put('newsletters/:id')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async update(@Param('id') id: string, @Body() body: Partial<{
    title: string; subject: string; htmlBody: string;
    selectedContent: Record<string, unknown>; channels: string[];
    whatsappTemplateName: string; whatsappLanguage: string;
    scheduledAt: string | null;
  }>) {
    const { scheduledAt: rawScheduled, ...rest } = body;
    const scheduledAt = rawScheduled === null ? null : rawScheduled ? new Date(rawScheduled) : undefined;
    const [n] = await this.db.update(newsletters)
      .set({
        ...rest,
        selectedContent: rest.selectedContent as never,
        ...(scheduledAt !== undefined ? { scheduledAt, status: scheduledAt ? 'scheduled' : 'draft' } : {}),
        updatedAt: new Date(),
      })
      .where(and(
        eq(newsletters.id, id),
        or(eq(newsletters.status, 'draft'), eq(newsletters.status, 'scheduled')),
      ))
      .returning();
    return n;
  }

  @Delete('newsletters/:id')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async remove(@Param('id') id: string) {
    await this.db.delete(newsletters).where(and(
      eq(newsletters.id, id),
      or(eq(newsletters.status, 'draft'), eq(newsletters.status, 'scheduled')),
    ));
    return { ok: true };
  }

  // ── Test Gönderimi ────────────────────────────────────────────────────────

  @Post('newsletters/:id/test')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async testSend(@Param('id') id: string, @Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('E-posta adresi zorunlu');
    const [n] = await this.db.select().from(newsletters).where(eq(newsletters.id, id));
    if (!n) throw new BadRequestException('Bülten bulunamadı');
    if (!n.htmlBody) throw new BadRequestException('HTML içerik boş');

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
      body: JSON.stringify({
        subject: `[TEST] ${n.subject}`,
        htmlContent: n.htmlBody,
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email: body.email }],
      }),
    });

    return { ok: res.ok };
  }

  // ── Gönder ────────────────────────────────────────────────────────────────

  @Post('newsletters/:id/send')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async send(@Param('id') id: string) {
    const [n] = await this.db.select().from(newsletters).where(eq(newsletters.id, id));
    if (!n) throw new BadRequestException('Bülten bulunamadı');
    if (n.status === 'sent') throw new BadRequestException('Bu bülten zaten gönderildi');
    if (n.status === 'sending') throw new BadRequestException('Bu bülten zaten gönderiliyor');
    if (n.status !== 'draft' && n.status !== 'scheduled') throw new BadRequestException('Bu bülten gönderilemez');
    if (!n.htmlBody) throw new BadRequestException('HTML içerik boş');

    const channels = (n.channels ?? ['email']) as string[];
    let emailCount = 0;
    let brevioCampaignId: number | undefined;

    // EMAIL — Brevo Campaign API
    if (channels.includes('email')) {
      const sc = n.selectedContent as Record<string, unknown> | null;
      const subjectB = typeof sc?.subjectB === 'string' && sc.subjectB.trim() ? sc.subjectB.trim() : null;
      const preheader = typeof sc?.preheader === 'string' && sc.preheader.trim() ? sc.preheader.trim() : null;
      // Segment ID: custom value in selectedContent overrides env list
      const rawSegmentId = sc?.brevoSegmentId;
      const segmentId = typeof rawSegmentId === 'string' && rawSegmentId.trim() && !isNaN(Number(rawSegmentId))
        ? Number(rawSegmentId) : null;
      const listId = segmentId ? null : (this.brevoListId ? Number(this.brevoListId) : null);

      const campRes = await fetch('https://api.brevo.com/v3/emailCampaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
        body: JSON.stringify({
          name: n.title,
          subject: n.subject,
          type: 'classic',
          htmlContent: n.htmlBody,
          sender: { name: this.senderName, email: this.senderEmail },
          ...(preheader ? { previewText: preheader } : {}),
          ...(segmentId
            ? { recipients: { segmentIds: [segmentId] } }
            : listId ? { recipients: { listIds: [listId] } } : {}),
          ...(subjectB ? {
            abTesting: true,
            subjectB,
            splitRule: 50,
            winnerCriteria: 'open',
            winnerDelay: 6,
          } : {}),
        }),
      });

      if (campRes.ok) {
        const camp = await campRes.json() as { id: number };
        brevioCampaignId = camp.id;
        await fetch(`https://api.brevo.com/v3/emailCampaigns/${camp.id}/sendNow`, {
          method: 'POST', headers: { 'api-key': this.brevoKey },
        });
        const infoRes = await fetch(`https://api.brevo.com/v3/contacts?listIds=${this.brevoListId}&limit=1`, {
          headers: { 'api-key': this.brevoKey },
        });
        if (infoRes.ok) {
          const info = await infoRes.json() as { count?: number };
          emailCount = info.count ?? 0;
        }
      }
    }

    // DB'yi hemen güncelle — WhatsApp arka planda devam edecek
    const [updated] = await this.db.update(newsletters)
      .set({
        status: 'sent', sentAt: new Date(), emailCount,
        ...(brevioCampaignId ? { brevioCampaignId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(newsletters.id, id))
      .returning();

    // WHATSAPP — arka planda (HTTP response'u bekletmez)
    if (channels.includes('whatsapp') && n.whatsappTemplateName) {
      void this.sendWhatsappInBackground(id, n.whatsappTemplateName, n.whatsappLanguage ?? 'tr', n.month);
    }

    return updated;
  }

  // ── Segmente Gönderim ──────────────────────────────────────────────────────
  // Seçili segment filtrelerine göre geçici Brevo listesi oluşturur, kampanya gönderir, listeyi siler.

  @Post('newsletters/:id/send-segment')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async sendToSegment(
    @Param('id') id: string,
    @Body() body: {
      tags?: string[];
      regions?: string[];
      sources?: string[];
      interestAreas?: string[];
      behavior?: 'active_90d' | 'inactive_90d' | 'never_opened';
    },
  ) {
    const [n] = await this.db.select().from(newsletters).where(eq(newsletters.id, id));
    if (!n) throw new BadRequestException('Bülten bulunamadı');
    if (!n.htmlBody) throw new BadRequestException('HTML içerik boş');
    if (!this.brevoKey) throw new BadRequestException('Brevo API anahtarı eksik');

    // 1. Segment filtreleme
    const profiles = await this.db
      .select({ email: newsletterSubscriberProfiles.email, tags: newsletterSubscriberProfiles.tags, region: newsletterSubscriberProfiles.region, source: newsletterSubscriberProfiles.source, interestAreas: newsletterSubscriberProfiles.interestAreas })
      .from(newsletterSubscriberProfiles)
      .where(and(eq(newsletterSubscriberProfiles.isUnsubscribed, false), eq(newsletterSubscriberProfiles.isConfirmed, true)));

    const filtered = profiles.filter(p => {
      const ptags = (p.tags as string[]) ?? [];
      const pAreas = (p.interestAreas as string[]) ?? [];
      if (body.tags?.length && !body.tags.some(t => ptags.includes(t))) return false;
      if (body.regions?.length && !body.regions.includes(p.region ?? '')) return false;
      if (body.sources?.length && !body.sources.includes(p.source ?? '')) return false;
      if (body.interestAreas?.length && !body.interestAreas.some(a => pAreas.includes(a))) return false;
      return true;
    });

    if (filtered.length === 0) throw new BadRequestException('Segment boş — gönderim iptal edildi');

    // 2. Geçici Brevo listesi oluştur
    const listName = `tmp_segment_${id}_${Date.now()}`;
    const listRes = await fetch('https://api.brevo.com/v3/contacts/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
      body: JSON.stringify({ name: listName, folderId: 1 }),
    });
    if (!listRes.ok) throw new BadRequestException('Brevo listesi oluşturulamadı');
    const { id: tmpListId } = await listRes.json() as { id: number };

    // 3. Kişileri listeye ekle (batch 150)
    const emails = filtered.map(p => p.email);
    for (let i = 0; i < emails.length; i += 150) {
      const batch = emails.slice(i, i + 150);
      await fetch(`https://api.brevo.com/v3/contacts/lists/${tmpListId}/contacts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
        body: JSON.stringify({ emails: batch }),
      });
    }

    // 4. Kampanya oluştur ve gönder
    const campRes = await fetch('https://api.brevo.com/v3/emailCampaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
      body: JSON.stringify({
        name: `${n.title} [segment]`,
        subject: n.subject,
        type: 'classic',
        htmlContent: n.htmlBody,
        sender: { name: this.senderName, email: this.senderEmail },
        recipients: { listIds: [tmpListId] },
      }),
    });
    if (!campRes.ok) throw new BadRequestException('Brevo kampanyası oluşturulamadı');
    const { id: campId } = await campRes.json() as { id: number };
    await fetch(`https://api.brevo.com/v3/emailCampaigns/${campId}/sendNow`, {
      method: 'POST', headers: { 'api-key': this.brevoKey },
    });

    // 5. Geçici listeyi arka planda sil (30 saniye sonra)
    setTimeout(async () => {
      try {
        await fetch(`https://api.brevo.com/v3/contacts/lists/${tmpListId}`, {
          method: 'DELETE', headers: { 'api-key': this.brevoKey },
        });
      } catch { /* sessiz */ }
    }, 30_000);

    return { ok: true, recipientCount: filtered.length, campaignId: campId };
  }

  // ── Brevo Kampanya İstatistikleri ─────────────────────────────────────────

  @Get('newsletters/:id/stats')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async getCampaignStats(@Param('id') id: string) {
    const [n] = await this.db.select({ brevioCampaignId: newsletters.brevioCampaignId })
      .from(newsletters).where(eq(newsletters.id, id));
    if (!n?.brevioCampaignId) return null;

    const res = await fetch(`https://api.brevo.com/v3/emailCampaigns/${n.brevioCampaignId}`, {
      headers: { 'api-key': this.brevoKey },
    });
    if (!res.ok) return null;
    const data = await res.json() as {
      statistics?: {
        globalStats?: {
          uniqueClicks?: number; clickers?: number;
          uniqueViews?: number; opens?: number;
          unsubscriptions?: number; hardBounces?: number; softBounces?: number;
          delivered?: number; sent?: number;
        };
      };
    };
    const s = data.statistics?.globalStats ?? {};
    return {
      delivered: s.delivered ?? 0,
      opens: s.uniqueViews ?? s.opens ?? 0,
      clicks: s.uniqueClicks ?? s.clickers ?? 0,
      unsubscriptions: s.unsubscriptions ?? 0,
      hardBounces: s.hardBounces ?? 0,
      softBounces: s.softBounces ?? 0,
      openRate: s.delivered ? Math.round(((s.uniqueViews ?? 0) / s.delivered) * 100) : 0,
      clickRate: s.delivered ? Math.round(((s.uniqueClicks ?? 0) / s.delivered) * 100) : 0,
    };
  }

  // ── Hoş Geldiniz Ayarları ─────────────────────────────────────────────────

  @Get('welcome-settings')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async getWelcomeSettings() {
    const rows = await this.db.select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(or(eq(siteSettings.key, 'newsletter_welcome_enabled'), eq(siteSettings.key, 'newsletter_welcome_html'), eq(siteSettings.key, 'newsletter_welcome_subject')));
    const map: Record<string, string> = {};
    rows.forEach(r => { map[r.key] = r.value ?? ''; });
    return {
      enabled: map['newsletter_welcome_enabled'] === 'true',
      subject: map['newsletter_welcome_subject'] ?? 'Haritailesi Topluluğuna Hoş Geldiniz 🎉',
      html: map['newsletter_welcome_html'] ?? '',
    };
  }

  @Put('welcome-settings')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async updateWelcomeSettings(@Body() body: { enabled?: boolean; subject?: string; html?: string }) {
    const upsert = async (key: string, value: string) => {
      const existing = await this.db.select({ key: siteSettings.key }).from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
      if (existing.length > 0) {
        await this.db.update(siteSettings).set({ value, updatedAt: new Date() }).where(eq(siteSettings.key, key));
      } else {
        await this.db.insert(siteSettings).values({ key, value });
      }
    };
    if (body.enabled !== undefined) await upsert('newsletter_welcome_enabled', String(body.enabled));
    if (body.subject !== undefined) await upsert('newsletter_welcome_subject', body.subject);
    if (body.html !== undefined) await upsert('newsletter_welcome_html', body.html);
    return { ok: true };
  }

  // ── Brevo Webhook (yeni abone → welcome e-posta) ──────────────────────────

  @Post('webhook/brevo')
  @Public()
  async brevoWebhook(@Body() body: unknown) {
    try {
      const event = body as Record<string, unknown>;
      // Brevo webhook event: event.event === 'subscribe' (contact list add)
      if (event['event'] !== 'subscribe' && event['event'] !== 'contact.subscribed') return { ok: true };
      const email = event['email'] as string | undefined;
      if (!email) return { ok: true };

      // Welcome e-posta ayarlarını kontrol et
      const rows = await this.db.select({ key: siteSettings.key, value: siteSettings.value })
        .from(siteSettings)
        .where(or(eq(siteSettings.key, 'newsletter_welcome_enabled'), eq(siteSettings.key, 'newsletter_welcome_html'), eq(siteSettings.key, 'newsletter_welcome_subject')));
      const map: Record<string, string> = {};
      rows.forEach(r => { map[r.key] = r.value ?? ''; });
      if (map['newsletter_welcome_enabled'] !== 'true') return { ok: true };

      const html = map['newsletter_welcome_html'];
      const subject = map['newsletter_welcome_subject'] ?? 'Haritailesi Topluluğuna Hoş Geldiniz 🎉';
      if (!html) return { ok: true };

      // Welcome e-posta gönder (Brevo transactional)
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
        body: JSON.stringify({
          subject,
          htmlContent: html,
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email }],
          params: { EMAIL: email },
        }),
      });
    } catch (e) { console.error('[brevo-webhook]', e); }
    return { ok: true };
  }

  // ── WhatsApp Şablon Listesi ───────────────────────────────────────────────

  @Get('whatsapp-templates')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async getWhatsappTemplates() {
    const wabaId = this.config.get<string>('WHATSAPP_WABA_ID');
    const token = this.config.get<string>('WHATSAPP_TOKEN');
    if (!wabaId || !token) return { templates: [] };

    const url = new URL(`https://graph.facebook.com/v25.0/${wabaId}/message_templates`);
    url.searchParams.set('fields', 'name,status,language,category');
    url.searchParams.set('status', 'APPROVED');
    url.searchParams.set('limit', '50');

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return { templates: [] };
    const data = await res.json() as { data?: Array<{ name: string; status: string; language: string; category: string }> };
    return { templates: data.data ?? [] };
  }

  // ── Zamanlanmış Gönderim Cron ─────────────────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNewsletters() {
    const now = new Date();
    const pending = await this.db.select().from(newsletters)
      .where(and(eq(newsletters.status, 'scheduled'), isNotNull(newsletters.scheduledAt), lt(newsletters.scheduledAt, now)));
    for (const n of pending) {
      try {
        // Önce 'sending' yap (tekrar tetiklenmesin)
        await this.db.update(newsletters)
          .set({ status: 'sending', updatedAt: new Date() })
          .where(and(eq(newsletters.id, n.id), eq(newsletters.status, 'scheduled')));
        // Gönder
        await this.send(n.id);
      } catch (e) {
        await this.db.update(newsletters)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(newsletters.id, n.id));
        console.error(`[newsletter/cron] gönderim hatası id=${n.id}:`, e);
      }
    }
  }

  private async sendWhatsappInBackground(newsletterId: string, templateName: string, lang: string, month: string) {
    try {
      const targetUsers = await this.db.select({ phone: userProfiles.phone })
        .from(userProfiles)
        .where(and(isNotNull(userProfiles.phone), eq(userProfiles.whatsappConsent, true)));

      const [yr, mo] = month.split('-');
      const monthLabel = new Date(parseInt(yr!), parseInt(mo!) - 1, 1)
        .toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

      let count = 0;
      for (const u of targetUsers) {
        if (!u.phone) continue;
        try {
          await this.whatsapp.sendTemplate(u.phone, templateName, lang,
            [{ type: 'body', parameters: [{ type: 'text', text: monthLabel }] }]);
          count++;
          // Meta rate limit: ~80 mesaj/sn — küçük gecikme
          await new Promise(r => setTimeout(r, 50));
        } catch { /* bir kullanıcı hata verse diğerlerine devam et */ }
      }

      await this.db.update(newsletters)
        .set({ whatsappCount: count, updatedAt: new Date() })
        .where(eq(newsletters.id, newsletterId));
    } catch { /* arka plan hatası — sessizce geç */ }
  }

  // ── Subscriber Profiles (FAZ 4) ────────────────────────────────────────────

  @Get('subscriber-profile/:email')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async getSubscriberProfile(@Param('email') email: string) {
    const [profile] = await this.db
      .select()
      .from(newsletterSubscriberProfiles)
      .where(eq(newsletterSubscriberProfiles.email, email))
      .limit(1);
    return profile ?? { email, tags: [], interestAreas: [], region: null, source: null, notes: null };
  }

  @Put('subscriber-profile/:email')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async upsertSubscriberProfile(
    @Param('email') email: string,
    @Body() body: { tags?: string[]; interestAreas?: string[]; region?: string; source?: string; notes?: string }
  ) {
    const [existing] = await this.db
      .select({ email: newsletterSubscriberProfiles.email })
      .from(newsletterSubscriberProfiles)
      .where(eq(newsletterSubscriberProfiles.email, email))
      .limit(1);

    if (existing) {
      await this.db.update(newsletterSubscriberProfiles)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(newsletterSubscriberProfiles.email, email));
    } else {
      await this.db.insert(newsletterSubscriberProfiles)
        .values({ email, tags: body.tags ?? [], interestAreas: body.interestAreas ?? [], ...body });
    }
    return { ok: true };
  }

  @Post('subscribers/bulk-tag')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async bulkTag(@Body() body: { emails: string[]; addTags?: string[]; removeTags?: string[] }) {
    if (!body.emails?.length) return { updated: 0 };
    let updated = 0;
    for (const email of body.emails) {
      const [profile] = await this.db
        .select()
        .from(newsletterSubscriberProfiles)
        .where(eq(newsletterSubscriberProfiles.email, email))
        .limit(1);
      const current: string[] = (profile?.tags as string[]) ?? [];
      let next = [...current];
      if (body.addTags) next = [...new Set([...next, ...body.addTags])];
      if (body.removeTags) next = next.filter(t => !body.removeTags!.includes(t));
      if (profile) {
        await this.db.update(newsletterSubscriberProfiles)
          .set({ tags: next, updatedAt: new Date() })
          .where(eq(newsletterSubscriberProfiles.email, email));
      } else {
        await this.db.insert(newsletterSubscriberProfiles).values({ email, tags: next, interestAreas: [] });
      }
      updated++;
    }
    return { updated };
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  @Get('tags')
  @RequirePermission(Perm.NEWSLETTER_READ)
  listTags() {
    return this.db.select().from(newsletterTags).orderBy(newsletterTags.slug);
  }

  @Post('tags')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async createTag(@Body() body: { slug: string; label: string; color?: string }) {
    if (!body.slug?.trim() || !body.label?.trim()) throw new BadRequestException('slug ve label zorunludur');
    const [row] = await this.db.insert(newsletterTags).values({
      slug: body.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      label: body.label.trim(),
      ...(body.color ? { color: body.color } : {}),
    }).returning();
    return row;
  }

  @Delete('tags/:slug')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async deleteTag(@Param('slug') slug: string) {
    await this.db.delete(newsletterTags).where(eq(newsletterTags.slug, slug));
    return { ok: true };
  }

  // ── Dinamik Segment Motor ────────────────────────────────────────────────────

  @Post('segments/preview')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async previewSegment(
    @Body() body: {
      tags?: string[];
      regions?: string[];
      sources?: string[];
      interestAreas?: string[];
      behavior?: 'active_90d' | 'inactive_90d' | 'never_opened';
    },
  ) {
    const profiles = await this.db
      .select({
        email: newsletterSubscriberProfiles.email,
        tags: newsletterSubscriberProfiles.tags,
        region: newsletterSubscriberProfiles.region,
        source: newsletterSubscriberProfiles.source,
        interestAreas: newsletterSubscriberProfiles.interestAreas,
      })
      .from(newsletterSubscriberProfiles)
      .where(eq(newsletterSubscriberProfiles.isUnsubscribed, false));

    let activeEmails: Set<string> | null = null;
    if (body.behavior && this.brevoKey) {
      try {
        const since = new Date();
        since.setDate(since.getDate() - 90);
        const url = new URL('https://api.brevo.com/v3/contacts');
        url.searchParams.set('limit', '1000');
        url.searchParams.set('modifiedSince', since.toISOString());
        const r = await fetch(url.toString(), { headers: { 'api-key': this.brevoKey } });
        if (r.ok) {
          const data = await r.json() as { contacts: { email: string }[] };
          activeEmails = new Set((data.contacts ?? []).map((c: { email: string }) => c.email.toLowerCase()));
        }
      } catch { /* Brevo sorgusu başarısız, filtreden vazgeç */ }
    }

    const filtered = profiles.filter(p => {
      const ptags = (p.tags as string[]) ?? [];
      const pAreas = (p.interestAreas as string[]) ?? [];

      if (body.tags?.length && !body.tags.some(t => ptags.includes(t))) return false;
      if (body.regions?.length && !body.regions.includes(p.region ?? '')) return false;
      if (body.sources?.length && !body.sources.includes(p.source ?? '')) return false;
      if (body.interestAreas?.length && !body.interestAreas.some(a => pAreas.includes(a))) return false;

      if (activeEmails !== null) {
        const isActive = activeEmails.has(p.email.toLowerCase());
        if (body.behavior === 'active_90d' && !isActive) return false;
        if (body.behavior === 'inactive_90d' && isActive) return false;
        if (body.behavior === 'never_opened' && activeEmails.size > 0 && isActive) return false;
      }

      return true;
    });

    return {
      count: filtered.length,
      sample: filtered.slice(0, 5).map(p => p.email),
      behaviorDataAvailable: activeEmails !== null,
    };
  }

  // ── Brevo Kontakt Sayısı ──────────────────────────────────────────────────────

  @Get('brevo-contacts/count')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async brevoContactsCount() {
    if (!this.brevoKey) return { count: 0 };
    try {
      // Fetch all contacts (up to 1000) and subtract blacklisted to match the subscribers tab logic
      const url = new URL('https://api.brevo.com/v3/contacts');
      url.searchParams.set('limit', '1000');
      url.searchParams.set('offset', '0');
      if (this.brevoListId) url.searchParams.set('listIds', this.brevoListId);
      const r = await fetch(url.toString(), { headers: { 'api-key': this.brevoKey } });
      if (!r.ok) return { count: 0 };
      const data = await r.json() as { contacts: Array<{ emailBlacklisted: boolean }>; count: number };
      const contacts = data.contacts ?? [];
      const blacklisted = contacts.filter(c => c.emailBlacklisted).length;
      return { count: (data.count ?? 0) - blacklisted };
    } catch { return { count: 0 }; }
  }

  // ── Abone Büyüme Trendi (DB snapshot bazlı) ──────────────────────────────────

  @Get('brevo-contacts/growth')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async brevoContactsGrowth() {
    try {
      // Son 30 günlük snapshot'ları DB'den çek
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceStr = since.toISOString().slice(0, 10);

      const snapshots = await this.db
        .select({ date: newsletterGrowthSnapshots.date, count: newsletterGrowthSnapshots.count })
        .from(newsletterGrowthSnapshots)
        .where(gte(newsletterGrowthSnapshots.date, sinceStr))
        .orderBy(asc(newsletterGrowthSnapshots.date));

      // Son 4 haftayı haftalık bucket'lara dök
      const now = new Date();
      const weeks = [3, 2, 1, 0].map(weeksAgo => {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - weeksAgo * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        const weekStartStr = weekStart.toISOString().slice(0, 10);
        const weekEndStr = weekEnd.toISOString().slice(0, 10);

        const inRange = snapshots.filter(s => s.date >= weekStartStr && s.date <= weekEndStr);
        // Büyüme = bu haftanın sonu − başı sayısı
        const first = inRange[0]?.count ?? null;
        const last = inRange[inRange.length - 1]?.count ?? null;
        const growth = first !== null && last !== null ? Math.max(0, last - first) : 0;

        const label = weeksAgo === 0 ? 'Bu Hafta'
          : weeksAgo === 1 ? 'Geçen Hafta'
          : weeksAgo === 2 ? '2 Hafta Önce'
          : '3 Hafta Önce';
        return { label, count: growth };
      });

      // Bu ay toplam büyüme
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const monthSnaps = snapshots.filter(s => s.date >= monthStart);
      const monthFirst = monthSnaps[0]?.count ?? null;
      const monthLast = monthSnaps[monthSnaps.length - 1]?.count ?? null;
      const totalNewThisMonth = monthFirst !== null && monthLast !== null
        ? Math.max(0, monthLast - monthFirst) : 0;

      return { totalNewThisMonth, weeks };
    } catch { return { totalNewThisMonth: 0, weeks: [] }; }
  }

  // ── Hard Bounce Sync Cron (her gece 02:00) ───────────────────────────────────
  // Brevo'da emailBlacklisted=true olan kişileri yerel DB'de isUnsubscribed=true yap

  @Cron('0 2 * * *')
  async syncHardBounces() {
    if (!this.brevoKey) return;
    try {
      let offset = 0;
      const limit = 1000;
      let totalSynced = 0;
      while (true) {
        const url = new URL('https://api.brevo.com/v3/contacts');
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('offset', String(offset));
        url.searchParams.set('emailBlacklisted', 'true');
        const r = await fetch(url.toString(), { headers: { 'api-key': this.brevoKey } });
        if (!r.ok) break;
        const data = await r.json() as { contacts?: { email: string }[] };
        const emails = (data.contacts ?? []).map(c => c.email).filter(Boolean);
        if (emails.length === 0) break;
        for (const email of emails) {
          await this.db.insert(newsletterSubscriberProfiles)
            .values({ email, isUnsubscribed: true, tags: [], interestAreas: [] })
            .onConflictDoUpdate({
              target: newsletterSubscriberProfiles.email,
              set: { isUnsubscribed: true, updatedAt: new Date() },
            });
        }
        totalSynced += emails.length;
        if (emails.length < limit) break;
        offset += limit;
      }
      if (totalSynced > 0) console.log(`[newsletter/bounce-sync] ${totalSynced} kara liste kişi senkronize edildi`);
    } catch (e) { console.error('[newsletter/bounce-sync] hata:', e); }
  }

  // ── Aboneleri İçe Aktar ───────────────────────────────────────────────────────

  @Post('subscribers/import')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async importSubscribers(@Body() body: { emails: string[] }) {
    if (!Array.isArray(body.emails) || body.emails.length === 0) return { added: 0, failed: 0 };
    const listId = this.brevoListId ? Number(this.brevoListId) : null;
    let added = 0; let failed = 0;
    for (const email of body.emails.slice(0, 500)) {
      try {
        const r = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
          body: JSON.stringify({ email, ...(listId ? { listIds: [listId] } : {}) }),
        });
        if (r.ok || r.status === 204) added++;
        else if (r.status === 400) {
          // Zaten var — güncelle (listeye ekle)
          if (listId) {
            await fetch('https://api.brevo.com/v3/contacts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
              body: JSON.stringify({ email, updateEnabled: true, listIds: [listId] }),
            });
          }
          added++;
        } else failed++;
      } catch { failed++; }
    }
    return { added, failed };
  }

  // ── Hareketsiz Abone Tespiti ──────────────────────────────────────────────────

  @Get('inactive-subscribers')
  @RequirePermission(Perm.NEWSLETTER_READ)
  async getInactiveSubscribers(@Query('days') days?: string) {
    const threshold = parseInt(days ?? '90', 10);
    if (!this.brevoKey) return { count: 0, emails: [] };
    try {
      const since = new Date();
      since.setDate(since.getDate() - threshold);
      // Tüm profilleri al
      const profiles = await this.db.select({ email: newsletterSubscriberProfiles.email })
        .from(newsletterSubscriberProfiles)
        .where(and(eq(newsletterSubscriberProfiles.isUnsubscribed, false), eq(newsletterSubscriberProfiles.isConfirmed, true)));

      // Brevo'dan son threshold gün içinde aktif olanları al
      const activeSet = new Set<string>();
      let offset = 0;
      while (true) {
        const url = new URL('https://api.brevo.com/v3/contacts');
        url.searchParams.set('limit', '1000');
        url.searchParams.set('offset', String(offset));
        url.searchParams.set('modifiedSince', since.toISOString());
        const r = await fetch(url.toString(), { headers: { 'api-key': this.brevoKey } });
        if (!r.ok) break;
        const data = await r.json() as { contacts?: { email: string }[] };
        const contacts = data.contacts ?? [];
        contacts.forEach(c => activeSet.add(c.email.toLowerCase()));
        if (contacts.length < 1000) break;
        offset += 1000;
      }

      const inactive = profiles.filter(p => !activeSet.has(p.email.toLowerCase())).map(p => p.email);
      return { count: inactive.length, emails: inactive.slice(0, 20), thresholdDays: threshold };
    } catch (e) { console.error('[newsletter/inactive]', e); return { count: 0, emails: [] }; }
  }

  // ── Günlük Snapshot Cron (23:55 her gece) ────────────────────────────────────

  @Cron('55 23 * * *')
  async snapshotSubscriberCount() {
    if (!this.brevoKey) return;
    try {
      const url = new URL('https://api.brevo.com/v3/contacts');
      url.searchParams.set('limit', '1');
      url.searchParams.set('offset', '0');
      if (this.brevoListId) url.searchParams.set('listIds', this.brevoListId);
      const r = await fetch(url.toString(), { headers: { 'api-key': this.brevoKey } });
      if (!r.ok) return;
      const data = await r.json() as { count?: number };
      const count = data.count ?? 0;
      const today = new Date().toISOString().slice(0, 10);
      await this.db.insert(newsletterGrowthSnapshots)
        .values({ date: today, count })
        .onConflictDoUpdate({ target: newsletterGrowthSnapshots.date, set: { count } });
      console.log(`[newsletter/snapshot] ${today}: ${count} abone`);
    } catch (e) { console.error('[newsletter/snapshot] hata:', e); }
  }

  // ── Tercih Merkezi (FAZ 4.5) ─────────────────────────────────────────────────
  // Token-based, @Public — subscriber edits their own preferences

  @Get('preferences/:token')
  @Public()
  async getPreferences(@Param('token') token: string) {
    const [profile] = await this.db
      .select()
      .from(newsletterSubscriberProfiles)
      .where(eq(newsletterSubscriberProfiles.preferenceToken, token))
      .limit(1);
    if (!profile) throw new BadRequestException('Geçersiz token');
    const tags = await this.db.select().from(newsletterTags).orderBy(newsletterTags.slug);
    return {
      email: profile.email,
      interestAreas: profile.interestAreas ?? [],
      tags: profile.tags ?? [],
      isUnsubscribed: profile.isUnsubscribed,
      availableTags: tags,
    };
  }

  @Put('preferences/:token')
  @Public()
  async updatePreferences(
    @Param('token') token: string,
    @Body() body: { interestAreas?: string[]; isUnsubscribed?: boolean }
  ) {
    const [profile] = await this.db
      .select({ email: newsletterSubscriberProfiles.email })
      .from(newsletterSubscriberProfiles)
      .where(eq(newsletterSubscriberProfiles.preferenceToken, token))
      .limit(1);
    if (!profile) throw new BadRequestException('Geçersiz token');

    await this.db.update(newsletterSubscriberProfiles)
      .set({
        ...(body.interestAreas !== undefined ? { interestAreas: body.interestAreas } : {}),
        ...(body.isUnsubscribed !== undefined ? { isUnsubscribed: body.isUnsubscribed } : {}),
        updatedAt: new Date(),
      })
      .where(eq(newsletterSubscriberProfiles.email, profile.email));

    return { ok: true };
  }

  // ── Bülten Arşivi (Public) ────────────────────────────────────────────────────

  @Get('archive')
  @Public()
  async getArchive() {
    const rows = await this.db
      .select({
        id: newsletters.id,
        title: newsletters.title,
        subject: newsletters.subject,
        month: newsletters.month,
        sentAt: newsletters.sentAt,
        emailCount: newsletters.emailCount,
      })
      .from(newsletters)
      .where(and(eq(newsletters.status, 'sent'), isNotNull(newsletters.sentAt)))
      .orderBy(desc(newsletters.sentAt))
      .limit(50);
    return rows;
  }

  @Get('archive/:id')
  @Public()
  async getArchiveItem(@Param('id') id: string) {
    const [n] = await this.db
      .select({
        id: newsletters.id,
        title: newsletters.title,
        subject: newsletters.subject,
        month: newsletters.month,
        sentAt: newsletters.sentAt,
        htmlBody: newsletters.htmlBody,
      })
      .from(newsletters)
      .where(and(eq(newsletters.id, id), eq(newsletters.status, 'sent')));
    return n ?? null;
  }

  // Generate a preference token for a subscriber (admin action)
  @Post('subscribers/generate-token')
  @RequirePermission(Perm.NEWSLETTER_WRITE)
  async generatePreferenceToken(@Body() body: { email: string }) {
    if (!body.email) throw new BadRequestException('email zorunludur');
    const token = `pref_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    const [existing] = await this.db
      .select({ email: newsletterSubscriberProfiles.email })
      .from(newsletterSubscriberProfiles)
      .where(eq(newsletterSubscriberProfiles.email, body.email))
      .limit(1);

    if (existing) {
      await this.db.update(newsletterSubscriberProfiles)
        .set({ preferenceToken: token, updatedAt: new Date() })
        .where(eq(newsletterSubscriberProfiles.email, body.email));
    } else {
      await this.db.insert(newsletterSubscriberProfiles)
        .values({ email: body.email, preferenceToken: token, tags: [], interestAreas: [] });
    }
    const apiBase = this.config.get<string>('API_BASE_URL') ?? 'http://localhost:3000';
    return { token, url: `${apiBase}/api/v1/admin/newsletter/preferences/${token}` };
  }
}
