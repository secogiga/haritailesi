import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ApplicationsService } from './applications.service';
import { EmailService } from '../email/email.service';

const STATE_LABEL: Record<string, string> = {
  submitted:        'Yeni Başvuru',
  under_review:     'Ön İnceleme',
  interview_needed: 'Görüşme Bekliyor',
  waiting_payment:  'Ödeme Bekliyor',
  approved:         'Onaylandı',
};

const TYPE_LABEL: Record<string, string> = {
  individual:            'Bireysel',
  corporate:             'Kurumsal',
  meslegin_gelecekleri:  'Mesleğin Geleceği',
  haritailesi_genc:      'Haritailesi Genç',
};

@Injectable()
export class ApplicationSlaCron {
  private readonly logger = new Logger(ApplicationSlaCron.name);

  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly emailService: EmailService,
  ) {}

  // Her gün 09:15 İstanbul saatiyle çalışır
  @Cron('15 9 * * *', { timeZone: 'Europe/Istanbul' })
  async checkSla() {
    this.logger.log('Başvuru SLA kontrolü başlatıldı…');

    const stuck = await this.applicationsService.getStuckApplications();
    if (!stuck.length) {
      this.logger.log('SLA ihlali yok.');
      return;
    }

    this.logger.warn(`${stuck.length} başvuru SLA süresi aşıldı.`);

    const adminEmail = process.env['ADMIN_ALERT_EMAIL'] ?? 'admin@haritailesi.org';
    const adminUrl   = `${process.env['ADMIN_URL'] ?? 'https://admin.haritailesi.org'}/basvurular`;

    const rows = stuck.map((a) => {
      const name = String(a.formData['adSoyad'] ?? a.applicantEmail);
      const stateLabel = STATE_LABEL[a.state] ?? a.state;
      const typeLabel  = TYPE_LABEL[a.type]  ?? a.type;
      const color = a.daysStuck >= 7 ? '#dc2626' : '#d97706';
      return `<tr><td style="padding:7px 12px;border:1px solid #e5e7eb">${name}</td><td style="padding:7px 12px;border:1px solid #e5e7eb">${typeLabel}</td><td style="padding:7px 12px;border:1px solid #e5e7eb">${stateLabel}</td><td style="padding:7px 12px;border:1px solid #e5e7eb;text-align:right;color:${color};font-weight:600">${a.daysStuck} gün</td></tr>`;
    }).join('');

    try {
      await this.emailService.send(
        adminEmail,
        'application_sla_alert',
        { rows, adminUrl },
        { jobId: `sla_alert:${new Date().toISOString().slice(0, 10)}` },
      );
      this.logger.log(`SLA uyarı e-postası gönderildi → ${adminEmail}`);
    } catch (err) {
      this.logger.error('SLA e-posta gönderilemedi', err);
    }
  }
}
