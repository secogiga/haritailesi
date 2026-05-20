import { Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { IyzicoService } from './iyzico.service';
import { MembershipModule } from '../membership/membership.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [MembershipModule, StorageModule],
  controllers: [DonationsController],
  providers: [DonationsService, IyzicoService],
  exports: [DonationsService, IyzicoService],
})
export class DonationsModule {}
