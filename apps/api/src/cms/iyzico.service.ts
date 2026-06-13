import { Injectable, Logger } from '@nestjs/common';

// iyzipay CommonJS modülü — dynamic import ile kullanılır
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Iyzipay = require('iyzipay') as new (opts: { apiKey: string; secretKey: string; uri: string }) => IyzipayInstance;

interface IyzipayInstance {
  checkoutFormInitialize: {
    create: (req: Record<string, unknown>, cb: (err: unknown, res: Record<string, unknown>) => void) => void;
  };
  checkoutForm: {
    retrieve: (req: Record<string, unknown>, cb: (err: unknown, res: Record<string, unknown>) => void) => void;
  };
}

@Injectable()
export class IyzicoService {
  private readonly logger = new Logger(IyzicoService.name);
  private readonly client: IyzipayInstance;
  private readonly enabled: boolean;

  constructor() {
    const apiKey    = process.env['IYZICO_API_KEY'];
    const secretKey = process.env['IYZICO_SECRET_KEY'];
    const sandbox   = process.env['IYZICO_SANDBOX'] !== 'false';

    this.enabled = !!(apiKey && secretKey);
    this.client = new Iyzipay({
      apiKey:    apiKey ?? 'sandbox',
      secretKey: secretKey ?? 'sandbox',
      uri: sandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com',
    });
  }

  get isEnabled() { return this.enabled; }

  async initCheckout(opts: {
    price: string;
    paidPrice: string;
    currency: string;
    basketId: string;
    callbackUrl: string;
    buyer: { id: string; name: string; surname: string; email: string; ip: string; city: string; country: string; identityNumber: string };
    basketItems: Array<{ id: string; name: string; category1: string; itemType: 'VIRTUAL' | 'PHYSICAL'; price: string }>;
    billingAddress: { contactName: string; city: string; country: string; address: string };
  }): Promise<{ token: string; checkoutFormContent: string; tokenExpireTime: number; status: string; errorMessage?: string }> {
    return new Promise((resolve, reject) => {
      this.client.checkoutFormInitialize.create({
        locale: 'tr',
        conversationId: opts.basketId,
        price: opts.price,
        paidPrice: opts.paidPrice,
        currency: opts.currency,
        installment: '1',
        basketId: opts.basketId,
        paymentGroup: 'PRODUCT',
        callbackUrl: opts.callbackUrl,
        enabledInstallments: ['2', '3', '6', '9'],
        buyer: {
          id: opts.buyer.id,
          name: opts.buyer.name,
          surname: opts.buyer.surname,
          gsmNumber: '+905350000000',
          email: opts.buyer.email,
          identityNumber: opts.buyer.identityNumber,
          registrationAddress: opts.billingAddress.address,
          ip: opts.buyer.ip,
          city: opts.buyer.city,
          country: opts.buyer.country,
        },
        shippingAddress: opts.billingAddress,
        billingAddress: opts.billingAddress,
        basketItems: opts.basketItems,
      }, (err, result) => {
        if (err) { reject(err); return; }
        resolve(result as ReturnType<typeof this.initCheckout> extends Promise<infer R> ? R : never);
      });
    });
  }

  async retrieveCheckout(token: string): Promise<{ status: string; conversationId: string; paymentStatus: string; paymentId?: string }> {
    return new Promise((resolve, reject) => {
      this.client.checkoutForm.retrieve({ locale: 'tr', token }, (err, result) => {
        if (err) { reject(err); return; }
        resolve(result as ReturnType<typeof this.retrieveCheckout> extends Promise<infer R> ? R : never);
      });
    });
  }
}
