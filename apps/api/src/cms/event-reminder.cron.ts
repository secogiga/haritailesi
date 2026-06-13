import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, between, eq } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { events, eventAttendances, users, userProfiles } from '@haritailesi/database';
import { EmailService } from '../email/email.service';

const WEB_URL = process.env['WEB_URL'] ?? 'https://haritailesi.org';

@Injectable()
export class EventReminderCron {
  private readonly logger = new Logger(EventReminderCron.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly emailService: EmailService,
  ) {}

  // Her saat başı çalışır — 24 saat ve 1 saat öncesi katılımcılara e-posta gönderir
  @Cron('0 * * * *', { timeZone: 'Europe/Istanbul' })
  async sendEventReminders(): Promise<void> {
    const now = new Date();

    // 24 saat ve 1 saat öncesi pencerelerini hesapla (±10 dakika)
    const windows: Array<{ label: '24h' | '1h'; hoursAhead: number }> = [
      { label: '24h', hoursAhead: 24 },
      { label: '1h', hoursAhead: 1 },
    ];

    for (const { label, hoursAhead } of windows) {
      const windowStart = new Date(now.getTime() + (hoursAhead * 60 - 10) * 60 * 1000);
      const windowEnd = new Date(now.getTime() + (hoursAhead * 60 + 10) * 60 * 1000);

      const upcomingEvents = await this.db
        .select({
          id: events.id,
          slug: events.slug,
          title: events.title,
          dateStart: events.dateStart,
          location: events.location,
          meetingUrl: events.meetingUrl,
        })
        .from(events)
        .where(
          and(
            eq(events.isPublished, true),
            eq(events.isCancelled, false),
            between(events.dateStart, windowStart, windowEnd),
          ),
        );

      for (const event of upcomingEvents) {
        const attendees = await this.db
          .select({
            userId: eventAttendances.userId,
            email: users.email,
            displayName: userProfiles.displayName,
          })
          .from(eventAttendances)
          .innerJoin(users, eq(users.id, eventAttendances.userId))
          .innerJoin(userProfiles, eq(userProfiles.userId, eventAttendances.userId))
          .where(eq(eventAttendances.eventId, event.id));

        if (attendees.length === 0) continue;

        const eventDate = new Date(event.dateStart).toLocaleString('tr-TR', {
          timeZone: 'Europe/Istanbul',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        for (const attendee of attendees) {
          await this.emailService.send(
            attendee.email,
            `event_reminder_${label}`,
            {
              displayName: attendee.displayName ?? 'Üye',
              eventTitle: event.title,
              eventDate,
              eventUrl: `${WEB_URL}/etkinlikler/${event.slug}`,
              ...(event.location ? { eventLocation: event.location } : {}),
              ...(event.meetingUrl ? { meetingUrl: event.meetingUrl } : {}),
            },
            { jobId: `event_reminder_${label}:${event.id}:${attendee.userId}` },
          );
        }

        this.logger.log(
          `Event reminder (${label}): "${event.title}" → ${attendees.length} katılımcı`,
        );
      }
    }
  }
}
