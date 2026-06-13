import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, RawBodyRequest, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CmsService } from './cms.service';
import { IyzicoService } from './iyzico.service';
import { RequirePermission } from '../rbac/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { Public } from '../auth/decorators/public.decorator';

const MUTFAK_URL = process.env['MUTFAK_URL'] ?? 'https://mutfak.haritailesi.org';

@Controller('cms/payments/iyzico')
export class IyzicoController {
  constructor(
    private readonly cmsService: CmsService,
    private readonly iyzicoService: IyzicoService,
  ) {}

  @Get('status')
  @Public()
  status() {
    return { enabled: this.iyzicoService.isEnabled };
  }

  @Post('checkout/:trainingId')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.OK)
  async initCheckout(
    @Param('trainingId', ParseUUIDPipe) trainingId: string,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const training = await this.cmsService.getTrainingById(trainingId);
    if (!training.price) return { error: 'Bu kurs ücretsizdir.' };
    if (!this.iyzicoService.isEnabled) return { error: 'Ödeme sistemi aktif değil. Lütfen havale/EFT seçeneğini kullanın.' };

    const profile = await this.cmsService.getUserProfile(user.id);
    const nameParts = (profile?.displayName ?? 'Üye Üye').split(' ');
    const name    = nameParts[0] ?? 'Üye';
    const surname = nameParts.slice(1).join(' ') || 'Üye';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? '127.0.0.1';

    const priceStr = (training.price ?? '0').replace(/[^\d.,]/g, '').replace(',', '.');
    const callbackUrl = `${MUTFAK_URL}/egitim/${training.slug}?iyzico_return=1&trainingId=${trainingId}`;

    const result = await this.iyzicoService.initCheckout({
      price: priceStr,
      paidPrice: priceStr,
      currency: 'TRY',
      basketId: `order_${user.id}_${trainingId}_${Date.now()}`,
      callbackUrl,
      buyer: {
        id: user.id,
        name,
        surname,
        email: user.email,
        ip,
        city: 'İstanbul',
        country: 'Turkey',
        identityNumber: '11111111111',
      },
      basketItems: [{
        id: trainingId,
        name: training.title,
        category1: 'Eğitim',
        itemType: 'VIRTUAL',
        price: priceStr,
      }],
      billingAddress: {
        contactName: profile?.displayName ?? 'Üye',
        city: 'İstanbul',
        country: 'Turkey',
        address: 'Türkiye',
      },
    });

    if (result.status !== 'success') {
      return { error: result.errorMessage ?? 'Ödeme başlatılamadı.' };
    }

    return {
      token: result.token,
      checkoutFormContent: result.checkoutFormContent,
      tokenExpireTime: result.tokenExpireTime,
    };
  }

  @Post('callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  async callback(@Body() body: { token: string; trainingId?: string }) {
    if (!body.token) return { status: 'error' };

    const result = await this.iyzicoService.retrieveCheckout(body.token).catch(() => null);
    if (!result || result.paymentStatus !== 'SUCCESS') {
      return { status: 'failed' };
    }

    const conversationId = result.conversationId as string;
    const parts = conversationId.split('_');
    const userId     = parts[1];
    const trainingId = parts[2];

    if (userId && trainingId) {
      await this.cmsService.enrollCourse(userId, trainingId).catch(() => {});
    }

    return { status: 'success' };
  }
}
