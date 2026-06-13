import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, eq, gte, lte, isNotNull } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { jobListings, contentRequests, users, userProfiles } from '@haritailesi/database';
import { EmailService } from '../email/email.service';

@Injectable()
export class MarketplaceExpiryCron {
  private readonly logger = new Logger(MarketplaceExpiryCron.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly emailService: EmailService,
  ) {}

  // Her gün 10:00 İstanbul saatiyle çalışır
  @Cron('0 10 * * *', { timeZone: 'Europe/Istanbul' })
  async checkExpiringListings() {
    this.logger.log('Süresi yaklaşan ilan kontrolü başlatıldı…');

    const now = new Date();
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const in8Days = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);

    // 7 gün içinde dolacak, hâlâ published olan ilanlar
    const expiring = await this.db
      .select({
        id:               jobListings.id,
        title:            jobListings.title,
        expiresAt:        jobListings.expiresAt,
        submittedBy:      jobListings.submittedBy,
        contentRequestId: jobListings.contentRequestId,
      })
      .from(jobListings)
      .where(
        and(
          eq(jobListings.status, 'published'),
          isNotNull(jobListings.expiresAt),
          gte(jobListings.expiresAt, in7Days),
          lte(jobListings.expiresAt, in8Days),
        ),
      );

    if (!expiring.length) {
      this.logger.log('Süresi yaklaşan ilan yok.');
      return;
    }

    this.logger.log(`${expiring.length} ilan için hatırlatma gönderilecek.`);

    for (const listing of expiring) {
      try {
        let email: string | null = null;
        let displayName = 'Değerli Üye';

        // Önce üye üzerinden
        if (listing.submittedBy) {
          const [user] = await this.db
            .select({ email: users.email, displayName: userProfiles.displayName })
            .from(users)
            .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
            .where(eq(users.id, listing.submittedBy))
            .limit(1);
          if (user) { email = user.email; displayName = user.displayName ?? displayName; }
        }

        // Üye yoksa content request'ten
        if (!email && listing.contentRequestId) {
          const [req] = await this.db
            .select({ email: contentRequests.email, displayName: contentRequests.displayName })
            .from(contentRequests)
            .where(eq(contentRequests.id, listing.contentRequestId))
            .limit(1);
          if (req) { email = req.email; displayName = req.displayName; }
        }

        if (!email) continue;

        const daysLeft = Math.ceil(
          (new Date(listing.expiresAt!).getTime() - now.getTime()) / 86400000,
        );
        const expiresAt = new Date(listing.expiresAt!).toLocaleDateString('tr-TR', {
          day: 'numeric', month: 'long', year: 'numeric',
        });

        await this.emailService.sendListingExpiryReminder(email, {
          displayName,
          listingTitle: listing.title,
          daysLeft,
          expiresAt,
        });

        this.logger.log(`Hatırlatma gönderildi: ${email} — ${listing.title.slice(0, 50)}`);
      } catch (err) {
        this.logger.error(`Hatırlatma gönderilemedi: ${listing.id}`, err);
      }
    }
  }
}
