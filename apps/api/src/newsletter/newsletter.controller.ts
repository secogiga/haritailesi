import { Body, Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import { SubscribeDto } from './subscribe.dto';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { newsletterSubscriberProfiles } from '@haritailesi/database';
import { eq } from 'drizzle-orm';
import { EmailService } from '../email/email.service';
import { randomUUID } from 'crypto';
import type { Response } from 'express';

@Public()
@Controller('newsletter')
export class NewsletterController {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  private get brevoKey() { return this.config.get<string>('BREVO_API_KEY') ?? ''; }
  private get brevoListId() { return this.config.get<string>('BREVO_NEWSLETTER_LIST_ID') ?? ''; }
  private get apiBase() { return this.config.get<string>('API_BASE_URL') ?? 'http://localhost:3000'; }
  private get webBase() { return this.config.get<string>('WEB_URL') ?? 'https://haritailesi.org'; }

  @Post('subscribe')
  @HttpCode(200)
  async subscribe(@Body() dto: SubscribeDto) {
    const email = dto.email.toLowerCase().trim();

    // Mevcut onaylı profil varsa tekrar mail atmaya gerek yok
    const [existing] = await this.db.select().from(newsletterSubscriberProfiles)
      .where(eq(newsletterSubscriberProfiles.email, email)).limit(1);

    if (existing?.isConfirmed) return { ok: true, already: true };

    // Token oluştur (48 saat geçerli)
    const token = randomUUID();
    const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await this.db.insert(newsletterSubscriberProfiles)
      .values({
        email,
        isConfirmed: false,
        confirmToken: token,
        confirmTokenExpiry: expiry,
        tags: [],
        interestAreas: [],
        source: 'web',
      })
      .onConflictDoUpdate({
        target: newsletterSubscriberProfiles.email,
        set: {
          isConfirmed: false,
          confirmToken: token,
          confirmTokenExpiry: expiry,
          updatedAt: new Date(),
        },
      });

    const confirmUrl = `${this.apiBase}/api/v1/newsletter/confirm?token=${token}`;
    await this.email.send(email, 'newsletter_confirm', { confirmUrl });

    return { ok: true, pending: true };
  }

  @Get('confirm')
  async confirm(@Query('token') token: string, @Res() res: Response) {
    const redirectBase = `${this.webBase}/bulten/dogrula`;

    if (!token) return res.redirect(`${redirectBase}?status=invalid`);

    const [profile] = await this.db.select().from(newsletterSubscriberProfiles)
      .where(eq(newsletterSubscriberProfiles.confirmToken, token)).limit(1);

    if (!profile) return res.redirect(`${redirectBase}?status=invalid`);

    if (profile.confirmTokenExpiry && profile.confirmTokenExpiry < new Date()) {
      return res.redirect(`${redirectBase}?status=expired`);
    }

    // Brevo'ya ekle
    try {
      const body: Record<string, unknown> = { email: profile.email, updateEnabled: true };
      const listId = this.brevoListId ? Number(this.brevoListId) : null;
      if (listId) body['listIds'] = [listId];
      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': this.brevoKey },
        body: JSON.stringify(body),
      });
    } catch { /* Brevo hatası gönderimi engellemesin */ }

    // Profili onayla
    await this.db.update(newsletterSubscriberProfiles)
      .set({ isConfirmed: true, confirmToken: null, confirmTokenExpiry: null, updatedAt: new Date() })
      .where(eq(newsletterSubscriberProfiles.email, profile.email));

    return res.redirect(`${redirectBase}?status=ok`);
  }
}
