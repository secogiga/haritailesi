import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly token = process.env['WHATSAPP_TOKEN'] ?? '';
  private readonly phoneNumberId = process.env['WHATSAPP_PHONE_NUMBER_ID'] ?? '';
  private readonly apiVersion = 'v25.0';

  private get endpoint() {
    return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  async sendText(rawPhone: string, message: string): Promise<void> {
    if (!this.token || !this.phoneNumberId) {
      this.logger.warn('whatsapp_credentials_missing, skipping');
      return;
    }

    const to = this.normalizePhone(rawPhone);
    if (!to) {
      this.logger.warn(`whatsapp_invalid_phone phone=${rawPhone}`);
      return;
    }

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        }),
      });

      const data = await res.json() as { messages?: { id: string }[]; error?: { message: string } };

      if (res.ok && data.messages?.[0]?.id) {
        this.logger.log(`whatsapp_sent to=${to} msgId=${data.messages[0].id}`);
      } else {
        this.logger.error(`whatsapp_failed to=${to} error=${data.error?.message}`);
      }
    } catch (err) {
      this.logger.error(`whatsapp_error to=${to} err=${(err as Error).message}`);
    }
  }

  async sendTemplate(rawPhone: string, templateName: string, languageCode: string, components: unknown[]): Promise<void> {
    if (!this.token || !this.phoneNumberId) {
      this.logger.warn('whatsapp_credentials_missing, skipping');
      return;
    }

    const to = this.normalizePhone(rawPhone);
    if (!to) {
      this.logger.warn(`whatsapp_invalid_phone phone=${rawPhone}`);
      return;
    }

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
      });

      const data = await res.json() as { messages?: { id: string }[]; error?: { message: string } };

      if (res.ok && data.messages?.[0]?.id) {
        this.logger.log(`whatsapp_template_sent template=${templateName} to=${to} msgId=${data.messages[0].id}`);
      } else {
        this.logger.error(`whatsapp_template_failed template=${templateName} to=${to} error=${data.error?.message}`);
      }
    } catch (err) {
      this.logger.error(`whatsapp_template_error to=${to} err=${(err as Error).message}`);
    }
  }

  private normalizePhone(rawPhone: string): string | null {
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length < 10) return null;
    // WhatsApp expects international format without +: 905XXXXXXXXX
    return digits.startsWith('90') ? digits : `90${digits.slice(-10)}`;
  }
}
