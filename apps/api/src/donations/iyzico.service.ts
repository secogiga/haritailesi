import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';

export type IyzicoAccount = 'vakif' | 'sirket';

@Injectable()
export class IyzicoService {
  private readonly logger = new Logger(IyzicoService.name);

  constructor(private config: ConfigService) {}

  private getCredentials(account: IyzicoAccount) {
    if (account === 'sirket') {
      return {
        apiKey: this.config.get<string>('IYZICO_SIRKET_API_KEY') ?? '',
        secretKey: this.config.get<string>('IYZICO_SIRKET_SECRET_KEY') ?? '',
        baseUrl: this.config.get<string>('IYZICO_SIRKET_BASE_URL') ?? 'https://sandbox-api.iyzipay.com',
      };
    }
    return {
      // vakıf — eski IYZICO_API_KEY fallback korunuyor
      apiKey: this.config.get<string>('IYZICO_VAKIF_API_KEY') ?? this.config.get<string>('IYZICO_API_KEY') ?? '',
      secretKey: this.config.get<string>('IYZICO_VAKIF_SECRET_KEY') ?? this.config.get<string>('IYZICO_SECRET_KEY') ?? '',
      baseUrl: this.config.get<string>('IYZICO_VAKIF_BASE_URL') ?? this.config.get<string>('IYZICO_BASE_URL') ?? 'https://sandbox-api.iyzipay.com',
    };
  }

  private toPKI(obj: Record<string, unknown>): string {
    const sorted = Object.keys(obj).sort();
    const parts: string[] = [];
    for (const key of sorted) {
      const val = obj[key];
      if (val === null || val === undefined) continue;
      if (Array.isArray(val)) {
        const items = val.map((v) =>
          typeof v === 'object' && v !== null
            ? `[${this.toPKI(v as Record<string, unknown>)}]`
            : String(v),
        );
        parts.push(`${key}=[${items.join(',')}]`);
      } else if (typeof val === 'object') {
        parts.push(`${key}=[${this.toPKI(val as Record<string, unknown>)}]`);
      } else {
        parts.push(`${key}=${String(val)}`);
      }
    }
    return parts.join(',');
  }

  private generateAuthHeader(
    apiKey: string,
    secretKey: string,
    body: Record<string, unknown>,
    randomStr: string,
  ): string {
    const pkiStr = this.toPKI(body);
    const data = `${randomStr}${apiKey}${secretKey}${pkiStr}`;
    const hash = createHmac('sha256', secretKey).update(data).digest('base64');
    return `IYZWS ${apiKey}:${hash}`;
  }

  // iyzico webhook imza doğrulama
  verifyWebhookSignature(account: IyzicoAccount, payload: string, signature: string): boolean {
    const { secretKey } = this.getCredentials(account);
    if (!secretKey) return false;
    const expected = createHmac('sha256', secretKey).update(payload).digest('base64');
    return expected === signature;
  }

  async initializeCheckoutForm(
    account: IyzicoAccount,
    params: {
      conversationId: string;
      price: string;
      paidPrice: string;
      callbackUrl: string;
      basketName: string;
      basketCategory: string;
      buyer: {
        id: string;
        name: string;
        surname: string;
        email: string;
        identityNumber?: string;
        registrationAddress?: string;
        ip: string;
        city?: string;
        country?: string;
      };
    },
  ): Promise<{ status: string; checkoutFormContent?: string; token?: string; errorMessage?: string }> {
    const { apiKey, secretKey, baseUrl } = this.getCredentials(account);

    if (!apiKey || !secretKey) {
      this.logger.warn(`iyzico [${account}] credentials not configured — returning mock`);
      return { status: 'mock', checkoutFormContent: '<div>iyzico sandbox not configured</div>', token: 'mock-token' };
    }

    const randomStr = randomBytes(8).toString('hex');
    const body = {
      locale: 'tr',
      conversationId: params.conversationId,
      price: params.price,
      paidPrice: params.paidPrice,
      currency: 'TRY',
      basketId: params.conversationId,
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: params.callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: params.buyer.id,
        name: params.buyer.name,
        surname: params.buyer.surname,
        email: params.buyer.email,
        identityNumber: params.buyer.identityNumber ?? '11111111111',
        registrationAddress: params.buyer.registrationAddress ?? 'Türkiye',
        ip: params.buyer.ip,
        city: params.buyer.city ?? 'Istanbul',
        country: params.buyer.country ?? 'Turkey',
      },
      shippingAddress: {
        contactName: `${params.buyer.name} ${params.buyer.surname}`,
        city: params.buyer.city ?? 'Istanbul',
        country: params.buyer.country ?? 'Turkey',
        address: params.buyer.registrationAddress ?? 'Türkiye',
      },
      billingAddress: {
        contactName: `${params.buyer.name} ${params.buyer.surname}`,
        city: params.buyer.city ?? 'Istanbul',
        country: params.buyer.country ?? 'Turkey',
        address: params.buyer.registrationAddress ?? 'Türkiye',
      },
      basketItems: [{
        id: params.conversationId,
        name: params.basketName,
        price: params.price,
        category1: params.basketCategory,
        itemType: 'VIRTUAL',
      }],
    };

