import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import { SubscribeDto } from './subscribe.dto';

@Public()
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly config: ConfigService) {}

  @Post('subscribe')
  @HttpCode(200)
  async subscribe(@Body() dto: SubscribeDto) {
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    const rawListId = this.config.get<string>('BREVO_NEWSLETTER_LIST_ID');

    const body: Record<string, unknown> = {
      email: dto.email,
      updateEnabled: true,
    };
    if (rawListId) body['listIds'] = [Number(rawListId)];

    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey ?? '',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return { ok: false };
    return { ok: true };
  }
}
