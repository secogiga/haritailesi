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
