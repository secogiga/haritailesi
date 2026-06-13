import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StoreService } from './store.service';
import { IyzicoService } from '../donations/iyzico.service';

@Injectable()
export class StoreCron {
  private readonly logger = new Logger(StoreCron.name);

  constructor(
    private readonly storeService: StoreService,
    private readonly iyzicoService: IyzicoService,
  ) {}

  @Cron('0 * * * *') // Her saat başı
  async sendAbandonedCartReminders() {
    const result = await this.storeService.sendAbandonedCartReminders();
    if (result.sent > 0) this.logger.log(`Abandoned cart: ${result.sent} reminder sent`);
  }

  @Cron('0 2 * * *') // Her gün 02:00'de
  async releaseExpiredPayouts() {
    const result = await this.storeService.releaseExpiredPayouts();
    if (result.released > 0) this.logger.log(`Escrow auto-release: ${result.released} item(s) released`);
  }

  @Cron('0 6 * * *') // Her gün 06:00'da
  async processSubscriptionBilling() {
    const result = await this.storeService.processSubscriptionBilling(this.iyzicoService);
    if (result.total > 0) this.logger.log(`Subscription billing: ${result.billed} billed, ${result.failed} failed / ${result.total} total`);
  }
}
