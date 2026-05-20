import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { MembershipAlertCron } from './membership-alert.cron';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipAlertCron],
  exports: [MembershipService],
})
export class MembershipModule {}
