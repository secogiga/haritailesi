import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly username = process.env['NETGSM_USERNAME'] ?? '';
  private readonly password = process.env['NETGSM_PASSWORD'] ?? '';
  private readonly header   = process.env['NETGSM_HEADER'] ?? 'Haritailesi';
  private readonly endpoint = 'https://api.netgsm.com.tr/sms/rest/v2/send';

  async send(rawPhone: string, message: string): Promise<void> {
    if (!this.username || !this.password) {
      this.logger.warn('netgsm_credentials_missing, skipping SMS');
      return;
    }

    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      this.logger.warn(`sms_invalid_phone phone=${rawPhone}`);
      return;
    }
    // Netgsm v2 expects local format (5XXXXXXXXX), not international
    const gsm = digits.startsWith('90') ? digits.slice(2) : digits.slice(-10);

    const basicAuth = Buffer.from(`${this.username}:${this.password}`).toString('base64');

    const body = {
      msgheader: this.header,
      messages: [{ msg: message, no: gsm }],
      encoding: 'TR',
      iysfilter: '0',
      appname: 'haritailesi',
    };

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json() as { code?: string; error?: string; jobid?: string };

      if (res.ok && (data.code === '00' || data.jobid)) {
        this.logger.log(`sms_sent gsm=${gsm} jobid=${data.jobid ?? '-'}`);
      } else {
        this.logger.error(`sms_failed gsm=${gsm} code=${data.code} error=${data.error}`);
      }
    } catch (err) {
      this.logger.error(`sms_error gsm=${gsm} err=${(err as Error).message}`);
    }
  }
}
