import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { WeeklyDigestService } from './weekly-digest.service';
import { EMAIL_QUEUE } from '../redis/redis.constants';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
    DatabaseModule,
  ],
  providers: [EmailService, EmailProcessor, WeeklyDigestService],
  exports: [EmailService],
})
export class EmailModule {}
