import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AutomationService } from './automation.service';
import { EmailModule } from '../email/email.module';
import { PUSH_QUEUE } from '../redis/redis.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: PUSH_QUEUE }),
    EmailModule,
  ],
  providers: [AutomationService],
})
export class AutomationModule {}