    const authHeader = this.generateAuthHeader(apiKey, secretKey, body, randomStr);

    try {
      const res = await fetch(`${baseUrl}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'x-iyzi-rnd': randomStr,
          'x-iyzi-client-version': 'iyzipay-node-custom-1.0.0',
        },
        body: JSON.stringify(body),
      });
      return res.json() as Promise<{ status: string; checkoutFormContent?: string; token?: string; errorMessage?: string }>;
    } catch (err) {
      this.logger.error(`iyzico [${account}] API call failed`, err);
      return { status: 'error', errorMessage: 'iyzico servisi ulaşılamıyor' };
    }
  }

  async initializeStoreCheckout(params: {
    conversationId: string;
    items: Array<{
      id: string;
      name: string;
      price: string;
      itemType: 'PHYSICAL' | 'VIRTUAL';
      subMerchantKey?: string;
      subMerchantPrice?: string;
    }>;
    totalPrice: string;
    callbackUrl: string;
    buyer: { id: string; name: string; surname: string; email: string; ip: string; phone?: string };
    shippingAddress?: { name: string; address: string; city: string; country?: string };
  }): Promise<{ status: string; checkoutFormContent?: string; token?: string; errorMessage?: string }> {
    const { apiKey, secretKey, baseUrl } = this.getCredentials('sirket');

    if (!apiKey || !secretKey) {
      this.logger.warn('iyzico [sirket] credentials not configured — returning mock');
      return { status: 'mock', checkoutFormContent: '<div class="iyzico-mock"><p>Sandbox modu: ödeme simüle edildi.</p><button onclick="window.location.href=window.location.origin+\'/magaza/odeme-sonuc?mock=1\'">Ödemeyi Tamamla (Test)</button></div>', token: 'mock-token' };
    }

    const hasMarketplace = params.items.some(i => i.subMerchantKey);
    const randomStr = randomBytes(8).toString('hex');

    const body: Record<string, unknown> = {
      locale: 'tr',
      conversationId: params.conversationId,
      price: params.totalPrice,
      paidPrice: params.totalPrice,
      currency: 'TRY',
      basketId: params.conversationId,
      paymentGroup: 'PRODUCT',
      callbackUrl: params.callbackUrl,
      enabledInstallments: [1, 2, 3],
      buyer: {
        id: params.buyer.id,
        name: params.buyer.name,
        surname: params.buyer.surname,
        email: params.buyer.email,
        identityNumber: '11111111111',
        registrationAddress: params.shippingAddress?.address ?? 'Türkiye',
        ip: params.buyer.ip,
        city: params.shippingAddress?.city ?? 'Istanbul',
        country: params.shippingAddress?.country ?? 'Turkey',
        ...(params.buyer.phone ? { gsmNumber: params.buyer.phone } : {}),
      },
      shippingAddress: {
        contactName: `${params.buyer.name} ${params.buyer.surname}`,
        city: params.shippingAddress?.city ?? 'Istanbul',
        country: params.shippingAddress?.country ?? 'Turkey',
        address: params.shippingAddress?.address ?? 'Türkiye',
        zipCode: '34000',
      },
      billingAddress: {
        contactName: `${params.buyer.name} ${params.buyer.surname}`,
        city: params.shippingAddress?.city ?? 'Istanbul',
        country: params.shippingAddress?.country ?? 'Turkey',
        address: params.shippingAddress?.address ?? 'Türkiye',
      },
      basketItems: params.items.map(item => ({
        id: item.id,
        name: item.name.slice(0, 128),
        price: item.price,
        category1: 'Mağaza',
        itemType: item.itemType,
        ...(item.subMerchantKey ? { subMerchantKey: item.subMerchantKey, subMerchantPrice: item.subMerchantPrice } : {}),
      })),
    };

    if (hasMarketplace) {
      body['paymentSource'] = 'MARKETPLACE';
    }

    const authHeader = this.generateAuthHeader(apiKey, secretKey, body, randomStr);

    try {
      const res = await fetch(`${baseUrl}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'x-iyzi-rnd': randomStr,
          'x-iyzi-client-version': 'iyzipay-node-custom-1.0.0',
        },
        body: JSON.stringify(body),
      });
      return res.json() as Promise<{ status: string; checkoutFormContent?: string; token?: string; errorMessage?: string }>;
    } catch (err) {
      this.logger.error('iyzico store checkout failed', err);
      return { status: 'error', errorMessage: 'iyzico servisi ulaşılamıyor' };
    }
  }

  async refundPayment(
    account: IyzicoAccount,
    params: { paymentTransactionId: string; price: string; conversationId: string },
  ): Promise<{ status: string; refundConversationId?: string; errorMessage?: string }> {
    const { apiKey, secretKey, baseUrl } = this.getCredentials(account);

    if (!apiKey || !secretKey) {
      this.logger.warn(`iyzico [${account}] credentials not configured — mock refund`);
      return { status: 'success', refundConversationId: `mock-refund-${Date.now()}` };
    }

    const randomStr = randomBytes(8).toString('hex');
    const body = {
      locale: 'tr',
      conversationId: params.conversationId,
      paymentTransactionId: params.paymentTransactionId,
      price: params.price,
      currency: 'TRY',
      ip: '127.0.0.1',
    };
    const authHeader = this.generateAuthHeader(apiKey, secretKey, body, randomStr);

    try {
      const res = await fetch(`${baseUrl}/payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'x-iyzi-rnd': randomStr,
          'x-iyzi-client-version': 'iyzipay-node-custom-1.0.0',
        },
        body: JSON.stringify(body),
      });
      return res.json() as Promise<{ status: string; refundConversationId?: string; errorMessage?: string }>;
    } catch (err) {
      this.logger.error(`iyzico [${account}] refund failed`, err);
      return { status: 'error', errorMessage: 'iyzico iade servisi ulaşılamıyor' };
    }
  }

  async checkBin(
    account: IyzicoAccount,
    binNumber: string,
  ): Promise<{ status: string; cardType?: string; cardAssociation?: string; cardFamily?: string; bankName?: string; installmentDetails?: Array<{ installmentCount: number; installmentPrice: string; totalPrice: string }> }> {
    const { apiKey, secretKey, baseUrl } = this.getCredentials(account);

    if (!apiKey || !secretKey) {
      return {
        status: 'mock',
        cardType: 'CREDIT_CARD',
        installmentDetails: [
          { installmentCount: 1, installmentPrice: '0', totalPrice: '0' },
          { installmentCount: 2, installmentPrice: '0', totalPrice: '0' },
          { installmentCount: 3, installmentPrice: '0', totalPrice: '0' },
          { installmentCount: 6, installmentPrice: '0', totalPrice: '0' },
        ],
      };
    }

    const randomStr = randomBytes(8).toString('hex');
    const body = { locale: 'tr', conversationId: randomStr, binNumber, price: '1.00', currency: 'TRY' };
    const authHeader = this.generateAuthHeader(apiKey, secretKey, body, randomStr);

    try {
      const res = await fetch(`${baseUrl}/payment/bin/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'x-iyzi-rnd': randomStr,
          'x-iyzi-client-version': 'iyzipay-node-custom-1.0.0',
        },
        body: JSON.stringify(body),
      });
      return res.json() as Promise<{ status: string; cardType?: string; installmentDetails?: { installmentCount: number; installmentPrice: string; totalPrice: string }[] }>;
    } catch {
      return { status: 'error' };
    }
  }

  async retrieveCheckoutForm(
    account: IyzicoAccount,
    token: string,
  ): Promise<{ status: string; paymentId?: string; paymentStatus?: string; conversationId?: string; errorMessage?: string }> {
    const { apiKey, secretKey, baseUrl } = this.getCredentials(account);

    if (!apiKey || !secretKey) return { status: 'mock', paymentStatus: 'SUCCESS' };

    const randomStr = randomBytes(8).toString('hex');
    const body = { locale: 'tr', conversationId: token, token };
    const authHeader = this.generateAuthHeader(apiKey, secretKey, body, randomStr);

    try {
      const res = await fetch(`${baseUrl}/payment/iyzipos/checkoutform/auth/ecom/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'x-iyzi-rnd': randomStr,
          'x-iyzi-client-version': 'iyzipay-node-custom-1.0.0',
        },
        body: JSON.stringify(body),
      });
      return res.json() as Promise<{ status: string; paymentId?: string; paymentStatus?: string; conversationId?: string }>;
    } catch {
      return { status: 'error' };
    }
  }
}
