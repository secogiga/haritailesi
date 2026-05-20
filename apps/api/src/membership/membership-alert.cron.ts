import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MembershipService } from './membership.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class MembershipAlertCron {
  private readonly logger = new Logger(MembershipAlertCron.name);

  constructor(
    private readonly membershipService: MembershipService,
    private readonly emailService: EmailService,
  ) {}

  // Her gün saat 08:00 (Europe/Istanbul)
  @Cron('0 8 * * *', { timeZone: 'Europe/Istanbul' })
  async handleMembershipReminders() {
    this.logger.log('Üyelik hatırlatma cron çalışıyor...');

    await Promise.all([
      this.sendReminders(30),
      this.sendReminders(7),
      this.sendReminders(1),
      this.handleExpirations(),
    ]);
  }

  private async sendReminders(daysLeft: number) {
    const subs = await this.membershipService.getSubscriptionsForReminder(daysLeft);
    if (!subs.length) return;

    this.logger.log(`${daysLeft} günlük hatırlatma: ${subs.length} üye`);

    for (const sub of subs) {
      const email = sub.user?.email ?? sub.guestEmail;
      if (!email) continue;

      try {
        await this.emailService.send(
          email,
          `membership_renewal_reminder_${daysLeft}` as 'membership_renewal_reminder_30',
          {
            memberNumber: sub.memberNumber,
            expiresAt: sub.expiresAt.toLocaleDateString('tr-TR'),
            daysLeft: String(daysLeft),
            renewUrl: `${process.env['MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org'}/uyelik/yenile`,
          },
        );
        await this.membershipService.markReminderSent(sub.id, daysLeft);
      } catch (err) {
        this.logger.error(`Hatırlatma email gönderilemedi: ${sub.memberNumber}`, err);
      }
    }
  }

  private async handleExpirations() {
    const expired = await this.membershipService.expireOverdueSubscriptions();
    if (!expired.length) return;

    this.logger.log(`Süresi dolmuş ve güncellenen üyelik: ${expired.length}`);

    for (const sub of expired) {
      const email = sub.user?.email ?? sub.guestEmail;
      if (!email) continue;

      try {
        await this.emailService.send(
          email,
          'membership_expired',
          {
            memberNumber: sub.memberNumber,
            expiredAt: sub.expiresAt.toLocaleDateString('tr-TR'),
            renewUrl: `${process.env['MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org'}/uyelik/yenile`,
          },
        );
      } catch (err) {
        this.logger.error(`Üyelik sona erdi email gönderilemedi: ${sub.memberNumber}`, err);
      }
    }
  }
}
