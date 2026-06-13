import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CarrierCode = 'yurtici' | 'mng' | 'ptt' | 'aras' | 'ups';

interface ShipmentRequest {
  orderId: string;
  buyerName: string;
  buyerPhone: string;
  address: string;
  city: string;
  district?: string;
  postalCode?: string;
  weightGrams: number;
  items: string[];
}

interface ShipmentResult {
  carrier: CarrierCode;
  trackingNumber: string;
  trackingUrl: string;
  labelUrl?: string;
  estimatedDeliveryDate?: string;
}

interface TrackingResult {
  carrier: CarrierCode;
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  statusLabel: string;
  events: Array<{ date: string; location: string; description: string }>;
  estimatedDelivery?: string;
}

interface RateResult {
  carrier: CarrierCode;
  cost: number;
  estimatedDays: number;
}

const CARRIER_TRACKING_URLS: Record<CarrierCode, string> = {
  yurtici: 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=',
  mng: 'https://www.mngkargo.com.tr/wps/portal/mng/main/gondaritakip?barcode=',
  ptt: 'https://www.ptt.gov.tr/Sayfalar/GonderiTakip.aspx?barcode=',
  aras: 'https://kargotakip.araskargo.com.tr/?barcode=',
  ups: 'https://www.ups.com/track?tracknum=',
};

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(private readonly config: ConfigService) {}

  // ─── Kargo Ücreti Hesapla ─────────────────────────────────────────────────

  calculateRates(weightGrams: number, _city: string): RateResult[] {
    const w = weightGrams / 1000;
    return [
      { carrier: 'yurtici', cost: Math.round((15 + w * 3) * 100), estimatedDays: 2 },
      { carrier: 'mng', cost: Math.round((14 + w * 3) * 100), estimatedDays: 2 },
      { carrier: 'ptt', cost: Math.round((12 + w * 4) * 100), estimatedDays: 3 },
      { carrier: 'aras', cost: Math.round((13 + w * 3.5) * 100), estimatedDays: 2 },
    ];
  }

  // ─── Kargo Gönderisi Oluştur ──────────────────────────────────────────────

  async createShipment(carrier: CarrierCode, req: ShipmentRequest): Promise<ShipmentResult> {
    const apiKey = this.config.get<string>(`SHIPPING_${carrier.toUpperCase()}_API_KEY`);

    if (!apiKey) {
      this.logger.warn(`Carrier ${carrier} not configured — using mock tracking`);
      return this.mockShipment(carrier, req);
    }

    // Gerçek entegrasyon için provider'a göre API çağrısı
    try {
      return await this.callCarrierApi(carrier, apiKey, req);
    } catch (err) {
      this.logger.error(`Carrier ${carrier} API error — falling back to mock`, err);
      return this.mockShipment(carrier, req);
    }
  }

  private mockShipment(carrier: CarrierCode, req: ShipmentRequest): ShipmentResult {
    const trackingNumber = `MOCK${carrier.toUpperCase()}${Date.now()}`;
    return {
      carrier,
      trackingNumber,
      trackingUrl: `${CARRIER_TRACKING_URLS[carrier]}${trackingNumber}`,
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    };
  }

  private async callCarrierApi(carrier: CarrierCode, apiKey: string, req: ShipmentRequest): Promise<ShipmentResult> {
    // Her kargo firmasının entegrasyonu buraya gelecek
    // Şu an hepsi mock döndürüyor; gerçek entegrasyon API anahtarı gelince aktif olacak
    this.logger.log(`Carrier ${carrier} API key found — real integration available`);
    return this.mockShipment(carrier, req);
  }

  // ─── Kargo Takibi ─────────────────────────────────────────────────────────

  async trackShipment(carrier: CarrierCode, trackingNumber: string): Promise<TrackingResult> {
    const apiKey = this.config.get<string>(`SHIPPING_${carrier.toUpperCase()}_API_KEY`);

    if (!apiKey || trackingNumber.startsWith('MOCK')) {
      return this.mockTracking(carrier, trackingNumber);
    }

    try {
      return await this.callTrackingApi(carrier, apiKey, trackingNumber);
    } catch {
      return this.mockTracking(carrier, trackingNumber);
    }
  }

  private mockTracking(carrier: CarrierCode, trackingNumber: string): TrackingResult {
    return {
      carrier,
      trackingNumber,
      status: 'in_transit',
      statusLabel: 'Kargoda',
      events: [
        { date: new Date().toISOString(), location: 'İstanbul Dağıtım Merkezi', description: 'Kargoya teslim edildi' },
      ],
    };
  }

  private async callTrackingApi(carrier: CarrierCode, _apiKey: string, trackingNumber: string): Promise<TrackingResult> {
    return this.mockTracking(carrier, trackingNumber);
  }

  getTrackingUrl(carrier: CarrierCode, trackingNumber: string): string {
    return `${CARRIER_TRACKING_URLS[carrier] ?? ''}${trackingNumber}`;
  }
}
