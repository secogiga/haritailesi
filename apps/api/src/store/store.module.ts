import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { StoreCron } from './store.cron';
import { IyzicoService } from '../donations/iyzico.service';
import { ShippingService } from './shipping.service';
import { FraudService } from './fraud.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [StoreController],
  providers: [StoreService, IyzicoService, ShippingService, FraudService, StoreCron],
  exports: [StoreService, ShippingService, FraudService],
})
export class StoreModule {}
